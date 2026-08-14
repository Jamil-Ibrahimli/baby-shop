import "server-only";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { CART_COOKIE, type CartVM, type CartItemVM } from "@/lib/cart-types";
import { discountPercent, hasDiscount, savingsMinor } from "@/lib/discount";
import type { Locale } from "@/i18n/routing";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 180; // 180 дней

// Чтение токена гостевой корзины (RSC-безопасно).
export async function readCartToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(CART_COOKIE)?.value ?? null;
}

// Чтение/создание токена + установка куки. Только в Server Action / Route Handler.
export async function getOrCreateCartToken(): Promise<string> {
  const store = await cookies();
  const existing = store.get(CART_COOKIE)?.value;
  if (existing) return existing;
  const token = crypto.randomUUID();
  store.set(CART_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  return token;
}

async function currentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

// Активная корзина: пользовательская (если вошёл) ИЛИ гостевая (по токену). Создаёт при отсутствии.
export async function getOrCreateActiveCart() {
  const userId = await currentUserId();
  if (userId) {
    return prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }
  const token = await getOrCreateCartToken();
  return prisma.cart.upsert({
    where: { sessionToken: token },
    update: {},
    create: { sessionToken: token },
  });
}

// Фильтр активной корзины для чтения (без создания). null — если корзины ещё нет.
async function activeCartFilter(): Promise<
  { userId: string } | { sessionToken: string } | null
> {
  const userId = await currentUserId();
  if (userId) return { userId };
  const token = await readCartToken();
  return token ? { sessionToken: token } : null;
}

// Проверка владения корзиной (для мутаций из action-ов).
export async function userOwnsCart(cart: {
  userId: string | null;
  sessionToken: string | null;
}): Promise<boolean> {
  const userId = await currentUserId();
  if (userId) return cart.userId === userId;
  const token = await readCartToken();
  return !!token && cart.sessionToken === token;
}

// Активная корзина с позициями (для оформления заказа). null — если пусто.
export async function getActiveCartWithItems() {
  const filter = await activeCartFilter();
  if (!filter) return null;
  return prisma.cart.findUnique({
    where: filter,
    include: { items: true },
  });
}

// Суммарное количество товаров (для счётчика в шапке).
export async function getCartCount(): Promise<number> {
  const filter = await activeCartFilter();
  if (!filter) return 0;
  const agg = await prisma.cartItem.aggregate({
    where: { cart: filter },
    _sum: { quantity: true },
  });
  return agg._sum.quantity ?? 0;
}

// Сколько единиц каждого варианта уже лежит в корзине. Нужно странице товара,
// чтобы кнопка «В корзину» знала, можно ли добавить ещё (остаток считается
// по конкретному варианту: размер+цвет). Склад при этом не резервируется.
export async function getCartQuantitiesByVariant(
  variantIds: string[],
): Promise<Record<string, number>> {
  if (variantIds.length === 0) return {};
  const filter = await activeCartFilter();
  if (!filter) return {};

  const items = await prisma.cartItem.findMany({
    where: { cart: filter, variantId: { in: variantIds } },
    select: { variantId: true, quantity: true },
  });

  const map: Record<string, number> = {};
  for (const i of items) map[i.variantId] = i.quantity;
  return map;
}

function emptyCart(): CartVM {
  return {
    items: [],
    subtotalMinor: 0,
    savingsMinor: 0,
    count: 0,
    hasIssues: false,
  };
}

// Полная корзина с пересчётом доступности/цены (обработка граничных случаев).
export async function getCart(locale: Locale): Promise<CartVM> {
  const filter = await activeCartFilter();
  if (!filter) return emptyCart();

  const cart = await prisma.cart.findUnique({
    where: filter,
    include: {
      items: {
        orderBy: { createdAt: "asc" },
        include: {
          variant: {
            include: {
              product: {
                include: {
                  images: { orderBy: { sortOrder: "asc" }, take: 1 },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!cart) return emptyCart();

  const az = locale === "az";

  const items: CartItemVM[] = cart.items.map((ci) => {
    const v = ci.variant;
    const p = v.product;
    const available = p.isPublished && v.isActive && v.stock > 0;
    const effectiveQty = available ? Math.min(ci.quantity, v.stock) : 0;
    const img = p.images[0];
    return {
      id: ci.id,
      variantId: v.id,
      productSlug: p.slug,
      name: az ? p.nameAz : p.nameRu,
      sizeLabel: az ? v.sizeLabelAz : v.sizeLabelRu,
      color: az ? v.colorAz : v.colorRu,
      colorHex: v.colorHex,
      imageUrl: img?.url ?? null,
      imageAlt: (az ? img?.altAz : img?.altRu) || (az ? p.nameAz : p.nameRu),
      unitPriceMinor: v.price,
      compareAtMinor: hasDiscount(v.price, v.compareAtPrice)
        ? v.compareAtPrice
        : null,
      discountPercent: discountPercent(v.price, v.compareAtPrice),
      quantity: ci.quantity,
      maxStock: v.stock,
      lineTotalMinor: v.price * effectiveQty,
      available,
      quantityReduced: available && ci.quantity > v.stock,
      priceChanged: ci.priceSnapshot > 0 && ci.priceSnapshot !== v.price,
    };
  });

  return {
    items,
    subtotalMinor: items.reduce((s, i) => s + i.lineTotalMinor, 0),
    // Экономия считается только по позициям, которые реально можно купить.
    savingsMinor: items.reduce(
      (s, i) =>
        i.available
          ? s +
            savingsMinor(i.unitPriceMinor, i.compareAtMinor) *
              Math.min(i.quantity, i.maxStock)
          : s,
      0,
    ),
    count: items.reduce((s, i) => s + i.quantity, 0),
    hasIssues: items.some((i) => !i.available || i.quantityReduced),
  };
}

// Слияние гостевой корзины с корзиной пользователя (вызывается при входе/регистрации).
// Складывает количества по совпадающим вариантам и удаляет гостевую корзину.
export async function mergeGuestCartIntoUserCart(
  token: string,
  userId: string,
): Promise<void> {
  const guest = await prisma.cart.findUnique({
    where: { sessionToken: token },
    include: { items: true },
  });
  if (!guest || guest.items.length === 0) return;

  const userCart = await prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });

  for (const item of guest.items) {
    const existing = await prisma.cartItem.findUnique({
      where: {
        cartId_variantId: { cartId: userCart.id, variantId: item.variantId },
      },
    });
    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + item.quantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: userCart.id,
          variantId: item.variantId,
          quantity: item.quantity,
          priceSnapshot: item.priceSnapshot,
        },
      });
    }
  }

  await prisma.cart.delete({ where: { id: guest.id } });
}

"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getActiveCartWithItems } from "@/lib/cart";
import { notifyNewOrder, type OrderNotificationData } from "@/lib/notifications";
import { brand } from "@/config/brand";
import { routing } from "@/i18n/routing";
import { hasLocale } from "next-intl";

// При успехе placeOrder делает серверный redirect и ничего не возвращает;
// на клиент возвращается только ошибка (код переводится: Checkout.Errors.*).
export type PlaceOrderState = {
  error?: string;
};

// Ошибка оформления с кодом (переводится на клиенте: Checkout.Errors.*).
class CheckoutError extends Error {
  constructor(public code: string) {
    super(code);
  }
}

function makeOrderNumber(): string {
  const ymd = new Date().toISOString().slice(2, 10).replace(/-/g, ""); // yymmdd
  const rand = crypto.randomUUID().split("-")[0].toUpperCase();
  return `BS-${ymd}-${rand}`;
}

function required(v: FormDataEntryValue | null): string {
  return String(v ?? "").trim();
}

export async function placeOrder(
  _prev: PlaceOrderState,
  formData: FormData,
): Promise<PlaceOrderState> {
  // Корзина
  const cart = await getActiveCartWithItems();
  if (!cart || cart.items.length === 0) {
    return { error: "empty_cart" };
  }

  // Контакты и адрес
  const customerName = required(formData.get("name"));
  const customerPhone = required(formData.get("phone"));
  const customerEmail = required(formData.get("email"));
  const shipCity = required(formData.get("city"));
  const shipLine1 = required(formData.get("line1"));
  const shipLine2 = required(formData.get("line2"));
  const shipCountry = required(formData.get("country"));
  const shipPostalCode = required(formData.get("postalCode"));
  const comment = required(formData.get("comment"));
  const isGift = formData.get("isGift") === "on";
  const giftMessage = required(formData.get("giftMessage"));

  const rawLocale = required(formData.get("locale"));
  const locale = hasLocale(routing.locales, rawLocale)
    ? rawLocale
    : routing.defaultLocale;

  if (!customerName || !customerPhone || !shipCity || !shipLine1) {
    return { error: "invalid_form" };
  }

  const session = await auth();
  const orderNumber = makeOrderNumber();

  let created: { id: string; items: OrderNotificationData["items"] };

  try {
    created = await prisma.$transaction(async (tx) => {
      let subtotal = 0;
      const orderItemsData = [];

      for (const item of cart.items) {
        // Свежее чтение варианта — проверка наличия и цены на момент заказа (снапшот).
        const v = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          include: {
            product: {
              include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
            },
          },
        });
        if (
          !v ||
          !v.isActive ||
          !v.product.isPublished ||
          v.stock < item.quantity
        ) {
          throw new CheckoutError("unavailable");
        }

        const lineTotal = v.price * item.quantity;
        subtotal += lineTotal;

        orderItemsData.push({
          variantId: v.id,
          productId: v.productId,
          productNameRu: v.product.nameRu,
          productNameAz: v.product.nameAz,
          sizeLabelRu: v.sizeLabelRu,
          sizeLabelAz: v.sizeLabelAz,
          colorRu: v.colorRu,
          colorAz: v.colorAz,
          sku: v.sku,
          imageUrl: v.product.images[0]?.url ?? null,
          unitPrice: v.price,
          quantity: item.quantity,
          lineTotal,
        });

        // Списываем остаток (резерв под заказ).
        await tx.productVariant.update({
          where: { id: v.id },
          data: { stock: { decrement: item.quantity } },
        });
      }

      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: session?.user?.id ?? null,
          status: "created",
          customerName,
          customerPhone,
          customerEmail: customerEmail || null,
          shipCountry: shipCountry || null,
          shipCity,
          shipLine1,
          shipLine2: shipLine2 || null,
          shipPostalCode: shipPostalCode || null,
          isGift,
          giftMessage: isGift ? giftMessage || null : null,
          comment: comment || null,
          currency: brand.currency,
          subtotal,
          shippingCost: 0,
          total: subtotal,
          paymentStatus: "unpaid",
          locale,
          items: { create: orderItemsData },
        },
        include: { items: true },
      });

      // Очищаем корзину после успешного заказа.
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return {
        id: order.id,
        items: order.items.map((i) => ({
          productNameRu: i.productNameRu,
          sizeLabelRu: i.sizeLabelRu,
          colorRu: i.colorRu,
          quantity: i.quantity,
          lineTotal: i.lineTotal,
        })),
        subtotal: order.subtotal,
      } as { id: string; items: OrderNotificationData["items"]; subtotal: number };
    });
  } catch (e) {
    if (e instanceof CheckoutError) return { error: e.code };
    throw e;
  }

  // Уведомления — вне транзакции, best-effort (не ломают заказ).
  await notifyNewOrder({
    id: created.id,
    orderNumber,
    customerName,
    customerPhone,
    customerEmail: customerEmail || null,
    shipCity,
    shipLine1,
    shipLine2: shipLine2 || null,
    shipPostalCode: shipPostalCode || null,
    isGift,
    giftMessage: isGift ? giftMessage || null : null,
    comment: comment || null,
    total: created.items.reduce((s, i) => s + i.lineTotal, 0),
    currency: brand.currency,
    items: created.items,
  });

  // Кука для доступа к странице подтверждения гостю (короткоживущая).
  const store = await cookies();
  store.set("last_order", orderNumber, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  // Серверный редирект: Set-Cookie и переход уходят одним ответом, поэтому кука
  // гарантированно доступна при рендере страницы подтверждения. Это надёжнее
  // клиентского router.replace, при котором кука из Server Action не успевала
  // примениться к запросу навигации (гость/покупатель получали 404).
  redirect(`/${locale}/order/${orderNumber}`);
}

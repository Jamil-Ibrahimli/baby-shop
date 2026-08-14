"use server";

import { prisma } from "@/lib/prisma";
import { getOrCreateActiveCart, userOwnsCart } from "@/lib/cart";
import type { AddToCartResult } from "@/lib/cart-types";

// Добавление варианта в корзину. Уважает остаток: не даёт добавить больше, чем есть.
export async function addToCart(
  variantId: string,
  quantity = 1,
): Promise<AddToCartResult> {
  const qty = Math.max(1, Math.floor(quantity));

  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { product: { select: { isPublished: true } } },
  });
  if (!variant || !variant.isActive || !variant.product.isPublished) {
    return { ok: false, reason: "not_found" };
  }
  if (variant.stock <= 0) {
    return { ok: false, reason: "out_of_stock" };
  }

  const cart = await getOrCreateActiveCart();

  const existing = await prisma.cartItem.findUnique({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
  });

  // Весь доступный остаток уже в корзине — не трогаем позицию и говорим об этом.
  // Раньше здесь молча записывалось то же количество, и покупатель не понимал,
  // добавилось что-то или нет.
  if (existing && existing.quantity >= variant.stock) {
    return { ok: false, reason: "already_max" };
  }

  const desired = (existing?.quantity ?? 0) + qty;
  const finalQty = Math.min(desired, variant.stock);

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: finalQty },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        variantId,
        quantity: finalQty,
        priceSnapshot: variant.price,
      },
    });
  }

  return {
    ok: true,
    capped: finalQty < desired,
    quantity: finalQty,
    stock: variant.stock,
    remaining: variant.stock - finalQty,
  };
}

// Изменение количества позиции (с проверкой владельца и клампом к остатку).
export async function updateCartItemQuantity(
  itemId: string,
  quantity: number,
): Promise<void> {
  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: {
      cart: { select: { userId: true, sessionToken: true } },
      variant: { select: { stock: true } },
    },
  });
  if (!item || !(await userOwnsCart(item.cart))) return;

  const clamped = Math.min(
    Math.max(1, Math.floor(quantity)),
    Math.max(1, item.variant.stock),
  );
  await prisma.cartItem.update({
    where: { id: itemId },
    data: { quantity: clamped },
  });
}

// Удаление позиции (с проверкой владельца).
export async function removeCartItem(itemId: string): Promise<void> {
  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { cart: { select: { userId: true, sessionToken: true } } },
  });
  if (!item || !(await userOwnsCart(item.cart))) return;

  await prisma.cartItem.delete({ where: { id: itemId } });
}

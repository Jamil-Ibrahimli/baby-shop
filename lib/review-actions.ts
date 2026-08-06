"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Коды ошибок переводятся на клиенте (Product.Reviews.Errors.*).
export type ReviewResult = { error?: string };

// Создать/обновить отзыв. Только зарегистрированный пользователь, один отзыв на товар.
export async function submitReview(
  productId: string,
  rating: number,
  body: string,
): Promise<ReviewResult> {
  const session = await auth();
  if (!session?.user) return { error: "unauthorized" };

  const stars = Math.round(rating);
  if (stars < 1 || stars > 5) return { error: "rating_required" };

  const text = body.trim();
  if (text.length < 3) return { error: "body_required" };

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });
  if (!product) return { error: "not_found" };

  // Уникальность (productId, userId) гарантирует «один отзыв на товар».
  await prisma.review.upsert({
    where: {
      productId_userId: { productId, userId: session.user.id },
    },
    update: { rating: stars, body: text },
    create: { productId, userId: session.user.id, rating: stars, body: text },
  });

  return {};
}

// Удалить свой отзыв (владелец определяется по сессии — чужой удалить нельзя).
export async function deleteReview(productId: string): Promise<void> {
  const session = await auth();
  if (!session?.user) return;
  await prisma.review.deleteMany({
    where: { productId, userId: session.user.id },
  });
}

"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Коды ошибок переводятся на клиенте (Product.Reviews.Errors.*).
export type ReviewResult = { error?: string };

function validate(rating: number, body: string): ReviewResult | null {
  const stars = Math.round(rating);
  if (stars < 1 || stars > 5) return { error: "rating_required" };
  if (body.trim().length < 3) return { error: "body_required" };
  return null;
}

/**
 * Добавить отзыв. Только зарегистрированный пользователь.
 * Отзывов на товар может быть сколько угодно — каждый раз создаётся новый,
 * прежние не перезаписываются (раньше здесь был upsert по (productId, userId)).
 */
export async function submitReview(
  productId: string,
  rating: number,
  body: string,
): Promise<ReviewResult> {
  const session = await auth();
  if (!session?.user) return { error: "unauthorized" };

  const invalid = validate(rating, body);
  if (invalid) return invalid;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });
  if (!product) return { error: "not_found" };

  await prisma.review.create({
    data: {
      productId,
      userId: session.user.id,
      rating: Math.round(rating),
      body: body.trim(),
    },
  });

  return {};
}

/** Изменить СВОЙ отзыв. Чужой не тронется: userId в условии обновления. */
export async function updateReview(
  reviewId: string,
  rating: number,
  body: string,
): Promise<ReviewResult> {
  const session = await auth();
  if (!session?.user) return { error: "unauthorized" };

  const invalid = validate(rating, body);
  if (invalid) return invalid;

  // updateMany с userId в where — правка чужого отзыва просто не найдёт строку.
  const res = await prisma.review.updateMany({
    where: { id: reviewId, userId: session.user.id },
    data: { rating: Math.round(rating), body: body.trim() },
  });
  if (res.count === 0) return { error: "not_found" };

  return {};
}

/** Удалить СВОЙ отзыв по id (владелец проверяется по сессии). */
export async function deleteReview(reviewId: string): Promise<void> {
  const session = await auth();
  if (!session?.user) return;
  await prisma.review.deleteMany({
    where: { id: reviewId, userId: session.user.id },
  });
}

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/admin/guard";
import { notifyCustomerReviewReply } from "@/lib/notifications";

export type ReviewAdminResult = { error?: string; ok?: boolean };

function revalidateReview(productSlug: string) {
  revalidatePath("/[locale]/admin/reviews", "page");
  revalidatePath(`/[locale]/product/${productSlug}`, "page");
}

/**
 * Ответить на отзыв от лица магазина. Один ответ на отзыв: повторный вызов
 * перезаписывает текст (владелец правит свою же формулировку).
 * Пустой текст стирает ответ.
 */
export async function replyToReview(
  reviewId: string,
  body: string,
): Promise<ReviewAdminResult> {
  if (!(await getAdminUser())) return { error: "forbidden" };

  const text = body.trim();
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: {
      id: true,
      userId: true,
      replyBody: true,
      product: { select: { slug: true, nameRu: true, nameAz: true } },
    },
  });
  if (!review) return { error: "not_found" };

  await prisma.review.update({
    where: { id: reviewId },
    data: {
      replyBody: text || null,
      replyAt: text ? new Date() : null,
    },
  });

  // Уведомляем покупателя только когда ответ ПОЯВИЛСЯ (а не при правке или
  // удалении ответа) — иначе на каждую опечатку летело бы новое уведомление.
  if (text && !review.replyBody) {
    await notifyCustomerReviewReply({
      userId: review.userId,
      reviewId: review.id,
      productSlug: review.product.slug,
      productNameRu: review.product.nameRu,
      productNameAz: review.product.nameAz,
    });
  }

  revalidateReview(review.product.slug);
  return { ok: true };
}

/**
 * Удалить отзыв от лица админа — против спама и оскорблений.
 * Автор удаляет свой отзыв сам (deleteReview в lib/review-actions.ts),
 * здесь права даёт роль admin.
 */
export async function deleteReviewAsAdmin(
  reviewId: string,
): Promise<ReviewAdminResult> {
  if (!(await getAdminUser())) return { error: "forbidden" };

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { product: { select: { slug: true } } },
  });
  if (!review) return { error: "not_found" };

  await prisma.review.delete({ where: { id: reviewId } });
  revalidateReview(review.product.slug);
  return { ok: true };
}

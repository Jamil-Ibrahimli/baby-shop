"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notifyNewReview } from "@/lib/notifications";

// Коды ошибок переводятся на клиенте (Product.Reviews.Errors.*).
export type ReviewResult = { error?: string };

function validate(rating: number, body: string): ReviewResult | null {
  const stars = Math.round(rating);
  if (stars < 1 || stars > 5) return { error: "rating_required" };
  if (body.trim().length < 3) return { error: "body_required" };
  return null;
}

/**
 * Добавить отзыв. Только зарегистрированный пользователь, и ОДИН на товар.
 *
 * Правило вернули 2026-10-03. Дело не в нагрузке на владельца, а в рейтинге:
 * он считается простым средним, и один покупатель с 19 отзывами единолично
 * определял оценку товара.
 *
 * Исключения для админа НЕТ. Витрина работает одинаково для всех, админом
 * человек становится только в панели; к тому же без исключения правило удалось
 * запереть уникальным индексом в самой базе, а не только здесь.
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
    select: { id: true, nameRu: true, nameAz: true },
  });
  if (!product) return { error: "not_found" };

  const stars = Math.round(rating);

  let created;
  try {
    created = await prisma.review.create({
      data: {
        productId,
        userId: session.user.id,
        rating: stars,
        body: body.trim(),
      },
    });
  } catch (e) {
    // P2001/P2002 — нарушение уникальности (productId, userId): отзыв уже есть.
    // Ловим именно её, а не проверяем заранее отдельным запросом: между
    // проверкой и вставкой человек мог отправить форму дважды, и тогда
    // пользователь увидел бы сырую ошибку Prisma вместо понятной.
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as { code?: string }).code === "P2002"
    ) {
      return { error: "already_reviewed" };
    }
    throw e;
  }

  // Уведомляем владельца — но осечка уведомления не должна ронять отзыв,
  // он уже сохранён (тот же принцип, что при оформлении заказа).
  //
  // Роль автора НЕ проверяем: любой отзыв, написанный на витрине, — событие для
  // магазина, даже если его оставил сам владелец. Витрина одинакова для всех,
  // админом человек становится только в панели.
  try {
    await notifyNewReview({
      reviewId: created.id,
      productNameRu: product.nameRu,
      productNameAz: product.nameAz,
      rating: stars,
      author: session.user.name ?? session.user.email ?? "",
    });
  } catch (e) {
    console.error("notifyNewReview failed", e);
  }

  return {};
}

/**
 * Изменить СВОЙ отзыв. Чужой не тронется: userId в условии обновления.
 *
 * Пока магазин не ответил — правь сколько нужно. После ответа отзыв ЗАКРЫТ:
 * иначе ответ владельца повисал бы под переписанным текстом и отвечал бы на
 * слова, которых больше нет. Отдельный счётчик правок для этого не нужен —
 * достаточно того, что ответ уже существует.
 */
export async function updateReview(
  reviewId: string,
  rating: number,
  body: string,
): Promise<ReviewResult> {
  const session = await auth();
  if (!session?.user) return { error: "unauthorized" };

  const invalid = validate(rating, body);
  if (invalid) return invalid;

  // replyAt в where, а не проверка отдельным запросом: так условие «ответа нет»
  // проверяется той же строкой, которую меняем, и гонка невозможна — владелец
  // не сможет ответить ровно между проверкой и записью.
  const res = await prisma.review.updateMany({
    where: { id: reviewId, userId: session.user.id, replyAt: null },
    data: { rating: Math.round(rating), body: body.trim() },
  });

  if (res.count === 0) {
    // Не нашли — либо отзыв чужой/удалён, либо на него уже ответили.
    // Различаем, чтобы сказать человеку правду, а не общее «не найдено».
    const locked = await prisma.review.findFirst({
      where: { id: reviewId, userId: session.user.id, replyAt: { not: null } },
      select: { id: true },
    });
    return { error: locked ? "reply_locked" : "not_found" };
  }

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

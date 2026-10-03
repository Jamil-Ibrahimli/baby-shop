import "server-only";
import { prisma } from "@/lib/prisma";

// Отзывы для админки: все товары, новые сверху, с автором и ответом магазина.
// Пагинации нет (как и в остальных разделах) — см. техдолг в PROGRESS.md.
export async function getAdminReviews() {
  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      rating: true,
      title: true,
      body: true,
      createdAt: true,
      replyBody: true,
      replyAt: true,
      userId: true,
      productId: true,
      user: { select: { name: true, email: true } },
      product: {
        select: {
          slug: true,
          nameRu: true,
          nameAz: true,
          images: {
            orderBy: { sortOrder: "asc" },
            take: 1,
            select: { url: true },
          },
        },
      },
    },
  });

  // Что этот покупатель реально брал из этого товара: размер, цвет, заказ, дата.
  // Для жалобы на брак это главное — по названию товара не понять, какой именно
  // вариант отправили. Одним запросом на всю страницу, а не по отзыву.
  const purchases = reviews.length
    ? await prisma.orderItem.findMany({
        where: {
          productId: { in: [...new Set(reviews.map((r) => r.productId))] },
          order: { userId: { in: [...new Set(reviews.map((r) => r.userId))] } },
        },
        orderBy: { order: { createdAt: "desc" } },
        select: {
          productId: true,
          sizeLabelRu: true,
          sizeLabelAz: true,
          colorRu: true,
          colorAz: true,
          quantity: true,
          order: {
            select: {
              id: true,
              orderNumber: true,
              status: true,
              createdAt: true,
              userId: true,
            },
          },
        },
      })
    : [];

  // Группируем по паре «товар + покупатель» — так же, как связан отзыв.
  const byKey = new Map<string, typeof purchases>();
  for (const p of purchases) {
    if (!p.order.userId) continue;
    const key = `${p.productId}:${p.order.userId}`;
    byKey.set(key, [...(byKey.get(key) ?? []), p]);
  }

  return reviews.map((r) => ({
    ...r,
    purchases: byKey.get(`${r.productId}:${r.userId}`) ?? [],
  }));
}

/** Сколько отзывов ещё без ответа — для счётчика в сайдбаре и заголовке. */
export async function getUnansweredReviewCount(): Promise<number> {
  return prisma.review.count({ where: { replyBody: null } });
}

export type AdminReview = Awaited<ReturnType<typeof getAdminReviews>>[number];

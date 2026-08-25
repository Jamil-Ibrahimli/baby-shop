import "server-only";
import { prisma } from "@/lib/prisma";

// Отзывы для админки: все товары, новые сверху, с автором и ответом магазина.
// Пагинации нет (как и в остальных разделах) — см. техдолг в PROGRESS.md.
export async function getAdminReviews() {
  return prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      rating: true,
      title: true,
      body: true,
      createdAt: true,
      replyBody: true,
      replyAt: true,
      user: { select: { name: true, email: true } },
      product: { select: { slug: true, nameRu: true, nameAz: true } },
    },
  });
}

/** Сколько отзывов ещё без ответа — для счётчика в заголовке раздела. */
export async function getUnansweredReviewCount(): Promise<number> {
  return prisma.review.count({ where: { replyBody: null } });
}

export type AdminReview = Awaited<ReturnType<typeof getAdminReviews>>[number];

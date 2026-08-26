import { getTranslations } from "next-intl/server";
import { MessageSquareText } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import { dateFormat } from "@/lib/format";
import { brand } from "@/config/brand";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StarRating } from "./star-rating";
import { ReviewForm } from "./review-form";
import { ReviewCard } from "./review-card";
import type { ReviewVM } from "@/lib/product-types";
import type { Locale } from "@/i18n/routing";

// Блок отзывов: средняя оценка, форма (для авторизованных) или приглашение войти,
// список отзывов лентой без рамок (новые сверху). Свои отзывы тоже в списке —
// помечены и правятся прямо в карточке; форма всегда пустая, под новый отзыв.
export async function ProductReviews({
  productId,
  reviews,
  ratingAvg,
  ratingCount,
  locale,
}: {
  productId: string;
  reviews: ReviewVM[];
  ratingAvg: number | null;
  ratingCount: number;
  locale: Locale;
}) {
  const t = await getTranslations("Product.Reviews");
  const session = await auth();

  // Свои отзывы больше НЕ убираем из списка: покупатель видит опубликованное
  // сразу после отправки. Отмечаем их, чтобы показать «Изменить» и «Удалить».
  const myIds = session?.user
    ? new Set(
        (
          await prisma.review.findMany({
            where: { productId, userId: session.user.id },
            select: { id: true },
          })
        ).map((r) => r.id),
      )
    : new Set<string>();

  const dateFmt = dateFormat(locale, { dateStyle: "long" });

  return (
    <section aria-labelledby="reviews-heading" className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <h2 id="reviews-heading" className="text-xl font-semibold">
          {t("title")}
        </h2>
        {ratingCount > 0 && ratingAvg !== null && (
          <div className="flex items-center gap-2">
            <StarRating value={ratingAvg} />
            <span className="text-sm text-muted-foreground">
              {t("summary", { avg: ratingAvg.toFixed(1), count: ratingCount })}
            </span>
          </div>
        )}
      </div>

      {/* Форма для авторизованных / приглашение войти для гостя */}
      {session?.user ? (
        <ReviewForm productId={productId} />
      ) : (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-border p-4 text-sm">
          <span className="text-muted-foreground">{t("signInToReview")}</span>
          <div className="flex gap-2">
            <Link
              href="/login"
              className={cn(buttonVariants({ size: "sm" }), "rounded-full")}
            >
              {t("signIn")}
            </Link>
            <Link
              href="/register"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "rounded-full",
              )}
            >
              {t("register")}
            </Link>
          </div>
        </div>
      )}

      {/* Список отзывов / пустое состояние */}
      {ratingCount === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-10 text-center">
          <MessageSquareText
            className="size-8 text-muted-foreground"
            aria-hidden
          />
          <p className="mt-3 font-medium">{t("empty")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("emptyHint")}</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-8">
          {reviews.map((r) => (
            <ReviewCard
              key={r.id}
              review={r}
              mine={myIds.has(r.id)}
              dateLabel={dateFmt.format(new Date(r.createdAt))}
              replyDateLabel={
                r.replyAt ? dateFmt.format(new Date(r.replyAt)) : null
              }
              shopName={brand.name}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

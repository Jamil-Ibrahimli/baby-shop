import { getTranslations } from "next-intl/server";
import { MessageSquareText } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StarRating } from "./star-rating";
import { ReviewForm } from "./review-form";
import type { ReviewVM } from "@/lib/product-types";
import type { Locale } from "@/i18n/routing";

// Блок отзывов: средняя оценка, форма (для авторизованных) или приглашение войти,
// список отзывов (новые сверху). Свой отзыв показывается в форме, а не в списке.
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

  const myReview = session?.user
    ? await prisma.review.findUnique({
        where: {
          productId_userId: { productId, userId: session.user.id },
        },
        select: { id: true, rating: true, body: true },
      })
    : null;

  // Свой отзыв убираем из общего списка (он редактируется в форме).
  const listReviews = myReview
    ? reviews.filter((r) => r.id !== myReview.id)
    : reviews;

  const dateFmt = new Intl.DateTimeFormat(
    locale === "az" ? "az-AZ" : "ru-RU",
    { dateStyle: "long" },
  );

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
        <ReviewForm
          productId={productId}
          initial={
            myReview ? { rating: myReview.rating, body: myReview.body } : null
          }
        />
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
        listReviews.length > 0 && (
          <ul className="flex flex-col gap-4">
            {listReviews.map((r) => (
              <li key={r.id} className="rounded-2xl border border-border p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">
                    {r.author ?? t("anonymous")}
                  </span>
                  <StarRating value={r.rating} />
                </div>
                {r.verified && (
                  <span className="mt-1 inline-block text-xs text-primary">
                    {t("verified")}
                  </span>
                )}
                {r.title && <p className="mt-2 font-medium">{r.title}</p>}
                <p className="mt-1 text-sm text-muted-foreground">{r.body}</p>
                <time className="mt-2 block text-xs text-muted-foreground/70">
                  {dateFmt.format(new Date(r.createdAt))}
                </time>
              </li>
            ))}
          </ul>
        )
      )}
    </section>
  );
}

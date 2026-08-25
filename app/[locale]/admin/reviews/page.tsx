import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";

import { routing, type Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { dateFormat } from "@/lib/format";
import { getAdminReviews } from "@/lib/admin/reviews";
import {
  ReviewManager,
  type ReviewRow,
} from "@/components/admin/review-manager";

// Отзывы всех товаров: ответить от лица магазина или удалить (спам, оскорбления).
// Права проверяет оболочка админки (app/[locale]/admin/layout.tsx).
export default async function AdminReviewsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loc: Locale = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;

  const [t, reviews] = await Promise.all([
    getTranslations("Admin.Reviews"),
    getAdminReviews(),
  ]);

  const dateFmt = dateFormat(loc, { dateStyle: "medium", timeStyle: "short" });
  const az = loc === "az";

  // Даты форматируем на сервере: часовой пояс магазина считается в одном месте.
  const rows: ReviewRow[] = reviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    title: r.title,
    body: r.body,
    dateLabel: dateFmt.format(r.createdAt),
    replyBody: r.replyBody,
    replyDateLabel: r.replyAt ? dateFmt.format(r.replyAt) : null,
    author: r.user?.name || r.user?.email || t("anonymous"),
    productName: az ? r.product.nameAz : r.product.nameRu,
    productSlug: r.product.slug,
  }));

  const unanswered = rows.filter((r) => !r.replyBody).length;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
      <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin" className="hover:text-foreground">
          {t("backToAdmin")}
        </Link>
        <span>/</span>
        <span>{t("title")}</span>
      </div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <h1 className="font-heading text-2xl font-bold sm:text-3xl">
          {t("title")}
        </h1>
        {unanswered > 0 && (
          <span className="rounded-full bg-secondary-light px-3 py-1 text-sm font-medium text-secondary-foreground">
            {t("unansweredCount", { count: unanswered })}
          </span>
        )}
      </div>

      <ReviewManager reviews={rows} />
    </main>
  );
}

import { Suspense } from "react";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { Home, ChevronRight } from "lucide-react";
import { routing, type Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import {
  parseFilters,
  getCategoryTree,
  getPriceBounds,
} from "@/lib/catalog";
import type { CategoryNode } from "@/lib/catalog-shared";
import { CatalogFiltersPanel } from "@/components/catalog/catalog-filters-panel";
import { CatalogSort } from "@/components/catalog/catalog-sort";
import { ActiveFilters } from "@/components/catalog/active-filters";
import { TrustBar } from "@/components/catalog/trust-bar";
import { ProductGrid } from "@/components/catalog/product-grid";
import { ProductGridSkeleton } from "@/components/catalog/product-grid-skeleton";
import { CloudMascot } from "@/components/brand/cloud-mascot";

// Локализованное имя категории по slug (для чипса активного фильтра).
function findCategoryName(nodes: CategoryNode[], slug: string): string | null {
  for (const n of nodes) {
    if (n.slug === slug) return n.name;
    const inChild = findCategoryName(n.children, slug);
    if (inChild) return inChild;
  }
  return null;
}

export default async function CatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loc: Locale = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;

  const sp = await searchParams;
  const filters = parseFilters(sp);
  const t = await getTranslations("Catalog");

  const [categoryTree, boundsMinor] = await Promise.all([
    getCategoryTree(loc),
    getPriceBounds(),
  ]);
  const priceBounds = {
    min: Math.floor(boundsMinor.min / 100),
    max: Math.ceil(boundsMinor.max / 100),
  };
  const categoryName = filters.category
    ? findCategoryName(categoryTree, filters.category)
    : null;

  // Смена фильтров меняет key → Suspense показывает скелетоны, пока грузится сетка.
  const suspenseKey = JSON.stringify(filters);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
      {/* Хлебные крошки */}
      <nav
        aria-label="breadcrumb"
        className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground"
      >
        <Link href="/" className="inline-flex items-center gap-1 hover:text-foreground">
          <Home className="size-3.5" aria-hidden />
          {t("Breadcrumbs.home")}
        </Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <Link href="/catalog" className="hover:text-foreground">
          {t("title")}
        </Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <span className="text-foreground">{t("subtitle")}</span>
      </nav>

      {/* Заголовок с маскотом */}
      <header className="mb-6 flex items-center gap-4">
        <CloudMascot className="size-14 shrink-0 sm:size-16" />
        <div>
          <h1 className="font-heading text-2xl font-extrabold sm:text-4xl">
            {t("heading")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("lead")}</p>
        </div>
      </header>

      {/* Панель-подложка: фильтры + товары + плашка доверия на одном мягком фоне.
          Без рамки и тени — глубину дают белые карточки поверх подложки
          (тот же приём, что в админке: bg-surface + белые карточки). */}
      <div className="rounded-3xl bg-surface p-3 sm:p-5">
        <div className="grid gap-5 lg:grid-cols-[260px_1fr] lg:gap-6">
          <CatalogFiltersPanel
            locale={loc}
            categoryTree={categoryTree}
            priceBounds={priceBounds}
            filters={filters}
          />
          <section>
            {/* Тулбар: активные фильтры + сортировка */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <ActiveFilters
                filters={filters}
                categoryName={categoryName}
                locale={loc}
              />
              <div className="ml-auto">
                <CatalogSort current={filters.sort} />
              </div>
            </div>

            <Suspense key={suspenseKey} fallback={<ProductGridSkeleton />}>
              <ProductGrid filters={filters} locale={loc} />
            </Suspense>
          </section>
        </div>

        <TrustBar />
      </div>
    </main>
  );
}

import { getTranslations } from "next-intl/server";
import { getCatalogProducts } from "@/lib/catalog";
import type { CatalogFilters } from "@/lib/catalog-shared";
import { formatPrice } from "@/lib/format";
import type { Locale } from "@/i18n/routing";
import { ProductCard, type CardBadge } from "./product-card";
import { CatalogEmpty } from "./catalog-empty";

// Асинхронная сетка: тянет товары по фильтрам. Внутри Suspense — пока грузится,
// показывается ProductGridSkeleton (см. страницу каталога).
export async function ProductGrid({
  filters,
  locale,
}: {
  filters: CatalogFilters;
  locale: Locale;
}) {
  const t = await getTranslations("Catalog");
  const products = await getCatalogProducts(filters, locale);

  if (products.length === 0) {
    return <CatalogEmpty />;
  }

  return (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">
        {t("found", { count: products.length })}
      </p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-3">
        {products.map((p) => {
          const badges: CardBadge[] = [
            ...(p.isBundle
              ? [{ key: "bundle", label: t("Card.bundle"), tone: "bundle" as const }]
              : []),
            ...(p.isOrganic
              ? [{ key: "organic", label: t("Card.organic"), tone: "organic" as const }]
              : []),
          ];
          return (
            <ProductCard
              key={p.id}
              productId={p.id}
              href={`/product/${p.slug}`}
              name={p.name}
              imageUrl={p.imageUrl}
              imageAlt={p.imageAlt}
              priceLabel={t("priceFrom", {
                price: formatPrice(p.priceFromMinor, locale),
              })}
              sizeLabel={
                p.sizeToLabel
                  ? `${p.sizeFromLabel} – ${p.sizeToLabel}`
                  : p.sizeFromLabel
              }
              badges={badges}
              discountPercent={p.discountPercent}
              oldPriceLabel={
                p.compareAtFromMinor !== null
                  ? formatPrice(p.compareAtFromMinor, locale)
                  : null
              }
              isOrganic={p.isOrganic}
              ratingAvg={p.ratingAvg}
              ratingCount={p.ratingCount}
              organicLabel={t("Card.organicCotton")}
            />
          );
        })}
      </div>
    </div>
  );
}

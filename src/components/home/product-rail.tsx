import { getTranslations } from "next-intl/server";
import { ChevronRight } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { getCatalogProducts } from "@/lib/catalog";
import { DEFAULT_SORT } from "@/lib/catalog-shared";
import { formatPrice } from "@/lib/format";
import { ProductCard, type CardBadge } from "@/components/catalog/product-card";
import type { Locale } from "@/i18n/routing";

// Полка товаров на главной: заголовок, ссылка «Все товары» и до 4 карточек.
// Карточка — та же, что в каталоге (бейджи, скидка, рейтинг, избранное).
export async function ProductRail({
  locale,
  variant,
  limit = 4,
}: {
  locale: Locale;
  /** new — последние добавленные, sale — только со скидкой. */
  variant: "new" | "sale";
  limit?: number;
}) {
  const [tHome, tCatalog] = await Promise.all([
    getTranslations("Home"),
    getTranslations("Catalog"),
  ]);

  const products = await getCatalogProducts(
    {
      sizes: [],
      safety: [],
      onSale: variant === "sale",
      sort: DEFAULT_SORT, // по дате создания: сначала новые
    },
    locale,
  );
  // Блок со скидками просто исчезает, если акций нет — пустых полок не показываем.
  if (products.length === 0) return null;

  const shown = products.slice(0, limit);
  const href = variant === "sale" ? "/catalog?sale=1" : "/catalog";

  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="font-heading text-xl font-bold sm:text-2xl">
            {variant === "sale" ? tHome("saleTitle") : tHome("newTitle")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {variant === "sale" ? tHome("saleLead") : tHome("newLead")}
          </p>
        </div>
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          {tHome("seeAll")}
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
        {shown.map((p) => {
          const badges: CardBadge[] = [
            ...(p.isBundle
              ? [{ key: "bundle", label: tCatalog("Card.bundle"), tone: "bundle" as const }]
              : []),
            ...(p.isOrganic
              ? [{ key: "organic", label: tCatalog("Card.organic"), tone: "organic" as const }]
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
              priceLabel={tCatalog("priceFrom", {
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
              organicLabel={tCatalog("Card.organicCotton")}
            />
          );
        })}
      </div>
    </section>
  );
}

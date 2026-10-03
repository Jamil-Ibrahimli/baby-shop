import Image from "next/image";
import { ImageIcon, Leaf } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { StarRating } from "@/components/product/star-rating";
import { WishlistHeart } from "./wishlist-heart";

export type CardBadge = {
  key: string;
  label: string;
  tone: "bundle" | "organic";
};

export type ProductCardProps = {
  productId: string;
  href: string;
  name: string;
  imageUrl: string | null;
  imageAlt: string;
  priceLabel: string;
  sizeLabel: string | null;
  badges: CardBadge[];
  isOrganic: boolean;
  ratingAvg: number | null;
  ratingCount: number;
  organicLabel: string;
  // Задел под скидки: показываются, только если переданы (данных о скидках пока нет).
  discountPercent?: number | null;
  oldPriceLabel?: string | null;
};

// Карточка товара: крупное фото, бейджи, «в избранное», состав, рейтинг (5 звёзд), цена.
// Вся карточка — ссылка на товар; сердечко — отдельная кнопка поверх.
export function ProductCard({
  productId,
  href,
  name,
  imageUrl,
  imageAlt,
  priceLabel,
  sizeLabel,
  badges,
  isOrganic,
  ratingAvg,
  ratingCount,
  organicLabel,
  discountPercent = null,
  oldPriceLabel = null,
}: ProductCardProps) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <Link
        href={href}
        className="flex flex-1 flex-col outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      >
        {/* Крупное фото */}
        <div className="relative aspect-square w-full overflow-hidden bg-muted">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={imageAlt}
              fill
              sizes="(min-width: 1024px) 32vw, (min-width: 640px) 45vw, 50vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">
              <ImageIcon className="size-8" aria-hidden />
            </div>
          )}

          {/* Бейджи: скидка (задел) + комплект/органик */}
          {(discountPercent || badges.length > 0) && (
            <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
              {discountPercent ? (
                <span className="inline-flex items-center rounded-full bg-red-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
                  −{discountPercent}%
                </span>
              ) : null}
              {badges.map((b) => (
                <span
                  key={b.key}
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium shadow-sm backdrop-blur-sm",
                    b.tone === "bundle"
                      ? "bg-secondary/90 text-secondary-foreground"
                      : "bg-[var(--primary-light)]/90 text-primary",
                  )}
                >
                  {b.label}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Текст */}
        <div className="flex flex-1 flex-col gap-1.5 p-4">
          <h3 className="line-clamp-1 font-heading text-[15px] font-bold text-foreground sm:text-base">
            {name}
          </h3>

          {sizeLabel && (
            <p className="text-xs text-muted-foreground">{sizeLabel}</p>
          )}

          {isOrganic && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              {organicLabel}
              <Leaf className="size-3.5 text-primary" aria-hidden />
            </p>
          )}

          {ratingCount > 0 && ratingAvg !== null && (
            <div className="flex items-center gap-1.5">
              <StarRating value={ratingAvg} size="size-3.5" />
              <span className="text-xs text-muted-foreground">
                {ratingAvg} ({ratingCount})
              </span>
            </div>
          )}

          {/* Цена (+ место под старую цену при скидке) */}
          <div className="mt-auto flex items-baseline gap-2 pt-2">
            <span className="text-lg font-extrabold text-primary">
              {priceLabel}
            </span>
            {oldPriceLabel && (
              <span className="text-sm text-muted-foreground line-through">
                {oldPriceLabel}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* «В избранное» — поверх ссылки, отдельной кнопкой */}
      <div className="absolute right-3 top-3">
        <WishlistHeart productId={productId} />
      </div>
    </article>
  );
}

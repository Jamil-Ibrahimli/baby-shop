"use client";

import { useTransition } from "react";
import Image from "next/image";
import { ImageIcon, Minus, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Link, useRouter } from "@/i18n/navigation";
import { formatPrice } from "@/lib/format";
import { updateCartItemQuantity, removeCartItem } from "@/lib/cart-actions";
import type { CartItemVM } from "@/lib/cart-types";
import type { Locale } from "@/i18n/routing";

export function CartItemRow({
  item,
  locale,
}: {
  item: CartItemVM;
  locale: Locale;
}) {
  const t = useTranslations("Cart");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function setQty(next: number) {
    startTransition(async () => {
      await updateCartItemQuantity(item.id, next);
      router.refresh();
    });
  }

  function remove() {
    startTransition(async () => {
      await removeCartItem(item.id);
      router.refresh();
    });
  }

  const atMax = item.quantity >= item.maxStock;

  return (
    <div
      className={cn(
        "flex gap-3 py-4 sm:gap-4",
        isPending && "opacity-60",
        !item.available && "opacity-70",
      )}
    >
      {/* Фото */}
      <Link
        href={`/product/${item.productSlug}`}
        className="relative aspect-square size-20 shrink-0 overflow-hidden rounded-xl bg-muted sm:size-24"
      >
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.imageAlt}
            fill
            sizes="96px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <ImageIcon className="size-6" aria-hidden />
          </div>
        )}
      </Link>

      {/* Инфо */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Link
          href={`/product/${item.productSlug}`}
          className="truncate text-sm font-medium hover:underline sm:text-base"
        >
          {item.name}
        </Link>
        <p className="text-xs text-muted-foreground">
          {item.sizeLabel} · {item.color}
        </p>

        {/* Бейджи проблем (граничные случаи) */}
        <div className="flex flex-wrap gap-1.5">
          {!item.available && (
            <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
              {t("Issue.outOfStock")}
            </span>
          )}
          {item.available && item.quantityReduced && (
            <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">
              {t("Issue.quantityReduced", { count: item.maxStock })}
            </span>
          )}
          {item.priceChanged && (
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
              {t("Issue.priceChanged")}
            </span>
          )}
        </div>

        {/* Управление количеством */}
        <div className="mt-1 flex items-center gap-3">
          <div
            className="inline-flex items-center rounded-full border border-border"
            role="group"
            aria-label={t("quantity")}
          >
            <button
              type="button"
              onClick={() => setQty(item.quantity - 1)}
              disabled={isPending || !item.available || item.quantity <= 1}
              aria-label="-"
              className="flex size-8 items-center justify-center rounded-full disabled:opacity-40"
            >
              <Minus className="size-3.5" />
            </button>
            <span className="min-w-7 text-center text-sm tabular-nums">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => setQty(item.quantity + 1)}
              disabled={isPending || !item.available || atMax}
              aria-label="+"
              className="flex size-8 items-center justify-center rounded-full disabled:opacity-40"
            >
              <Plus className="size-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={remove}
            disabled={isPending}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-destructive"
          >
            <Trash2 className="size-4" aria-hidden />
            <span className="sr-only sm:not-sr-only">{t("remove")}</span>
          </button>
        </div>
      </div>

      {/* Цена (+ старая цена, если товар по акции) */}
      <div className="flex shrink-0 flex-col items-end justify-between text-right">
        <span className="text-sm font-semibold">
          {formatPrice(item.lineTotalMinor, locale)}
        </span>
        {item.compareAtMinor !== null && item.available && (
          <span className="text-xs text-muted-foreground line-through">
            {formatPrice(item.compareAtMinor * item.quantity, locale)}
          </span>
        )}
        {item.quantity > 1 && item.available && (
          <span className="text-xs text-muted-foreground">
            {formatPrice(item.unitPriceMinor, locale)} {t("each")}
          </span>
        )}
      </div>
    </div>
  );
}

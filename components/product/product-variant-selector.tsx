"use client";

import { useMemo, useState, useTransition } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { formatPrice } from "@/lib/format";
import { Link, useRouter } from "@/i18n/navigation";
import { addToCart } from "@/lib/cart-actions";
import type { ProductVariantVM } from "@/lib/product-types";
import type { Locale } from "@/i18n/routing";
import { useColorSelection } from "./color-selection";

type Props = {
  variants: ProductVariantVM[];
  priceFromMinor: number;
  locale: Locale;
  /** Сколько единиц каждого варианта уже в корзине (обновляется router.refresh()). */
  inCart: Record<string, number>;
  /** Ключ цвета → первое фото этого цвета (для миниатюр в выборе цвета). */
  colorThumbs: Record<string, string>;
  /** Слот для таблицы размеров (серверный компонент, передаётся со страницы). */
  sizeGuideSlot?: ReactNode;
};

export function ProductVariantSelector({
  variants,
  priceFromMinor,
  locale,
  inCart,
  colorThumbs,
  sizeGuideSlot,
}: Props) {
  const t = useTranslations("Product");
  const router = useRouter();
  const toast = useToast();
  const { setColorKey } = useColorSelection();
  const [isPending, startTransition] = useTransition();

  const sizes = useMemo(() => {
    const seen = new Map<string, { code: string; label: string }>();
    for (const v of variants) {
      if (!seen.has(v.sizeCode))
        seen.set(v.sizeCode, { code: v.sizeCode, label: v.sizeLabel });
    }
    return [...seen.values()];
  }, [variants]);

  const colors = useMemo(() => {
    const seen = new Map<
      string,
      { color: string; hex: string | null; colorKey: string }
    >();
    for (const v of variants) {
      if (!seen.has(v.color))
        seen.set(v.color, {
          color: v.color,
          hex: v.colorHex,
          colorKey: v.colorKey,
        });
    }
    return [...seen.values()];
  }, [variants]);

  const [size, setSize] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [qty, setQty] = useState(1);

  const find = (s: string | null, c: string | null) =>
    variants.find((v) => v.sizeCode === s && v.color === c) ?? null;

  const sizeAvailable = (s: string) =>
    variants.some((v) => v.sizeCode === s && v.available);
  const colorEnabled = (c: string) =>
    size
      ? !!find(size, c)?.available
      : variants.some((v) => v.color === c && v.available);

  const selected = find(size, color);

  // Остаток считаем по конкретному варианту (размер+цвет) за вычетом того,
  // что покупатель уже положил в корзину. Склад не резервируется — это только
  // подсказка интерфейса, финальная проверка всё равно на сервере.
  const alreadyInCart = selected ? (inCart[selected.id] ?? 0) : 0;
  const addable = selected ? Math.max(0, selected.stock - alreadyInCart) : 0;
  const soldOut = !!selected && !selected.available;
  const atMax = !!selected && !soldOut && addable === 0;
  const canBuy = !!selected && !soldOut && !atMax;
  // Количество ограничиваем «на лету», без синхронизации состояния в эффекте.
  const effectiveQty = Math.min(qty, Math.max(1, addable));

  function selectSize(s: string) {
    setSize(s);
    setQty(1);
    if (color && !find(s, color)?.available) {
      setColor(null);
      setColorKey(null); // сброс цвета → галерея возвращается к общим фото
    }
  }

  function selectColor(c: string, key: string) {
    setColor(c);
    setColorKey(key); // сообщаем галерее выбранный цвет
    setQty(1);
  }

  function changeQty(delta: number) {
    if (!selected) return;
    setQty((q) => Math.min(Math.max(1, q + delta), addable));
  }

  const cartLink = (
    <Link href="/cart" className="text-sm font-medium underline underline-offset-4">
      {t("goToCart")}
    </Link>
  );

  function handleAdd() {
    if (!selected) return;
    startTransition(async () => {
      const res = await addToCart(selected.id, effectiveQty);

      if (!res.ok) {
        // Молчаливых отказов быть не должно — на каждый случай своё сообщение.
        toast.add({
          type: "info",
          title:
            res.reason === "already_max"
              ? t("Toast.maxInCartTitle")
              : t("Toast.unavailableTitle"),
          description:
            res.reason === "already_max"
              ? t("Toast.maxInCartText")
              : t("Toast.unavailableText"),
          data: res.reason === "already_max" ? { action: cartLink } : undefined,
        });
        router.refresh(); // подтянуть свежий остаток/корзину
        return;
      }

      toast.add({
        title: t("Toast.addedTitle"),
        // remaining === 0 → взяли последнюю доступную единицу.
        description: res.remaining === 0 ? t("Toast.addedLastText") : undefined,
        data: { action: cartLink },
      });
      router.refresh(); // счётчик в шапке + состояние кнопки
    });
  }

  const priceLabel = selected
    ? formatPrice(selected.priceMinor, locale)
    : t("priceFrom", { price: formatPrice(priceFromMinor, locale) });
  // Старую цену и бейдж показываем только для выбранного варианта: до выбора
  // непонятно, к какому размеру и цвету относилась бы скидка.
  const oldPriceLabel =
    selected && selected.compareAtMinor !== null
      ? formatPrice(selected.compareAtMinor, locale)
      : null;
  const percent = selected?.discountPercent ?? null;

  // Подпись кнопки объясняет, почему она неактивна.
  let buttonLabel = t("selectVariantFirst");
  if (selected) {
    if (soldOut) buttonLabel = t("outOfStock");
    else if (atMax) buttonLabel = t("maxInCart");
    else buttonLabel = t("addToCart");
  }

  let stockNode: ReactNode = (
    <span className="text-muted-foreground">{t("chooseVariant")}</span>
  );
  if (selected) {
    if (!selected.available) {
      stockNode = <span className="text-destructive">{t("outOfStock")}</span>;
    } else if (selected.stock <= 3) {
      stockNode = (
        <span className="text-foreground">
          {t("lowStock", { count: selected.stock })}
        </span>
      );
    } else {
      stockNode = <span className="text-foreground">{t("inStock")}</span>;
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span
          className={
            percent !== null
              ? "text-2xl font-semibold text-primary"
              : "text-2xl font-semibold"
          }
        >
          {priceLabel}
        </span>
        {oldPriceLabel && (
          <span className="text-base text-muted-foreground line-through">
            {oldPriceLabel}
          </span>
        )}
        {percent !== null && (
          <span className="rounded-full bg-secondary px-2.5 py-1 text-sm font-bold text-secondary-foreground">
            −{percent}%
          </span>
        )}
      </div>

      {/* Размер */}
      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-sm font-medium">{t("selectSize")}</span>
          {sizeGuideSlot}
        </div>
        <div className="flex flex-wrap gap-2">
          {sizes.map((s) => {
            const disabled = !sizeAvailable(s.code);
            const isActive = size === s.code;
            return (
              <button
                key={s.code}
                type="button"
                disabled={disabled}
                aria-pressed={isActive}
                onClick={() => selectSize(s.code)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm transition-colors",
                  isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:border-foreground",
                  disabled &&
                    "cursor-not-allowed border-dashed text-muted-foreground/50 line-through hover:border-dashed",
                )}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Цвет — плитками с фото товара в этом цвете: видно, что выбираешь,
          не переключая галерею. Если у цвета фото нет, показываем оттенок. */}
      <div>
        <div className="mb-2 text-sm font-medium">
          {t("selectColor")}
          {color && (
            <span className="ml-1 font-normal text-muted-foreground">
              {color}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {colors.map((c) => {
            const enabled = colorEnabled(c.color);
            const isActive = color === c.color;
            const thumb = colorThumbs[c.colorKey];
            return (
              <button
                key={c.color}
                type="button"
                disabled={!enabled}
                aria-pressed={isActive}
                onClick={() => selectColor(c.color, c.colorKey)}
                className={cn(
                  "flex w-20 flex-col items-center gap-1 rounded-xl border bg-card p-1.5 text-xs transition-colors",
                  isActive
                    ? "border-primary ring-2 ring-primary/40"
                    : "border-border hover:border-foreground",
                  !enabled && "cursor-not-allowed opacity-50",
                )}
              >
                <span className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg bg-muted">
                  {thumb ? (
                    <Image
                      src={thumb}
                      alt=""
                      width={72}
                      height={72}
                      className="size-full object-cover"
                    />
                  ) : (
                    <span
                      className="size-7 rounded-full border border-black/10"
                      style={{ backgroundColor: c.hex ?? "transparent" }}
                      aria-hidden
                    />
                  )}
                </span>
                <span
                  className={cn(
                    "w-full truncate text-center",
                    !enabled && "line-through",
                  )}
                  title={c.color}
                >
                  {c.color}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="text-sm">{stockNode}</div>

      {/* Количество + В корзину */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-4">
          <div
            className="inline-flex items-center rounded-full border border-border"
            role="group"
            aria-label={t("quantity")}
          >
            <button
              type="button"
              onClick={() => changeQty(-1)}
              disabled={!canBuy || effectiveQty <= 1}
              aria-label="-"
              className="flex size-9 items-center justify-center rounded-full disabled:opacity-40"
            >
              <Minus className="size-4" />
            </button>
            <span className="min-w-8 text-center text-sm tabular-nums">
              {effectiveQty}
            </span>
            <button
              type="button"
              onClick={() => changeQty(1)}
              disabled={!canBuy || effectiveQty >= addable}
              aria-label="+"
              className="flex size-9 items-center justify-center rounded-full disabled:opacity-40"
            >
              <Plus className="size-4" />
            </button>
          </div>

          <Button
            size="lg"
            className="flex-1 rounded-full sm:flex-none"
            disabled={!canBuy || isPending}
            onClick={handleAdd}
          >
            {buttonLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

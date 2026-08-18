"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductImageVM } from "@/lib/product-types";
import { useColorSelection } from "./color-selection";

/**
 * Галерея товара: в ленте ВСЕ фото — и общие, и привязанные к цветам.
 * Раньше выбор цвета оставлял только его снимки, и общая галерея исчезала.
 * Теперь выбор цвета ничего не скрывает: он просто перебрасывает большое фото
 * на первый снимок этого цвета, а лента остаётся полной.
 * Размер на фото не влияет — сопоставление идёт по цвету.
 */
export function ProductGallery({ images }: { images: ProductImageVM[] }) {
  const { colorKey } = useColorSelection();

  if (images.length === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-2xl bg-muted">
        <ImageIcon className="size-10 text-muted-foreground" aria-hidden />
      </div>
    );
  }

  // Первое фото выбранного цвета; нет такого — остаёмся на первом в ленте.
  const colorStart = colorKey
    ? images.findIndex((img) => img.colorKey === colorKey)
    : -1;
  const startIndex = colorStart >= 0 ? colorStart : 0;

  // Смена цвета меняет key → GalleryView ремоунтится и открывает нужное фото.
  // Так обходимся без синхронизации состояния через useEffect (правило React 19).
  return (
    <GalleryView
      key={`${colorKey ?? "all"}:${startIndex}`}
      images={images}
      startIndex={startIndex}
    />
  );
}

function GalleryView({
  images,
  startIndex,
}: {
  images: ProductImageVM[];
  startIndex: number;
}) {
  const [active, setActive] = useState(startIndex);
  const main = images[Math.min(active, images.length - 1)];

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
      {/* Миниатюры: на телефоне лентой под фото, на десктопе столбиком слева. */}
      {images.length > 1 && (
        <div className="order-2 flex gap-2 overflow-x-auto pb-1 sm:order-1 sm:max-h-125 sm:w-18 sm:shrink-0 sm:flex-col sm:overflow-x-visible sm:overflow-y-auto sm:pb-0">
          {images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              onClick={() => setActive(i)}
              aria-label={img.alt}
              aria-current={i === active}
              className={cn(
                "relative aspect-square w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors sm:w-full",
                i === active
                  ? "border-primary"
                  : "border-transparent hover:border-border",
              )}
            >
              <Image
                src={img.url}
                alt=""
                fill
                sizes="72px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Квадрат вместо вытянутого 4:5 — фото стало заметно ниже.
          object-contain: снимок вписывается целиком, ничего не обрезается. */}
      <div className="relative order-1 aspect-square w-full overflow-hidden rounded-2xl border border-border bg-card sm:order-2 sm:flex-1">
        <Image
          src={main.url}
          alt={main.alt}
          fill
          sizes="(min-width: 1024px) 40vw, 100vw"
          className="object-contain"
          priority
        />
      </div>
    </div>
  );
}

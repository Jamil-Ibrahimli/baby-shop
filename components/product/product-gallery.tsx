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
      <div className="flex aspect-10/11 w-full items-center justify-center rounded-2xl bg-muted">
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

  // self-start обязателен: галерея — ячейка сетки lg:grid-cols-2 и по умолчанию
  // растягивалась по высоте соседней колонки (цена, размеры, кнопка). Тогда
  // высота рамки приходила извне, а aspect-* при заданной высоте игнорируется —
  // фото выходило «длинным», и правки пропорции ничего не меняли.
  // Высоту строки теперь задаёт само фото, поэтому столбик миниатюр можно
  // просто растянуть по ней (обычный stretch) — без подгонки числом.
  return (
    <div className="relative flex flex-col gap-3 self-start sm:block">
      {/* Рамка 10:11 — чуть выше квадрата. Размер задан пропорцией, поэтому фото
          на него не влияет: любой снимок садится в одну и ту же рамку.
          object-cover + object-center: заполняет до скруглённых углов, а обрезка
          делится поровну между верхом и низом.
          На десктопе отступ слева — место под столбик миниатюр. */}
      <div className="relative aspect-10/11 w-full overflow-hidden rounded-2xl border border-border bg-card sm:ml-22 sm:w-auto">
        <Image
          src={main.url}
          alt={main.alt}
          fill
          sizes="(min-width: 1024px) 40vw, 100vw"
          className="object-cover object-center"
          priority
        />
      </div>

      {/* Миниатюры: на телефоне лентой под фото, на десктопе столбиком слева.
          Столбик позиционирован абсолютно (inset-y-0), поэтому его высота РАВНА
          высоте фото при любом числе снимков — лишние прокручиваются. Если бы он
          стоял в потоке, десять миниатюр растянули бы строку и фото снова
          вытянулось бы по ним.
          Полосу прокрутки скрываем — прокрутка колесом и свайпом остаётся. */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] sm:absolute sm:inset-y-0 sm:left-0 sm:w-18 sm:flex-col sm:overflow-x-visible sm:overflow-y-auto sm:pb-0 [&::-webkit-scrollbar]:hidden">
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
                className="object-cover object-center"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

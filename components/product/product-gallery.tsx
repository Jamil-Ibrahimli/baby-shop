"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductImageVM } from "@/lib/product-types";
import { useColorSelection } from "./color-selection";

// Галерея товара. Фото сопоставляются по ЦВЕТУ: при выборе цвета показываем фото
// этого цвета; если у цвета фото нет — откат к общим фото (или ко всем).
// Размер на фото не влияет.
export function ProductGallery({ images }: { images: ProductImageVM[] }) {
  const { colorKey } = useColorSelection();

  const general = images.filter((img) => img.colorKey === null);
  const base = general.length > 0 ? general : images;

  let visible = base;
  if (colorKey) {
    const byColor = images.filter((img) => img.colorKey === colorKey);
    if (byColor.length > 0) visible = byColor;
  }

  if (visible.length === 0) {
    return (
      <div className="flex aspect-4/5 w-full items-center justify-center rounded-2xl bg-muted">
        <ImageIcon className="size-10 text-muted-foreground" aria-hidden />
      </div>
    );
  }

  // Ключ по составу набора → GalleryView ремоунтится и сбрасывает активное фото
  // при смене цвета (вместо синхронизации состояния через useEffect).
  const viewKey = visible.map((i) => i.url).join("|");
  return <GalleryView key={viewKey} images={visible} />;
}

function GalleryView({ images }: { images: ProductImageVM[] }) {
  const [active, setActive] = useState(0);
  const main = images[Math.min(active, images.length - 1)];

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-4/5 w-full overflow-hidden rounded-2xl bg-muted">
        <Image
          src={main.url}
          alt={main.alt}
          fill
          sizes="(min-width: 1024px) 45vw, 100vw"
          className="object-cover"
          priority
        />
      </div>
      {images.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              onClick={() => setActive(i)}
              aria-label={img.alt}
              aria-current={i === active}
              className={cn(
                "relative aspect-square w-16 overflow-hidden rounded-lg border-2 transition-colors",
                i === active ? "border-primary" : "border-transparent",
              )}
            >
              <Image src={img.url} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "balaca_wishlist";

function readWishlist(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

// Кнопка «в избранное» на карточке. Пока без бэкенда — сохраняет выбор в браузере
// (localStorage). Полноценное «Избранное» (аккаунт + страница) — отдельный шаг.
export function WishlistHeart({ productId }: { productId: string }) {
  const t = useTranslations("Catalog.Card");
  // Ленивая инициализация из localStorage (без useEffect-синхронизации).
  const [active, setActive] = useState<boolean>(() =>
    readWishlist().includes(productId),
  );

  function toggle() {
    const list = readWishlist();
    const next = list.includes(productId)
      ? list.filter((id) => id !== productId)
      : [...list, productId];
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // localStorage недоступен — молча игнорируем
    }
    setActive(next.includes(productId));
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={active}
      aria-label={active ? t("wishlistRemove") : t("wishlistAdd")}
      className="flex size-9 items-center justify-center rounded-full bg-card/90 shadow-sm backdrop-blur transition-colors hover:bg-card"
    >
      <Heart
        className={cn(
          "size-[18px] transition-colors",
          active ? "fill-secondary text-secondary" : "text-muted-foreground",
        )}
        aria-hidden
      />
    </button>
  );
}

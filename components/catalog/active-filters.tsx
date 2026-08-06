"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { SIZE_TABLE, type SizeCode } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import type { CatalogFilters, SafetyFilter } from "@/lib/catalog-shared";
import type { Locale } from "@/i18n/routing";

type Chip = { key: string; label: string; clear: () => void };

// Удаляемые чипсы активных фильтров над сеткой товаров. Клик по ×
// убирает соответствующий параметр из URL (сортировка сохраняется).
export function ActiveFilters({
  filters,
  categoryName,
  locale,
}: {
  filters: CatalogFilters;
  categoryName: string | null;
  locale: Locale;
}) {
  const t = useTranslations("Catalog.Filters");
  const sp = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  function push(params: URLSearchParams) {
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }
  function remove(mutate: (p: URLSearchParams) => void) {
    const params = new URLSearchParams(sp.toString());
    mutate(params);
    push(params);
  }

  const chips: Chip[] = [];

  if (filters.category && categoryName) {
    chips.push({
      key: "category",
      label: categoryName,
      clear: () => remove((p) => p.delete("category")),
    });
  }

  for (const code of filters.sizes) {
    const label =
      locale === "az"
        ? SIZE_TABLE[code as SizeCode].labelAz
        : SIZE_TABLE[code as SizeCode].labelRu;
    chips.push({
      key: `size-${code}`,
      label,
      clear: () =>
        remove((p) => {
          const rest = filters.sizes.filter((s) => s !== code);
          if (rest.length) p.set("size", rest.join(","));
          else p.delete("size");
        }),
    });
  }

  for (const key of filters.safety) {
    chips.push({
      key: `safety-${key}`,
      label: t(`safetyOptions.${key as SafetyFilter}`),
      clear: () =>
        remove((p) => {
          const rest = filters.safety.filter((s) => s !== key);
          if (rest.length) p.set("safety", rest.join(","));
          else p.delete("safety");
        }),
    });
  }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    const from = filters.minPrice !== undefined ? formatPrice(filters.minPrice * 100, locale) : "…";
    const to = filters.maxPrice !== undefined ? formatPrice(filters.maxPrice * 100, locale) : "…";
    chips.push({
      key: "price",
      label: `${from} – ${to}`,
      clear: () =>
        remove((p) => {
          p.delete("min");
          p.delete("max");
        }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={c.clear}
          className="inline-flex items-center gap-1.5 rounded-full bg-secondary/50 px-3 py-1 text-sm text-secondary-foreground transition-colors hover:bg-secondary"
        >
          {c.label}
          <X className="size-3.5" aria-hidden />
        </button>
      ))}
    </div>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { SORT_OPTIONS, DEFAULT_SORT } from "@/lib/catalog-shared";

// Сортировка каталога через URL (?sort=). Значение по умолчанию не пишем в URL.
export function CatalogSort({ current }: { current: string }) {
  const t = useTranslations("Catalog.Sort");
  const sp = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  function change(value: string) {
    const params = new URLSearchParams(sp.toString());
    if (value === DEFAULT_SORT) params.delete("sort");
    else params.set("sort", value);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <div className="relative">
      <select
        aria-label={t("label")}
        value={current}
        onChange={(e) => change(e.target.value)}
        className="h-9 w-full appearance-none rounded-full border border-border bg-card py-1 pr-9 pl-4 text-sm shadow-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:w-auto"
      >
        {SORT_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {t(s)}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
    </div>
  );
}

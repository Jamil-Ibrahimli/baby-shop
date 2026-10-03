"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { RotateCcw, ChevronDown } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SIZE_CODES, SIZE_TABLE } from "@/lib/constants";
import {
  SAFETY_FILTERS,
  type CatalogFilters as Filters,
  type CategoryNode,
} from "@/lib/catalog-shared";
import { formatPrice } from "@/lib/format";
import type { Locale } from "@/i18n/routing";

type Props = {
  locale: Locale;
  categoryTree: CategoryNode[];
  /** Границы цены в МАЖОРНЫХ единицах (уже /100, floor/ceil). */
  priceBounds: { min: number; max: number };
  filters: Filters;
  /** Показывать заголовок «Фильтры» со «Сбросить» (десктоп). На мобильном — SheetTitle. */
  withHeader?: boolean;
  /** Вызывается после применения — чтобы закрыть мобильную панель. */
  onApplied?: () => void;
};

// Сворачиваемая секция фильтра с заголовком и стрелкой.
function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-t border-border pt-4 first:border-t-0 first:pt-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between text-sm font-semibold"
      >
        {title}
        <ChevronDown
          className={cn(
            "size-4 text-muted-foreground transition-transform",
            !open && "-rotate-90",
          )}
          aria-hidden
        />
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

// Рекурсивный рендер опций категорий с отступом по глубине.
function CategoryOptions({ node, depth }: { node: CategoryNode; depth: number }) {
  const id = `cat-${node.slug}`;
  return (
    <>
      <div className="flex items-center gap-2" style={{ paddingLeft: depth * 16 }}>
        <RadioGroupItem value={node.slug} id={id} />
        <Label htmlFor={id} className="font-normal">
          {node.name}
        </Label>
      </div>
      {node.children.map((child) => (
        <CategoryOptions key={child.slug} node={child} depth={depth + 1} />
      ))}
    </>
  );
}

export function CatalogFilters({
  locale,
  categoryTree,
  priceBounds,
  filters,
  withHeader = true,
  onApplied,
}: Props) {
  const t = useTranslations("Catalog");
  const router = useRouter();
  const pathname = usePathname();

  const [category, setCategory] = useState(filters.category ?? "");
  const [sizes, setSizes] = useState<string[]>(filters.sizes);
  const [safety, setSafety] = useState<string[]>(filters.safety);
  const [onSale, setOnSale] = useState(filters.onSale);
  const [price, setPrice] = useState<[number, number]>([
    filters.minPrice ?? priceBounds.min,
    filters.maxPrice ?? priceBounds.max,
  ]);

  // Синхронизация с URL после применения — через `key` на уровне панели (ремоунт),
  // без useEffect.

  const priceEnabled = priceBounds.max > priceBounds.min;

  function toggle(list: string[], value: string): string[] {
    return list.includes(value)
      ? list.filter((v) => v !== value)
      : [...list, value];
  }

  function apply() {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (sizes.length) params.set("size", sizes.join(","));
    if (safety.length) params.set("safety", safety.join(","));
    if (onSale) params.set("sale", "1");
    if (priceEnabled && price[0] > priceBounds.min)
      params.set("min", String(price[0]));
    if (priceEnabled && price[1] < priceBounds.max)
      params.set("max", String(price[1]));
    if (filters.sort !== "popular") params.set("sort", filters.sort);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    onApplied?.();
  }

  function reset() {
    setCategory("");
    setSizes([]);
    setSafety([]);
    setOnSale(false);
    setPrice([priceBounds.min, priceBounds.max]);
    router.push(pathname, { scroll: false });
    onApplied?.();
  }

  const ResetLink = (
    <button
      type="button"
      onClick={reset}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80"
    >
      {t("Filters.reset")}
      <RotateCcw className="size-3.5" aria-hidden />
    </button>
  );

  return (
    <div className="flex flex-col gap-4">
      {withHeader ? (
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-base font-bold">
            {t("Filters.heading")}
          </h2>
          {ResetLink}
        </div>
      ) : (
        <div className="flex justify-end">{ResetLink}</div>
      )}

      {/* Акции — отдельной строкой над остальными фильтрами, это «горячий» отбор */}
      <div className="flex items-center gap-2 rounded-xl bg-secondary-light px-3 py-2.5">
        <Checkbox
          id="filter-sale"
          checked={onSale}
          onCheckedChange={(next) => setOnSale(next === true)}
        />
        <Label htmlFor="filter-sale" className="font-medium">
          {t("Filters.onSale")}
        </Label>
      </div>

      {/* Категория */}
      <FilterSection title={t("Filters.category")}>
        <RadioGroup
          value={category}
          onValueChange={(v) => setCategory(String(v))}
          className="gap-2"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="" id="cat-all" />
            <Label htmlFor="cat-all" className="font-normal">
              {t("Filters.allCategories")}
            </Label>
          </div>
          {categoryTree.map((node) => (
            <CategoryOptions key={node.slug} node={node} depth={0} />
          ))}
        </RadioGroup>
      </FilterSection>

      {/* Размер (возраст) */}
      <FilterSection title={t("Filters.size")}>
        <div className="grid grid-cols-2 gap-2">
          {SIZE_CODES.map((code) => {
            const id = `size-${code}`;
            const label =
              locale === "az"
                ? SIZE_TABLE[code].labelAz
                : SIZE_TABLE[code].labelRu;
            return (
              <div key={code} className="flex items-center gap-2">
                <Checkbox
                  id={id}
                  checked={sizes.includes(code)}
                  onCheckedChange={() => setSizes((s) => toggle(s, code))}
                />
                <Label htmlFor={id} className="font-normal">
                  {label}
                </Label>
              </div>
            );
          })}
        </div>
      </FilterSection>

      {/* Состав и безопасность */}
      <FilterSection title={t("Filters.safety")}>
        <div className="flex flex-col gap-2">
          {SAFETY_FILTERS.map((key) => {
            const id = `safety-${key}`;
            return (
              <div key={key} className="flex items-center gap-2">
                <Checkbox
                  id={id}
                  checked={safety.includes(key)}
                  onCheckedChange={() => setSafety((s) => toggle(s, key))}
                />
                <Label htmlFor={id} className="font-normal">
                  {t(`Filters.safetyOptions.${key}`)}
                </Label>
              </div>
            );
          })}
        </div>
      </FilterSection>

      {/* Цена */}
      {priceEnabled && (
        <FilterSection title={t("Filters.price")}>
          <Slider
            value={price}
            min={priceBounds.min}
            max={priceBounds.max}
            step={1}
            onValueChange={(v) =>
              setPrice((Array.isArray(v) ? v : [v, v]) as [number, number])
            }
          />
          <div className="mt-3 flex justify-between text-sm text-muted-foreground">
            <span>{formatPrice(price[0] * 100, locale)}</span>
            <span>{formatPrice(price[1] * 100, locale)}</span>
          </div>
        </FilterSection>
      )}

      <Button onClick={apply} className="mt-1 w-full rounded-full">
        {t("Filters.apply")}
      </Button>
    </div>
  );
}

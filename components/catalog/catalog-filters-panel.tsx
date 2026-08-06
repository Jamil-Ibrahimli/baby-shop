"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { CatalogFilters } from "./catalog-filters";
import type { CatalogFilters as Filters, CategoryNode } from "@/lib/catalog-shared";
import type { Locale } from "@/i18n/routing";

type Props = {
  locale: Locale;
  categoryTree: CategoryNode[];
  priceBounds: { min: number; max: number };
  filters: Filters;
};

// Десктоп: постоянный сайдбар. Мобильный: кнопка + выезжающая панель (Sheet).
export function CatalogFiltersPanel(props: Props) {
  const t = useTranslations("Catalog");
  const [open, setOpen] = useState(false);

  // Ремоунт CatalogFilters при смене принятых фильтров (URL) сбрасывает
  // локальное состояние на новые значения — вместо синхронизации через useEffect.
  const appliedKey = JSON.stringify(props.filters);

  return (
    <>
      {/* Десктоп */}
      <aside className="hidden lg:block">
        <div className="sticky top-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <CatalogFilters key={appliedKey} {...props} />
        </div>
      </aside>

      {/* Мобильный */}
      <div className="lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            className={cn(
              buttonVariants({ variant: "outline" }),
              "w-full rounded-full",
            )}
          >
            <SlidersHorizontal className="size-4" aria-hidden />
            {t("openFilters")}
          </SheetTrigger>
          <SheetContent side="left" className="w-[85%] gap-0 overflow-y-auto p-5">
            <SheetHeader className="p-0">
              <SheetTitle>{t("Filters.heading")}</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <CatalogFilters
                key={appliedKey}
                {...props}
                withHeader={false}
                onApplied={() => setOpen(false)}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

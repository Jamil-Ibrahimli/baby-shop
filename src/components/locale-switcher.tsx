"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

// Переключатель языка: сегмент из коротких кодов (RU / AZ), активный залит цветом бренда.
// Текущий путь сохраняется, меняется только локаль (next-intl помнит выбор в cookie).
export function LocaleSwitcher() {
  const t = useTranslations("LocaleSwitcher");
  const activeLocale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div
      className="inline-flex items-center rounded-full border border-border bg-card p-0.5"
      role="group"
      aria-label={t("label")}
    >
      {routing.locales.map((locale) => {
        const isActive = locale === activeLocale;
        return (
          <button
            key={locale}
            type="button"
            disabled={isPending || isActive}
            aria-current={isActive ? "true" : undefined}
            title={t(locale)}
            onClick={() =>
              startTransition(() => {
                router.replace(pathname, { locale });
              })
            }
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-semibold uppercase transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {locale}
            <span className="sr-only"> — {t(locale)}</span>
          </button>
        );
      })}
    </div>
  );
}

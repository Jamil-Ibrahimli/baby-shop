import { getTranslations } from "next-intl/server";
import { ChevronRight } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { getCategoryTree } from "@/lib/catalog";
import type { Locale } from "@/i18n/routing";

// Плитки корневых категорий: короткий путь в каталог с уже выбранным фильтром.
// Подзаголовок плитки — вложенные категории, чтобы было понятно, что внутри.
// Пастельные фоны чередуются по кругу (все — токены бренда).
const TONES = [
  "bg-primary-light",
  "bg-secondary-light",
  "bg-accent",
  "bg-surface",
] as const;

export async function CategoryTiles({ locale }: { locale: Locale }) {
  const [t, tree] = await Promise.all([
    getTranslations("Home"),
    getCategoryTree(locale),
  ]);

  if (tree.length === 0) return null;

  return (
    <section>
      <div className="mb-4">
        <h2 className="font-heading text-xl font-bold sm:text-2xl">
          {t("categoriesTitle")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("categoriesLead")}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tree.map((node, i) => (
          <Link
            key={node.slug}
            href={`/catalog?category=${node.slug}`}
            className={`group flex items-center justify-between gap-3 rounded-2xl ${TONES[i % TONES.length]} p-5 transition-transform hover:-translate-y-0.5`}
          >
            <span className="min-w-0">
              <span className="block font-heading text-base font-bold">
                {node.name}
              </span>
              {node.children.length > 0 && (
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                  {node.children.map((c) => c.name).join(" · ")}
                </span>
              )}
            </span>
            <ChevronRight
              className="size-5 shrink-0 text-primary transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        ))}
      </div>
    </section>
  );
}

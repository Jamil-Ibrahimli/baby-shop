import { getTranslations } from "next-intl/server";
import { PackageOpen } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";

// Пустое состояние каталога (нет товаров / фильтры ничего не нашли).
export async function CatalogEmpty() {
  const t = await getTranslations("Catalog.Empty");
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
      <PackageOpen className="size-10 text-muted-foreground" aria-hidden />
      <h2 className="mt-4 text-lg font-semibold">{t("title")}</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {t("description")}
      </p>
      <Link
        href="/catalog"
        className={buttonVariants({ variant: "outline", className: "mt-6 rounded-full" })}
      >
        {t("reset")}
      </Link>
    </div>
  );
}

import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { Plus, PackageOpen, ImageOff } from "lucide-react";
import { routing, type Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { getAdminProducts } from "@/lib/admin/products";
import { formatPrice } from "@/lib/format";

export default async function AdminProductsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loc: Locale = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;
  const az = loc === "az";

  const t = await getTranslations("Admin.Products");
  const products = await getAdminProducts();

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
      <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin" className="hover:text-foreground">
          {t("backToAdmin")}
        </Link>
        <span>/</span>
        <span>{t("title")}</span>
      </div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold sm:text-3xl">{t("title")}</h1>
        <Link
          href="/admin/products/new"
          className={buttonVariants({ className: "rounded-full" })}
        >
          <Plus className="size-4" aria-hidden />
          {t("add")}
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <PackageOpen className="size-8 text-muted-foreground" aria-hidden />
          <p className="mt-3 font-medium">{t("empty")}</p>
          <Link
            href="/admin/products/new"
            className={buttonVariants({
              variant: "outline",
              className: "mt-4 rounded-full",
            })}
          >
            {t("add")}
          </Link>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {products.map((p) => (
            <li key={p.id}>
              <Link
                href={`/admin/products/${p.id}`}
                className="flex gap-3 rounded-2xl border border-border bg-card p-3 transition-colors hover:bg-muted"
              >
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.imageUrl}
                    alt=""
                    className="size-16 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <span className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <ImageOff className="size-5" aria-hidden />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-medium">
                    <span className="truncate">{az ? p.nameAz : p.nameRu}</span>
                    {!p.isPublished && (
                      <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        {t("draft")}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(az ? p.categoryNameAz : p.categoryNameRu) ??
                      t("noCategory")}
                  </p>
                  <p className="mt-1 text-sm">
                    {p.minPrice !== null && (
                      <span className="font-medium">
                        {formatPrice(p.minPrice, loc)}
                      </span>
                    )}
                    <span className="text-muted-foreground">
                      {" · "}
                      {p.variantCount} {t("variantsShort")} · {t("stockShort")}:{" "}
                      {p.totalStock}
                    </span>
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

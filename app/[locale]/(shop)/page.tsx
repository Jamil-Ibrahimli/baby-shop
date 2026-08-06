import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { brand } from "@/config/brand";
import { routing, type Locale } from "@/i18n/routing";
import { hasLocale } from "next-intl";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Home");
  const loc: Locale = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-8 px-6 py-16 text-center">
      <div className="flex flex-col items-center gap-4">
        <span className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          {brand.name}
        </span>
        <h1 className="text-4xl font-semibold text-balance sm:text-5xl">
          {t("welcome")}
        </h1>
        <p className="max-w-md text-lg text-muted-foreground text-pretty">
          {brand.tagline[loc]}
        </p>
        <p className="max-w-md text-base text-muted-foreground text-pretty">
          {t("subtitle")}
        </p>
      </div>

      <Link
        href="/catalog"
        className={buttonVariants({ size: "lg", className: "rounded-full" })}
      >
        {t("catalogCta")}
      </Link>

      <p className="text-sm text-muted-foreground/70">{t("foundationNote")}</p>
    </main>
  );
}

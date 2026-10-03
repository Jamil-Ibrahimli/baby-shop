import { getTranslations } from "next-intl/server";
import { ArrowRight, Percent } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { CloudMascot } from "@/components/brand/cloud-mascot";
import { brand } from "@/config/brand";
import type { Locale } from "@/i18n/routing";

// Первый экран главной: маскот, обещание магазина и два входа —
// в каталог и сразу к скидкам. Фон — мягкая заливка из токенов бренда.
export async function HomeHero({ locale }: { locale: Locale }) {
  const t = await getTranslations("Home");

  return (
    <section className="overflow-hidden rounded-3xl bg-primary-soft px-5 py-8 sm:px-10 sm:py-12">
      <div className="flex flex-col items-center gap-6 text-center sm:gap-8">
        <CloudMascot className="size-20 sm:size-24" />

        <div className="flex flex-col items-center gap-3">
          <span className="rounded-full bg-card px-3 py-1 text-xs font-bold tracking-wide text-primary uppercase">
            {t("heroBadge")}
          </span>
          <h1 className="max-w-2xl font-heading text-3xl font-extrabold text-balance sm:text-5xl">
            {t("heroTitle")}
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground text-pretty sm:text-base">
            {t("heroLead")}
          </p>
          {/* Слоган бренда — из конфига, чтобы магазин «переодевался» одним файлом. */}
          <p className="text-xs font-medium text-primary sm:text-sm">
            {brand.tagline[locale]}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/catalog"
            className={buttonVariants({ size: "lg", className: "rounded-full" })}
          >
            {t("heroCta")}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
          <Link
            href="/catalog?sale=1"
            className={buttonVariants({
              variant: "outline",
              size: "lg",
              className: "rounded-full bg-card",
            })}
          >
            <Percent className="size-4" aria-hidden />
            {t("heroSaleCta")}
          </Link>
        </div>
      </div>
    </section>
  );
}

import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";

import { routing, type Locale } from "@/i18n/routing";
import { getActiveBanners } from "@/lib/banners";
import { BannerSlider } from "@/components/home/banner-slider";
import { HomeHero } from "@/components/home/hero";
import { CategoryTiles } from "@/components/home/category-tiles";
import { ProductRail } from "@/components/home/product-rail";
import { ContactCta } from "@/components/home/contact-cta";
import { TrustBar } from "@/components/catalog/trust-bar";
import { ProductGridSkeleton } from "@/components/catalog/product-grid-skeleton";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loc: Locale = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;

  // Первый экран: баннеры из админки, если они есть. Пока их не загрузили —
  // показываем обычный hero, чтобы главная никогда не выглядела пустой.
  const banners = await getActiveBanners(loc);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-4 py-6 sm:px-6 sm:py-8 sm:gap-14">
      {banners.length > 0 ? (
        <BannerSlider banners={banners} />
      ) : (
        <HomeHero locale={loc} />
      )}

      <Suspense fallback={null}>
        <CategoryTiles locale={loc} />
      </Suspense>

      <Suspense fallback={<ProductGridSkeleton />}>
        <ProductRail locale={loc} variant="new" />
      </Suspense>

      <Suspense fallback={null}>
        <ProductRail locale={loc} variant="sale" />
      </Suspense>

      <TrustBar />

      <ContactCta />
    </main>
  );
}

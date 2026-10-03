import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing, type Locale } from "@/i18n/routing";
import { getProductBySlug, productExists } from "@/lib/product";
import { getCartQuantitiesByVariant } from "@/lib/cart";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductVariantSelector } from "@/components/product/product-variant-selector";
import { ColorSelectionProvider } from "@/components/product/color-selection";
import { SizeGuideDialog } from "@/components/product/size-guide-dialog";
import { ProductDetails } from "@/components/product/product-details";
import { BundleContents } from "@/components/product/bundle-contents";
import { StickyBuyPanel } from "@/components/product/sticky-buy-panel";
import { ProductReviews } from "@/components/product/product-reviews";
import { ScrollToHash } from "@/components/scroll-to-hash";
import { ProductSkeleton } from "@/components/product/product-skeleton";

type PageParams = { params: Promise<{ locale: string; slug: string }> };

function resolveLocale(locale: string): Locale {
  return hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
}

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await getProductBySlug(slug, resolveLocale(locale));
  if (!product) return {};
  const image = product.images[0]?.url;
  return {
    title: product.metaTitle ?? product.name,
    description: product.metaDescription ?? product.description ?? undefined,
    openGraph: image ? { images: [image] } : undefined,
  };
}

export default async function ProductPage({ params }: PageParams) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const loc = resolveLocale(locale);

  // Проверка существования ДО стриминга — гарантирует корректный HTTP 404.
  if (!(await productExists(slug))) notFound();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
      {/* Данные грузятся внутри Suspense → скелетон при переходе. */}
      <Suspense fallback={<ProductSkeleton />}>
        <ProductContent slug={slug} locale={loc} />
      </Suspense>
    </main>
  );
}

async function ProductContent({
  slug,
  locale,
}: {
  slug: string;
  locale: Locale;
}) {
  const product = await getProductBySlug(slug, locale);
  // Товар точно существует (проверено выше), но на всякий случай:
  if (!product) notFound();

  // Что из этого товара уже в корзине — чтобы кнопка знала свой предел.
  // router.refresh() после добавления перечитывает эти числа.
  const inCart = await getCartQuantitiesByVariant(
    product.variants.map((v) => v.id),
  );

  return (
    <>
      {/* Широкий экран: слева фото и отзывы листаются вместе со страницей,
          справа покупка ЕДЕТ С НИМИ, пока не покажется её низ, и дальше стоит
          (см. StickyBuyPanel). Раньше тут были две независимые области
          прокрутки: колесо над одной половиной другую не двигало — от этого
          отказались, правая половина должна подниматься вместе с левой.
          Телефон: колонка одна, поэтому левая обёртка становится «прозрачной»
          (display:contents) — её дети встают в общую сетку, и порядок задаётся
          order-*: фото → покупка → отзывы. */}
      <ColorSelectionProvider>
        <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
          <div className="contents lg:block">
            <div className="order-1">
              <ProductGallery images={product.images} />
            </div>

            <div className="order-3 lg:mt-8">
              {/* Доезжаем до отзыва из уведомления — здесь, ВНУТРИ готового
                  содержимого: снаружи Suspense элемента ещё нет. */}
              <ScrollToHash />
              <ProductReviews
                productId={product.id}
                reviews={product.reviews}
                ratingAvg={product.ratingAvg}
                ratingCount={product.ratingCount}
                locale={locale}
              />
            </div>
          </div>

          <StickyBuyPanel className="order-2 flex flex-col gap-6">
            <div>
              {product.categoryName && (
                <p className="text-sm text-muted-foreground">
                  {product.categoryName}
                </p>
              )}
              <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">
                {product.name}
              </h1>
            </div>

            <ProductVariantSelector
              variants={product.variants}
              priceFromMinor={product.priceFromMinor}
              locale={locale}
              inCart={inCart}
              colorThumbs={product.colorThumbs}
              sizeGuideSlot={<SizeGuideDialog locale={locale} />}
            />

            <BundleContents items={product.bundleItems} />

            <ProductDetails product={product} />
          </StickyBuyPanel>
        </div>
      </ColorSelectionProvider>
    </>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { ChevronLeft } from "lucide-react";
import { routing, type Locale } from "@/i18n/routing";
import { getProductBySlug, productExists } from "@/lib/product";
import { getCartQuantitiesByVariant } from "@/lib/cart";
import { Link } from "@/i18n/navigation";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductVariantSelector } from "@/components/product/product-variant-selector";
import { ColorSelectionProvider } from "@/components/product/color-selection";
import { SizeGuideDialog } from "@/components/product/size-guide-dialog";
import { ProductDetails } from "@/components/product/product-details";
import { BundleContents } from "@/components/product/bundle-contents";
import { ProductReviews } from "@/components/product/product-reviews";
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

  const t = await getTranslations("Product");

  return (
    <main className="mx-auto w-full max-w-site flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <Link
        href="/catalog"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden />
        {t("backToCatalog")}
      </Link>

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
      {/* Широкий экран: две независимые области прокрутки — слева фото и отзывы,
          справа покупка. Колесо над одной половиной другую не двигает
          (overscroll-contain), полосы прокрутки скрыты.
          Телефон: колонка одна, поэтому левая обёртка становится «прозрачной»
          (display:contents) — её дети встают в общую сетку, и порядок задаётся
          order-*: фото → покупка → отзывы. */}
      <ColorSelectionProvider>
        <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
          <div className="contents lg:block lg:h-[calc(100dvh-8rem)] lg:overflow-y-auto lg:overscroll-contain lg:pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="order-1">
              <ProductGallery images={product.images} />
            </div>

            <div className="order-3 lg:mt-8">
              <ProductReviews
                productId={product.id}
                reviews={product.reviews}
                ratingAvg={product.ratingAvg}
                ratingCount={product.ratingCount}
                locale={locale}
              />
            </div>
          </div>

          <div className="order-2 flex flex-col gap-6 lg:h-[calc(100dvh-8rem)] lg:overflow-y-auto lg:overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
          </div>
        </div>
      </ColorSelectionProvider>
    </>
  );
}

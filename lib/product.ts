import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { SIZE_CODES, type SizeCode } from "@/lib/constants";
import { colorKey } from "@/lib/color";
import { discountPercent, hasDiscount } from "@/lib/discount";
import type {
  ProductVariantVM,
  ProductDetailVM,
} from "@/lib/product-types";
import type { Locale } from "@/i18n/routing";

// Разбить локализованный многострочный список (состав набора) в массив пунктов.
function splitLines(value: string | null): string[] {
  if (!value) return [];
  return value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function splitCsv(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// Лёгкая проверка существования — вызывается ДО стриминга, чтобы notFound()
// выставил корректный HTTP 404 (иначе loading/Suspense успевает отдать 200).
export async function productExists(slug: string): Promise<boolean> {
  const p = await prisma.product.findUnique({
    where: { slug },
    select: { id: true, isPublished: true },
  });
  return !!p && p.isPublished;
}

// cache() дедуплицирует запрос в рамках одного запроса (page + generateMetadata).
export const getProductBySlug = cache(async function getProductBySlug(
  slug: string,
  locale: Locale,
): Promise<ProductDetailVM | null> {
  const p = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
      variants: true,
      reviews: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!p || !p.isPublished) return null;

  const az = locale === "az";

  // Карта вариант → ключ цвета (по colorRu). Нужна, чтобы сопоставить фото с цветом.
  const variantColorKey = new Map<string, string>();
  for (const v of p.variants) variantColorKey.set(v.id, colorKey(v.colorRu));

  // Варианты в порядке размеров (по SIZE_CODES), затем по цвету.
  const variants: ProductVariantVM[] = p.variants
    .map((v) => ({
      id: v.id,
      sizeCode: v.sizeCode as SizeCode,
      sizeLabel: az ? v.sizeLabelAz : v.sizeLabelRu,
      heightMinCm: v.heightMinCm,
      heightMaxCm: v.heightMaxCm,
      color: az ? v.colorAz : v.colorRu,
      colorKey: colorKey(v.colorRu),
      colorHex: v.colorHex,
      priceMinor: v.price,
      compareAtMinor: hasDiscount(v.price, v.compareAtPrice)
        ? v.compareAtPrice
        : null,
      discountPercent: discountPercent(v.price, v.compareAtPrice),
      stock: v.stock,
      available: v.isActive && v.stock > 0,
    }))
    .sort((a, b) => {
      const bySize =
        SIZE_CODES.indexOf(a.sizeCode) - SIZE_CODES.indexOf(b.sizeCode);
      return bySize !== 0 ? bySize : a.color.localeCompare(b.color);
    });

  // Первое фото каждого цвета — для миниатюр в выборе цвета.
  // Порядок фото уже задан админом (sortOrder), поэтому берём первое встреченное.
  const colorThumbs: Record<string, string> = {};
  for (const img of p.images) {
    const key = img.variantId ? variantColorKey.get(img.variantId) : undefined;
    if (key && !colorThumbs[key]) colorThumbs[key] = img.url;
  }

  const prices = variants.map((v) => v.priceMinor);
  const ratings = p.reviews.map((r) => r.rating);
  const ratingCount = ratings.length;
  const ratingAvg = ratingCount
    ? ratings.reduce((s, r) => s + r, 0) / ratingCount
    : null;

  return {
    id: p.id,
    slug: p.slug,
    name: az ? p.nameAz : p.nameRu,
    description: (az ? p.descriptionAz : p.descriptionRu) || null,
    composition: (az ? p.compositionAz : p.compositionRu) || null,
    care: (az ? p.careAz : p.careRu) || null,
    isBundle: p.isBundle,
    bundleItems: splitLines(az ? p.bundleItemsAz : p.bundleItemsRu),
    isOrganic: p.isOrganic,
    isHypoallergenic: p.isHypoallergenic,
    cottonPercent: p.cottonPercent,
    certifications: splitCsv(p.certifications),
    categoryName: p.category
      ? az
        ? p.category.nameAz
        : p.category.nameRu
      : null,
    images: p.images.map((img) => ({
      url: img.url,
      alt: (az ? img.altAz : img.altRu) || (az ? p.nameAz : p.nameRu),
      // Фото цвета: ключ берём у связанного варианта; иначе общее фото (null).
      colorKey: img.variantId ? variantColorKey.get(img.variantId) ?? null : null,
    })),
    colorThumbs,
    variants,
    priceFromMinor: prices.length ? Math.min(...prices) : 0,
    reviews: p.reviews.map((r) => ({
      id: r.id,
      author: r.user?.name ?? null,
      rating: r.rating,
      title: r.title,
      body: r.body,
      createdAt: r.createdAt.toISOString(),
      verified: r.isVerifiedPurchase,
      reply: r.replyBody,
      replyAt: r.replyAt ? r.replyAt.toISOString() : null,
    })),
    ratingAvg,
    ratingCount,
    metaTitle: (az ? p.metaTitleAz : p.metaTitleRu) || null,
    metaDescription: (az ? p.metaDescriptionAz : p.metaDescriptionRu) || null,
  };
});

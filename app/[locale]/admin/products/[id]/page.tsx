import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing, type Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { colorKey } from "@/lib/color";
import { getCategoriesFlat } from "@/lib/admin/categories";
import { getAdminProductById } from "@/lib/admin/products";
import {
  ProductForm,
  type ProductFormInitial,
} from "@/components/admin/product-form";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const loc: Locale = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;

  const [t, product, categories] = await Promise.all([
    getTranslations("Admin.Products"),
    getAdminProductById(id),
    getCategoriesFlat(),
  ]);
  if (!product) notFound();

  // Раскладываем фото: общие (без варианта) → галерея, с вариантом → по ключу цвета.
  const variantColor = new Map<string, string>();
  for (const v of product.variants) variantColor.set(v.id, colorKey(v.colorRu));
  type ImgItem = {
    key: string;
    id: string;
    url: string;
    altRu: string;
    altAz: string;
  };
  const generalImages: ImgItem[] = [];
  const colorImages: Record<string, ImgItem[]> = {};
  for (const im of product.images) {
    const item = {
      key: im.id,
      id: im.id,
      url: im.url,
      altRu: im.altRu ?? "",
      altAz: im.altAz ?? "",
    };
    const key = im.variantId ? variantColor.get(im.variantId) : undefined;
    if (key) (colorImages[key] ??= []).push(item);
    else generalImages.push(item);
  }

  // DB → начальное состояние формы (цены минорные → мажорные строкой).
  const initial: ProductFormInitial = {
    id: product.id,
    slug: product.slug,
    nameRu: product.nameRu,
    nameAz: product.nameAz,
    descriptionRu: product.descriptionRu ?? "",
    descriptionAz: product.descriptionAz ?? "",
    compositionRu: product.compositionRu ?? "",
    compositionAz: product.compositionAz ?? "",
    careRu: product.careRu ?? "",
    careAz: product.careAz ?? "",
    isOrganic: product.isOrganic,
    isHypoallergenic: product.isHypoallergenic,
    cottonPercent: product.cottonPercent != null ? String(product.cottonPercent) : "",
    certifications: product.certifications ?? "",
    isBundle: product.isBundle,
    isPublished: product.isPublished,
    bundleItemsRu: product.bundleItemsRu ?? "",
    bundleItemsAz: product.bundleItemsAz ?? "",
    categoryId: product.categoryId ?? "",
    variants: product.variants.map((v) => ({
      key: v.id,
      id: v.id,
      sku: v.sku,
      sizeCode: v.sizeCode,
      colorRu: v.colorRu,
      colorAz: v.colorAz,
      colorHex: v.colorHex ?? "",
      price: (v.price / 100).toFixed(2),
      compareAtPrice:
        v.compareAtPrice != null ? (v.compareAtPrice / 100).toFixed(2) : "",
      stock: String(v.stock),
      stockLoaded: String(v.stock),
      isActive: v.isActive,
    })),
    images: generalImages,
    colorImages,
  };

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
      <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin/products" className="hover:text-foreground">
          {t("title")}
        </Link>
        <span>/</span>
        <span className="truncate">{loc === "az" ? product.nameAz : product.nameRu}</span>
      </div>
      <h1 className="mb-5 font-heading text-2xl font-bold sm:text-3xl">
        {t("editTitle")}
      </h1>
      <ProductForm locale={loc} categories={categories} initial={initial} />
    </main>
  );
}

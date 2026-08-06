import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing, type Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { getCategoriesFlat } from "@/lib/admin/categories";
import {
  ProductForm,
  type ProductFormInitial,
} from "@/components/admin/product-form";

const EMPTY_INITIAL: ProductFormInitial = {
  slug: "",
  nameRu: "",
  nameAz: "",
  descriptionRu: "",
  descriptionAz: "",
  compositionRu: "",
  compositionAz: "",
  careRu: "",
  careAz: "",
  isOrganic: false,
  isHypoallergenic: false,
  cottonPercent: "",
  certifications: "",
  isBundle: false,
  isPublished: true,
  bundleItemsRu: "",
  bundleItemsAz: "",
  categoryId: "",
  variants: [],
  images: [],
  colorImages: {},
};

export default async function NewProductPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loc: Locale = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;

  const t = await getTranslations("Admin.Products");
  const categories = await getCategoriesFlat();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
      <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin/products" className="hover:text-foreground">
          {t("title")}
        </Link>
        <span>/</span>
        <span>{t("add")}</span>
      </div>
      <h1 className="mb-5 text-2xl font-semibold sm:text-3xl">{t("add")}</h1>
      <ProductForm
        locale={loc}
        categories={categories}
        initial={EMPTY_INITIAL}
      />
    </main>
  );
}

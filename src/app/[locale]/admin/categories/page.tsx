import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCategoriesFlat } from "@/lib/admin/categories";
import { CategoryManager } from "@/components/admin/category-manager";

export default async function AdminCategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Admin.Categories");
  const categories = await getCategoriesFlat();

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
      <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin" className="hover:text-foreground">
          {t("backToAdmin")}
        </Link>
        <span>/</span>
        <span>{t("title")}</span>
      </div>
      <h1 className="mb-5 text-2xl font-semibold sm:text-3xl">{t("title")}</h1>
      <CategoryManager categories={categories} />
    </main>
  );
}

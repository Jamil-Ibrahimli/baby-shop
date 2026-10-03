import { setRequestLocale, getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { getAdminBanners } from "@/lib/admin/banners";
import { BannerManager } from "@/components/admin/banner-manager";

// Баннеры главной страницы: список с загрузкой картинок, текстом и порядком.
// Права проверяет оболочка админки (app/[locale]/admin/layout.tsx).
export default async function AdminBannersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, banners] = await Promise.all([
    getTranslations("Admin.Banners"),
    getAdminBanners(),
  ]);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
      <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin" className="hover:text-foreground">
          {t("backToAdmin")}
        </Link>
        <span>/</span>
        <span>{t("title")}</span>
      </div>
      <h1 className="font-heading text-2xl font-bold sm:text-3xl">
        {t("title")}
      </h1>
      <p className="mt-1 mb-5 text-sm text-muted-foreground">{t("lead")}</p>

      <BannerManager banners={banners} />
    </main>
  );
}

import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing, type Locale } from "@/i18n/routing";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { ToastProvider } from "@/components/ui/toast";

// Оболочка витрины (всё, кроме админки): общая шапка и подвал сайта.
// Админка живёт в своей оболочке с сайдбаром (app/[locale]/admin/layout.tsx),
// поэтому шапка вынесена сюда, а не в корневой layout локали.
export default async function ShopLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loc: Locale = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;
  const t = await getTranslations("Common");

  // Провайдер уведомлений — на всю витрину: тосты о корзине показываются
  // и со страницы товара, и из любого будущего места.
  return (
    <ToastProvider closeLabel={t("close")}>
      <SiteHeader />
      {children}
      <SiteFooter locale={loc} />
    </ToastProvider>
  );
}

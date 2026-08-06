import { setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/layout/site-header";

// Оболочка витрины (всё, кроме админки): общая шапка сайта.
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

  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}

import { redirect } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { auth } from "@/auth";
import { routing, type Locale } from "@/i18n/routing";
import { getAdminUnreadCount } from "@/lib/notifications";
import { AdminSidebar, AdminMobileBar } from "@/components/admin/admin-sidebar";
import { AdminSupportFooter } from "@/components/admin/admin-support-footer";

// Доступ к админке — ТОЛЬКО для роли admin. Остальных (гость и customer) редиректим.
// Здесь же — оболочка панели: сайдбар (десктоп) / меню-sheet (мобильный) и рабочая
// область на мягкой подложке. Шапки сайта в админке нет — она в оболочке витрины.
export default async function AdminLayout({
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

  const session = await auth();
  if (session?.user?.role !== "admin") {
    redirect(`/${loc}`);
  }

  const t = await getTranslations("Auth.Account");
  const unread = await getAdminUnreadCount();
  const user = {
    name: session.user.name ?? t("roleAdmin"),
    email: session.user.email ?? null,
  };

  return (
    <div className="flex min-h-svh w-full bg-surface">
      <AdminSidebar unread={unread} user={user} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminMobileBar unread={unread} user={user} />
        {children}
        <AdminSupportFooter />
      </div>
    </div>
  );
}

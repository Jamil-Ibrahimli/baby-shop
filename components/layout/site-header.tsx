import { getTranslations } from "next-intl/server";
import { Bell, ShoppingBag, LayoutGrid } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/brand/logo";
import { getCartCount } from "@/lib/cart";
import { getCustomerUnreadCount } from "@/lib/notifications";
import { auth } from "@/auth";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { AccountMenu } from "@/components/layout/account-menu";

// Шапка сайта: бренд, каталог, язык, аккаунт, «колокольчик» покупателя, корзина.
export async function SiteHeader() {
  const t = await getTranslations("Header");
  const count = await getCartCount();
  const session = await auth();
  // Роль нужна меню профиля: у админа там появляется вход в админку.
  const isAdmin = session?.user?.role === "admin";
  // «Колокольчик» в шапке магазина — ВСЕГДА про покупателя, даже если вошёл
  // админ: шапка это витрина, и уводить с неё в админ-панель неожиданно.
  // Лента магазина живёт в самой админке (сайдбар → «Уведомления»),
  // там же и её собственный счётчик непрочитанных.
  const unread = session?.user
    ? await getCustomerUnreadCount(session.user.id)
    : 0;

  return (
    // В тёмной теме шапка — отдельный слой НАД контентом, а не продолжение фона:
    // она берёт цвет карточки (светлее фона), поэтому граница между «хромом» и
    // страницей видна сразу. В светлой теме так делать нечего — там и шапка, и
    // карточки одинаково белые, и разделяет их тонкая линия.
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur dark:bg-card/85">
      <div className="mx-auto flex h-14 w-full max-w-site items-center gap-4 px-4 sm:px-6">
        <Link href="/" aria-label={t("home")} className="shrink-0">
          <Logo />
        </Link>
        <nav className="ml-2 hidden sm:block">
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium shadow-sm transition-colors hover:bg-muted"
          >
            <LayoutGrid className="size-4 text-primary" aria-hidden />
            {t("catalog")}
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <LocaleSwitcher />
          <ThemeToggle />
          {session?.user && (
            <Link
              href="/notifications"
              aria-label={t("notifications")}
              className="relative inline-flex size-9 items-center justify-center rounded-full transition-colors hover:bg-muted"
            >
              <Bell className="size-5" aria-hidden />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white">
                  {unread}
                </span>
              )}
            </Link>
          )}
          {session?.user ? (
            <AccountMenu
              name={session.user.name ?? session.user.email ?? ""}
              isAdmin={isAdmin}
            />
          ) : (
            <Link
              href="/login"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("signIn")}
            </Link>
          )}
          <Link
            href="/cart"
            aria-label={t("cart")}
            className="relative inline-flex size-9 items-center justify-center rounded-full transition-colors hover:bg-muted"
          >
            <ShoppingBag className="size-5" aria-hidden />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}

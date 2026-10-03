import { redirect } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { ChevronRight, Bell } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { routing, type Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { dateFormat, formatMoney } from "@/lib/format";
import { getCustomerUnreadCount } from "@/lib/notifications";
import { LogoutButton } from "@/components/auth/logout-button";

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loc: Locale = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;

  const session = await auth();
  if (!session?.user) {
    redirect(`/${loc}/login`);
  }

  const [t, tStatus] = await Promise.all([
    getTranslations("Auth.Account"),
    getTranslations("OrderStatus"),
  ]);

  // История заказов и адреса — из БД (пусто → пустые состояния).
  // Уведомления живут отдельной страницей (/notifications), здесь только счётчик.
  const [orders, addresses, unread] = await Promise.all([
    prisma.order.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        currency: true,
        createdAt: true,
      },
    }),
    prisma.address.findMany({
      where: { userId: session.user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    }),
    getCustomerUnreadCount(session.user.id),
  ]);

  const tNotif = await getTranslations("Notifications");
  const dateFmt = dateFormat(loc, { dateStyle: "medium" });
  const roleLabel =
    session.user.role === "admin" ? t("roleAdmin") : t("roleCustomer");

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold sm:text-3xl">{t("title")}</h1>
        <LogoutButton />
      </div>

      {/* Профиль */}
      <div className="mt-6 rounded-2xl border border-border bg-card p-5">
        <p className="font-medium">
          {session.user.name ?? session.user.email}
        </p>
        <p className="text-sm text-muted-foreground">{session.user.email}</p>
        <p className="mt-2 text-sm">
          <span className="text-muted-foreground">{t("roleLabel")}: </span>
          {roleLabel}
        </p>
      </div>

      {/* Уведомления — отдельный раздел, тут только вход в него со счётчиком */}
      <Link
        href="/notifications"
        className="mt-4 flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary">
          <Bell className="size-5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1 font-medium">{tNotif("title")}</span>
        {unread > 0 && (
          <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
            {unread}
          </span>
        )}
        <ChevronRight
          className="size-4 shrink-0 text-muted-foreground"
          aria-hidden
        />
      </Link>

      {/* История заказов */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">{t("ordersTitle")}</h2>
        {orders.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            {t("ordersEmpty")}
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {orders.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/order/${o.orderNumber}`}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border p-4 transition-colors hover:bg-muted"
                >
                  <div className="min-w-0">
                    <p className="font-medium">№ {o.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {dateFmt.format(o.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="inline-block rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground">
                        {tStatus(o.status)}
                      </span>
                      <p className="mt-1 text-sm font-semibold">
                        {formatMoney(o.total, o.currency, loc)}
                      </p>
                    </div>
                    <ChevronRight
                      className="size-4 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Сохранённые адреса */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">{t("addressesTitle")}</h2>
        {addresses.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            {t("addressesEmpty")}
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {addresses.map((a) => (
              <li
                key={a.id}
                className="rounded-2xl border border-border p-4 text-sm"
              >
                <p className="font-medium">
                  {a.fullName}
                  {a.isDefault && (
                    <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">
                      ★
                    </span>
                  )}
                </p>
                <p className="text-muted-foreground">
                  {[a.postalCode, a.city, a.line1, a.line2]
                    .filter(Boolean)
                    .join(", ")}
                </p>
                <p className="text-muted-foreground">{a.phone}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

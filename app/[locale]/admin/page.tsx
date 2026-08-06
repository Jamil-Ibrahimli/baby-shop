import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { Bell, ClipboardList, Inbox, Shirt, ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { routing, type Locale } from "@/i18n/routing";
import { formatMoney } from "@/lib/format";
import { getAdminUnreadCount } from "@/lib/notifications";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";

// Главная админки: сводка (заявки, заказы, товары, непрочитанные) и последние заказы.
export default async function AdminHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loc: Locale = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;

  const t = await getTranslations("Admin");
  const [unread, newOrders, ordersTotal, products, latest] = await Promise.all([
    getAdminUnreadCount(),
    prisma.order.count({ where: { status: "created" } }),
    prisma.order.count(),
    prisma.product.count({ where: { isPublished: true } }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        currency: true,
        customerName: true,
      },
    }),
  ]);

  const stats = [
    {
      href: "/admin/orders",
      icon: Inbox,
      label: t("statNewOrders"),
      value: newOrders,
      accent: true,
    },
    {
      href: "/admin/orders",
      icon: ClipboardList,
      label: t("statOrders"),
      value: ordersTotal,
    },
    { href: "/admin/products", icon: Shirt, label: t("statProducts"), value: products },
    {
      href: "/admin/notifications",
      icon: Bell,
      label: t("statUnread"),
      value: unread,
    },
  ];

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="font-heading text-2xl font-bold sm:text-3xl">
        {t("title")}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/40"
          >
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <s.icon className="size-4 text-primary" aria-hidden />
              {s.label}
            </span>
            <span
              className={
                s.accent && s.value > 0
                  ? "mt-1.5 block font-heading text-3xl font-bold text-primary"
                  : "mt-1.5 block font-heading text-3xl font-bold"
              }
            >
              {s.value}
            </span>
          </Link>
        ))}
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-heading text-lg font-bold">
            {t("latestOrders")}
          </h2>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            {t("seeAll")}
            <ChevronRight className="size-3.5" aria-hidden />
          </Link>
        </div>

        {latest.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
            {t("Orders.empty")}
          </p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {latest.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/admin/orders/${o.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/40"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">
                      {o.orderNumber}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {o.customerName}
                    </span>
                  </span>
                  <OrderStatusBadge status={o.status} />
                  <span className="shrink-0 text-sm font-semibold">
                    {formatMoney(o.total, o.currency, loc)}
                  </span>
                  <ChevronRight
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

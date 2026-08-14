import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { BellOff } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { routing, type Locale } from "@/i18n/routing";
import { dateFormat, formatMoney } from "@/lib/format";
import {
  NOTIFICATION_FILTERS,
  parseNotificationFilter,
  matchesNotificationFilter,
  groupNotificationsByDay,
  type NotificationFilter,
} from "@/lib/notifications-shared";
import { NotificationItem } from "@/components/admin/notification-item";
import { NotificationsActions } from "@/components/admin/notifications-actions";
import { NotificationsFilter } from "@/components/admin/notifications-filter";

export default async function AdminNotificationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ filter?: string | string[] }>;
}) {
  const [{ locale }, sp] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);
  const loc: Locale = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;

  const t = await getTranslations("Notifications");
  const filter = parseNotificationFilter(sp.filter);

  const notifications = await prisma.notification.findMany({
    where: { recipientRole: "admin" },
    orderBy: { createdAt: "desc" },
    include: {
      order: {
        select: {
          orderNumber: true,
          total: true,
          currency: true,
          customerName: true,
          status: true,
        },
      },
    },
  });

  // Счётчики по всем табам считаем от одной выборки — лишних запросов не делаем.
  const counts = Object.fromEntries(
    NOTIFICATION_FILTERS.map((f) => [
      f,
      notifications.filter((n) => matchesNotificationFilter(n, f)).length,
    ]),
  ) as Record<NotificationFilter, number>;

  const visible = notifications.filter((n) =>
    matchesNotificationFilter(n, filter),
  );
  const unreadCount = counts.unread;
  const hasRead = notifications.some((n) => n.isRead);

  const dateTimeFmt = dateFormat(loc, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const dayFmt = dateFormat(loc, { day: "numeric", month: "long" });
  const dayYearFmt = dateFormat(loc, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const now = new Date();
  const groups = groupNotificationsByDay(
    visible,
    (date, kind) =>
      kind === "today"
        ? t("today")
        : kind === "yesterday"
          ? t("yesterday")
          : date.getFullYear() === now.getFullYear()
            ? dayFmt.format(date)
            : dayYearFmt.format(date),
    now,
  );

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h1 className="flex flex-wrap items-center gap-2.5 font-heading text-2xl font-bold sm:text-3xl">
          {t("title")}
          {unreadCount > 0 && (
            <span className="rounded-full bg-primary-light px-2.5 py-1 text-xs font-semibold text-primary">
              {t("newCount", { count: unreadCount })}
            </span>
          )}
        </h1>
        <NotificationsActions
          hasUnread={unreadCount > 0}
          hasRead={hasRead}
        />
      </div>

      {notifications.length > 0 && (
        <div className="mt-5">
          <NotificationsFilter
            current={filter}
            counts={counts}
            basePath="/admin/notifications"
          />
        </div>
      )}

      {visible.length === 0 ? (
        <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <BellOff className="size-8 text-muted-foreground" aria-hidden />
          <p className="mt-3 font-medium">
            {notifications.length === 0 ? t("empty") : t("emptyFiltered")}
          </p>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          {groups.map((g) => (
            <section key={g.key}>
              <h2 className="mb-2.5 px-1 text-sm font-semibold text-muted-foreground">
                {g.label}
              </h2>
              <ul className="flex flex-col gap-2.5">
                {g.items.map((n) => (
                  <NotificationItem
                    key={n.id}
                    id={n.id}
                    isRead={n.isRead}
                    recipient="admin"
                    kind={n.orderId ? "order" : "system"}
                    // Заголовок — про СОБЫТИЕ («оформлен заказ»), а не про новизну:
                    // уведомление могло быть прочитано неделю назад. «Новое» показывает
                    // зелёная точка и бейдж «N новых» у заголовка страницы.
                    title={
                      n.type === "new_order"
                        ? t("orderPlaced")
                        : ((loc === "az" ? n.titleAz : n.titleRu) ?? t("title"))
                    }
                    orderNumber={n.order?.orderNumber ?? null}
                    meta={n.order?.customerName ?? null}
                    amount={
                      n.order
                        ? formatMoney(n.order.total, n.order.currency, loc)
                        : null
                    }
                    orderStatus={n.order?.status ?? null}
                    orderId={n.orderId}
                    date={dateTimeFmt.format(n.createdAt)}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}

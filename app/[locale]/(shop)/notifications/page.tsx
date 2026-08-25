import { redirect } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { BellOff, ChevronRight, UserCircle } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { dateFormat } from "@/lib/format";
import { routing, type Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import {
  parseNotificationFilter,
  matchesNotificationFilter,
  groupNotificationsByDay,
  type NotificationFilter,
} from "@/lib/notifications-shared";
import { NotificationItem } from "@/components/admin/notification-item";
import { NotificationsActions } from "@/components/admin/notifications-actions";
import { NotificationsFilter } from "@/components/admin/notifications-filter";

// Табы оставляем только «Все» и «Новые»: делить уведомления покупателя на
// «Заказы» и «Системные» смысла мало — их и так немного (статусы заказа плюс
// ответы магазина на отзывы, у последних заказа нет и карточка идёт без ссылки).
const CUSTOMER_FILTERS: readonly NotificationFilter[] = ["all", "unread"];

// Уведомления покупателя — ОТДЕЛЬНАЯ страница (кабинет остаётся только про
// профиль/заказы/адреса). Показываем строго свои записи: фильтр по userId.
export default async function NotificationsPage({
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

  const session = await auth();
  if (!session?.user) {
    redirect(`/${loc}/login`);
  }

  const [t, tAccount] = await Promise.all([
    getTranslations("Notifications"),
    getTranslations("Auth.Account"),
  ]);
  const filter = parseNotificationFilter(sp.filter);

  const notifications = await prisma.notification.findMany({
    where: { recipientRole: "customer", userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      order: { select: { orderNumber: true } },
    },
  });

  const counts = Object.fromEntries(
    CUSTOMER_FILTERS.map((f) => [
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
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
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
          recipient="customer"
          hasUnread={unreadCount > 0}
          hasRead={hasRead}
        />
      </div>

      {/* Кабинет — соседний раздел, поэтому даём на него явную ссылку */}
      <Link
        href="/account"
        className="mt-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <UserCircle className="size-4" aria-hidden />
        {tAccount("title")}
        <ChevronRight className="size-3.5" aria-hidden />
      </Link>

      {notifications.length > 0 && (
        <div className="mt-5">
          <NotificationsFilter
            current={filter}
            counts={counts}
            basePath="/notifications"
            options={CUSTOMER_FILTERS}
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
                    recipient="customer"
                    kind={n.orderId ? "order" : "system"}
                    // Снапшот заголовка уже содержит номер и объявленный статус
                    // («Заказ BS-…: Принят»), поэтому номер отдельной строкой не дублируем
                    // и текущий статус не показываем — иначе рядом два разных статуса.
                    title={(loc === "az" ? n.titleAz : n.titleRu) ?? t("title")}
                    orderNumber={n.order?.orderNumber ?? null}
                    showOrderNumber={false}
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

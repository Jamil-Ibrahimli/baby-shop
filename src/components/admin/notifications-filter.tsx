"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  NOTIFICATION_FILTERS,
  type NotificationFilter,
} from "@/lib/notifications-shared";
import { cn } from "@/lib/utils";

// Фильтр ленты через URL (?filter=). Значение по умолчанию («все») в URL не пишем.
// Ссылки, а не кнопки — фильтр работает без JS и переживает перезагрузку.
// Один компонент на две ленты: админскую и клиентскую (разный basePath и набор табов).
export function NotificationsFilter({
  current,
  counts,
  basePath,
  options = NOTIFICATION_FILTERS,
}: {
  current: NotificationFilter;
  counts: Record<NotificationFilter, number>;
  basePath: string;
  /** Какие табы показывать (у клиента системных уведомлений нет). */
  options?: readonly NotificationFilter[];
}) {
  const t = useTranslations("Notifications.Filter");

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((f) => {
        const active = f === current;
        return (
          <Link
            key={f}
            href={
              f === "all" ? basePath : { pathname: basePath, query: { filter: f } }
            }
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-colors",
              active
                ? "border-primary/40 bg-primary-light font-semibold text-primary"
                : "border-border bg-card text-muted-foreground hover:bg-muted",
            )}
          >
            {t(f)}
            {counts[f] > 0 && (
              <span className="text-xs opacity-70">{counts[f]}</span>
            )}
          </Link>
        );
      })}
    </div>
  );
}

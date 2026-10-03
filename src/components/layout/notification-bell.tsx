"use client";

import { Bell } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getMyUnreadCount } from "@/lib/notification-actions";
import { NOTIFY_SOUND } from "@/lib/notification-sound";
import { useLiveCount } from "@/lib/use-live-count";

/**
 * «Колокольчик» покупателя со счётчиком непрочитанных.
 *
 * Клиентский он ровно по одной причине: счётчик надо обновлять без
 * перезагрузки страницы. Сама цифра приходит с сервера (initialCount) и дальше
 * подтягивается опросом — см. useLiveCount.
 */
export function NotificationBell({
  initialCount,
  label,
}: {
  initialCount: number;
  /** Локализованная подпись — переводы живут на сервере, сюда приходят готовыми. */
  label: string;
}) {
  const count = useLiveCount(
    initialCount,
    getMyUnreadCount,
    NOTIFY_SOUND.customer,
  );

  return (
    <Link
      href="/notifications"
      aria-label={label}
      className="relative inline-flex size-9 items-center justify-center rounded-full transition-colors hover:bg-muted"
    >
      <Bell className="size-5" aria-hidden />
      {count > 0 && (
        <span
          className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white"
          // Счётчик меняется сам, без действий человека: пусть скринридер
          // сообщит об изменении, но вежливо — не перебивая то, что читает.
          aria-live="polite"
        >
          {count}
        </span>
      )}
    </Link>
  );
}

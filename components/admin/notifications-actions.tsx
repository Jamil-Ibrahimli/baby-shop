"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { CheckCheck, Trash2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import {
  markAllNotificationsRead,
  markAllMyNotificationsRead,
  deleteReadNotifications,
  deleteMyReadNotifications,
} from "@/lib/notification-actions";

// Действия над всей лентой: «прочитать все» и «очистить прочитанные».
// Очистка удаляет записи безвозвратно → спрашиваем подтверждение.
// Кнопка показывается только если ей есть что делать (нет непрочитанных — нет кнопки).
export function NotificationsActions({
  recipient = "admin",
  hasUnread,
  hasRead = false,
}: {
  recipient?: "admin" | "customer";
  hasUnread: boolean;
  hasRead?: boolean;
}) {
  const t = useTranslations("Notifications");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const buttonClass =
    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-50";

  return (
    <div className="flex flex-wrap items-center gap-1">
      {hasUnread && (
        <button
          type="button"
          disabled={isPending}
          className={`${buttonClass} text-primary hover:bg-primary-light`}
          onClick={() =>
            startTransition(async () => {
              if (recipient === "admin") await markAllNotificationsRead();
              else await markAllMyNotificationsRead();
              router.refresh();
            })
          }
        >
          <CheckCheck className="size-4" aria-hidden />
          {t("markAllRead")}
        </button>
      )}

      {hasRead && (
        <button
          type="button"
          disabled={isPending}
          className={`${buttonClass} text-destructive hover:bg-destructive/10`}
          onClick={() => {
            if (!confirm(t("confirmClearRead"))) return;
            startTransition(async () => {
              if (recipient === "admin") await deleteReadNotifications();
              else await deleteMyReadNotifications();
              router.refresh();
            });
          }}
        >
          <Trash2 className="size-4" aria-hidden />
          {t("clearRead")}
        </button>
      )}
    </div>
  );
}

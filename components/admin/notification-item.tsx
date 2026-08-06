"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  ShoppingBag,
  Heart,
  BellRing,
  ChevronRight,
  MoreHorizontal,
  Check,
  Trash2,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import {
  markNotificationRead,
  markMyNotificationRead,
  deleteNotification,
  deleteMyNotification,
} from "@/lib/notification-actions";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

// Карточка уведомления. Вся карточка — ссылка на заказ (растянутая ссылка поверх
// содержимого), поэтому кнопки справа лежат ОТДЕЛЬНО от текста: текст не перехватывает
// клики (pointer-events-none), а меню и его пункты — перехватывают.
// «Пометить прочитанным» уходит в фоне и НЕ блокирует переход; счётчик-колокольчик
// обновляется серверно (revalidatePath в экшене). Админ → карточка заказа в админке,
// клиент → страница своего заказа.
export function NotificationItem({
  id,
  title,
  orderNumber,
  showOrderNumber = true,
  meta,
  amount,
  orderStatus,
  date,
  isRead,
  kind = "order",
  recipient,
  orderId,
}: {
  id: string;
  title: string;
  /** Номер заказа: нужен для ссылки клиента и для строки под заголовком. */
  orderNumber?: string | null;
  /**
   * Показывать номер отдельной строкой. У клиентских уведомлений номер уже входит
   * в снапшот заголовка («Заказ BS-…: Принят») — второй раз его не печатаем.
   */
  showOrderNumber?: boolean;
  /** Кто/что за уведомлением — например имя клиента. */
  meta?: string | null;
  /** Сумма заказа (уже отформатированная). */
  amount?: string | null;
  /** ТЕКУЩИЙ статус заказа — уведомление о событии, а состояние могло уехать вперёд. */
  orderStatus?: string | null;
  date: string;
  isRead: boolean;
  /** Тип для иконки: заказ или системное. */
  kind?: "order" | "system";
  recipient: "admin" | "customer";
  orderId?: string | null;
}) {
  const t = useTranslations("Notifications");
  const [, startTransition] = useTransition();

  const href =
    recipient === "admin"
      ? orderId
        ? `/admin/orders/${orderId}`
        : null
      : orderNumber
        ? `/order/${orderNumber}`
        : null;

  function markRead() {
    if (isRead) return;
    startTransition(async () => {
      if (recipient === "admin") await markNotificationRead(id);
      else await markMyNotificationRead(id);
    });
  }

  function remove() {
    startTransition(async () => {
      if (recipient === "admin") await deleteNotification(id);
      else await deleteMyNotification(id);
    });
  }

  return (
    <li className="relative flex items-center gap-3 overflow-hidden rounded-2xl border border-border bg-card p-3 shadow-sm transition-colors hover:border-primary/40">
      {/* Растянутая ссылка: клик по любому «неинтерактивному» месту карточки */}
      {href && (
        <Link
          href={href}
          onClick={markRead}
          aria-label={[title, orderNumber].filter(Boolean).join(" ")}
          className="absolute inset-0 z-0 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        />
      )}

      {/* Содержимое: кликов не перехватывает — они уходят в ссылку под ним */}
      <div className="pointer-events-none relative flex min-w-0 flex-1 items-center gap-3">
        <span
          className={cn(
            "relative flex size-11 shrink-0 items-center justify-center rounded-full",
            kind === "order"
              ? "bg-primary-light text-primary"
              : "bg-secondary-light text-secondary",
          )}
        >
          {kind === "order" ? (
            <>
              <ShoppingBag className="size-5.5" aria-hidden />
              <Heart
                className="absolute size-2 translate-y-1 fill-secondary text-secondary"
                aria-hidden
              />
            </>
          ) : (
            <BellRing className="size-5" aria-hidden />
          )}

          {/* Маркер непрочитанного — яркая зелёная точка на иконке.
              Зелёный берём из стандартной палитры Tailwind (как у бейджей статусов):
              это сигнал состояния, он не должен зависеть от палитры бренда. */}
          {!isRead && (
            <span
              className="absolute -top-0.5 -right-0.5 size-3.5 rounded-full bg-green-500 ring-2 ring-card"
              aria-hidden
            />
          )}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">
            {title}
            {/* Зелёная точка декоративна → состояние «новое» дублируем для скринридера */}
            {!isRead && <span className="sr-only"> — {t("unreadLabel")}</span>}
          </span>
          {orderNumber && showOrderNumber && (
            <span className="block truncate text-sm text-foreground/80">
              {orderNumber}
            </span>
          )}
          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            {meta && <span className="truncate">{meta}</span>}
            {amount && (
              <span className="rounded-full bg-primary-light px-2 py-0.5 font-semibold text-primary">
                {amount}
              </span>
            )}
            {orderStatus && <OrderStatusBadge status={orderStatus} />}
            {/* На мобильном дата живёт здесь, справа для неё нет места */}
            <span className="sm:hidden">{date}</span>
          </span>
        </span>
      </div>

      {/* Правая колонка: дата (десктоп) и действия */}
      <div className="relative z-10 flex shrink-0 items-center gap-1">
        <span className="pointer-events-none hidden pr-1 text-xs text-muted-foreground sm:block">
          {date}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={t("actions")}
            className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
          >
            <MoreHorizontal className="size-4" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {!isRead && (
              <DropdownMenuItem onClick={markRead}>
                <Check className="size-4" aria-hidden />
                {t("markRead")}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem variant="destructive" onClick={remove}>
              <Trash2 className="size-4" aria-hidden />
              {t("delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {href && (
          <ChevronRight
            className="pointer-events-none size-4 text-muted-foreground"
            aria-hidden
          />
        )}
      </div>
    </li>
  );
}

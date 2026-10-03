"use client";

import {
  LayoutDashboard,
  ClipboardList,
  Shirt,
  Users,
  Boxes,
  Percent,
  Images,
  MessageSquareText,
  FileText,
  BarChart3,
  Bell,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { getShopUnreadCount } from "@/lib/notification-actions";
import { NOTIFY_SOUND } from "@/lib/notification-sound";
import { useLiveCount } from "@/lib/use-live-count";

type NavItem = {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  /** Раздел ещё не реализован — показываем неактивным с пометкой «скоро». */
  soon?: boolean;
  /** Какой счётчик показывать: непрочитанные события или отзывы без ответа. */
  badge?: "unread" | "reviews";
};

// Порядок разделов админки. Нереализованные помечены soon — они видны в навигации,
// но не кликабельны (честнее, чем ссылка в никуда). Убираешь soon — раздел оживает.
const NAV_ITEMS: NavItem[] = [
  { href: "/admin", labelKey: "home", icon: LayoutDashboard },
  { href: "/admin/orders", labelKey: "orders", icon: ClipboardList },
  { href: "/admin/products", labelKey: "products", icon: Shirt },
  { href: "/admin/customers", labelKey: "customers", icon: Users, soon: true },
  { href: "/admin/categories", labelKey: "categories", icon: Boxes },
  { href: "/admin/discounts", labelKey: "discounts", icon: Percent, soon: true },
  { href: "/admin/banners", labelKey: "banners", icon: Images },
  {
    href: "/admin/reviews",
    labelKey: "reviews",
    icon: MessageSquareText,
    badge: "reviews",
  },
  { href: "/admin/content", labelKey: "content", icon: FileText, soon: true },
  {
    href: "/admin/analytics",
    labelKey: "analytics",
    icon: BarChart3,
    soon: true,
  },
  {
    href: "/admin/notifications",
    labelKey: "notifications",
    icon: Bell,
    badge: "unread",
  },
  { href: "/admin/settings", labelKey: "settings", icon: Settings, soon: true },
];

// Навигация админки. Активный раздел определяем по пути без локали:
// «/admin» — только точное совпадение, остальные — с учётом вложенных страниц.
function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav({
  unread,
  unansweredReviews,
  onNavigate,
}: {
  unread: number;
  /** Отзывы без ответа — «сколько работы», а не «сколько непрочитанного». */
  unansweredReviews: number;
  /** Закрыть мобильное меню после перехода. */
  onNavigate?: () => void;
}) {
  const t = useTranslations("Admin.Nav");
  const pathname = usePathname();

  // Счётчик непрочитанных подтягивается опросом: сайдбар собирается на сервере,
  // и без этого новое уведомление появлялось только после перезагрузки.
  // Счётчик отзывов не опрашиваем — он меняется, только когда владелец сам
  // отвечает, то есть страница и так пересобирается.
  const liveUnread = useLiveCount(unread, getShopUnreadCount, NOTIFY_SOUND.admin);

  return (
    <nav aria-label={t("label")}>
      <ul className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const active = !item.soon && isActive(pathname, item.href);
          const count =
            item.badge === "reviews"
              ? unansweredReviews
              : item.badge === "unread"
                ? liveUnread
                : 0;

          const inner = (
            <>
              <item.icon
                className={cn(
                  "size-4.5 shrink-0",
                  active ? "text-primary" : "text-muted-foreground",
                )}
                aria-hidden
              />
              <span className="min-w-0 flex-1 truncate">
                {t(item.labelKey)}
              </span>
              {item.soon && (
                <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  {t("soon")}
                </span>
              )}
              {count > 0 && (
                <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
                  {count}
                </span>
              )}
            </>
          );

          const base =
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors";

          if (item.soon) {
            return (
              <li key={item.href}>
                <span
                  aria-disabled="true"
                  className={cn(base, "cursor-default text-muted-foreground/70")}
                >
                  {inner}
                </span>
              </li>
            );
          }

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  base,
                  active
                    ? "bg-primary-light font-semibold text-primary"
                    : "hover:bg-muted",
                )}
              >
                {inner}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

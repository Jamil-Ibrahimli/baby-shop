"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

// Цветной бейдж статуса заказа. Сам берёт локализованную подпись из OrderStatus.
// Цвета — из стандартной палитры Tailwind (со светлой/тёмной темой), чтобы статусы
// визуально различались независимо от токенов бренда.
const STATUS_STYLES: Record<string, string> = {
  created: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  accepted: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  assembled:
    "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
  shipped: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300",
  delivered:
    "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

export function OrderStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const t = useTranslations("OrderStatus");
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        STATUS_STYLES[status] ?? "bg-secondary text-secondary-foreground",
        className,
      )}
    >
      {t(status)}
    </span>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ORDER_STATUSES } from "@/lib/constants";
import { cn } from "@/lib/utils";

// Фильтр заказов по статусу через URL (?status=...). «Все» + чип на каждый статус
// со счётчиком. Активный чип подсвечен. Ссылки — чтобы фильтр работал без JS.
export function OrdersStatusFilter({
  current,
  counts,
  total,
}: {
  current?: string;
  counts: Record<string, number>;
  total: number;
}) {
  const t = useTranslations("OrderStatus");
  const tAdmin = useTranslations("Admin");

  const chip = (active: boolean) =>
    cn(
      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors",
      active
        ? "border-primary bg-primary text-primary-foreground"
        : "border-border hover:bg-muted",
    );

  return (
    <div className="flex flex-wrap gap-2">
      <Link href="/admin/orders" className={chip(!current)}>
        {tAdmin("Orders.all")}
        <span className="text-xs opacity-70">{total}</span>
      </Link>
      {ORDER_STATUSES.map((s) => (
        <Link
          key={s}
          href={{ pathname: "/admin/orders", query: { status: s } }}
          className={chip(current === s)}
        >
          {t(s)}
          <span className="text-xs opacity-70">{counts[s] ?? 0}</span>
        </Link>
      ))}
    </div>
  );
}

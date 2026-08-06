import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { PackageOpen, ChevronRight } from "lucide-react";
import { routing, type Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import {
  getAdminOrders,
  getOrderStatusCounts,
  parseStatusFilter,
} from "@/lib/admin/orders";
import { formatMoney } from "@/lib/format";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { OrdersStatusFilter } from "@/components/admin/orders-status-filter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function AdminOrdersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loc: Locale = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;

  const { status: rawStatus } = await searchParams;
  const status = parseStatusFilter(rawStatus);

  const t = await getTranslations("Admin.Orders");
  const [orders, counts] = await Promise.all([
    getAdminOrders(status),
    getOrderStatusCounts(),
  ]);
  const total = Object.values(counts).reduce((s, n) => s + n, 0);

  const dateFmt = new Intl.DateTimeFormat(loc === "az" ? "az-AZ" : "ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
      <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin" className="hover:text-foreground">
          {t("backToAdmin")}
        </Link>
        <span>/</span>
        <span>{t("title")}</span>
      </div>
      <h1 className="mb-5 text-2xl font-semibold sm:text-3xl">{t("title")}</h1>

      <div className="mb-5">
        <OrdersStatusFilter current={status} counts={counts} total={total} />
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <PackageOpen className="size-8 text-muted-foreground" aria-hidden />
          <p className="mt-3 font-medium">{t("empty")}</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("colNumber")}</TableHead>
                <TableHead>{t("colDate")}</TableHead>
                <TableHead>{t("colCustomer")}</TableHead>
                <TableHead className="text-right">{t("colTotal")}</TableHead>
                <TableHead>{t("colStatus")}</TableHead>
                <TableHead aria-hidden />
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {o.orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {dateFmt.format(o.createdAt)}
                  </TableCell>
                  <TableCell>
                    <span className="block">{o.customerName}</span>
                    <span className="text-xs text-muted-foreground">
                      {o.userId ? t("registered") : t("guest")} ·{" "}
                      {o._count.items} {t("itemsShort")}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatMoney(o.total, o.currency, loc)}
                  </TableCell>
                  <TableCell>
                    <OrderStatusBadge status={o.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      aria-label={t("open")}
                      className="inline-flex text-muted-foreground hover:text-foreground"
                    >
                      <ChevronRight className="size-4" aria-hidden />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </main>
  );
}

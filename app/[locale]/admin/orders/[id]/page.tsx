import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { Phone, Mail, MapPin, Gift, MessageSquare, User } from "lucide-react";
import { routing, type Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { getAdminOrderById } from "@/lib/admin/orders";
import { dateFormat, formatMoney } from "@/lib/format";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { OrderStatusControl } from "@/components/admin/order-status-control";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const loc: Locale = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;
  const az = loc === "az";

  const order = await getAdminOrderById(id);
  if (!order) notFound();

  const t = await getTranslations("Admin.Orders");

  const dateFmt = dateFormat(loc, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const address = [
    order.shipPostalCode,
    order.shipCity,
    order.shipLine1,
    order.shipLine2,
    order.shipCountry,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
      <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin/orders" className="hover:text-foreground">
          {t("title")}
        </Link>
        <span>/</span>
        <span>{order.orderNumber}</span>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">
            {order.orderNumber}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {dateFmt.format(order.createdAt)}
          </p>
        </div>
        <OrderStatusBadge status={order.status} className="text-sm" />
      </div>

      {/* Управление статусом */}
      <section className="mb-6 rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-3 text-base font-semibold">{t("manageStatus")}</h2>
        <OrderStatusControl orderId={order.id} status={order.status} />
      </section>

      {/* Состав заказа (снапшот) */}
      <section className="mb-4 rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-3 text-base font-semibold">{t("itemsTitle")}</h2>
        <ul className="flex flex-col gap-3">
          {order.items.map((i) => (
            <li key={i.id} className="flex justify-between gap-3 text-sm">
              <span className="min-w-0">
                <span className="block">
                  {az ? i.productNameAz : i.productNameRu}
                </span>
                <span className="text-xs text-muted-foreground">
                  {(az ? i.sizeLabelAz : i.sizeLabelRu)} ·{" "}
                  {(az ? i.colorAz : i.colorRu)} · {i.sku} ×{" "}
                  {i.quantity}
                </span>
              </span>
              <span className="shrink-0 font-medium">
                {formatMoney(i.lineTotal, order.currency, loc)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-lg font-semibold">
          <span>{t("total")}</span>
          <span>{formatMoney(order.total, order.currency, loc)}</span>
        </div>
      </section>

      {/* Данные клиента */}
      <section className="mb-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 text-sm">
          <h2 className="mb-3 text-base font-semibold">{t("customerTitle")}</h2>
          <p className="flex items-center gap-2">
            <User className="size-4 text-muted-foreground" aria-hidden />
            {order.customerName}
            <span className="text-xs text-muted-foreground">
              ({order.userId ? t("registered") : t("guest")})
            </span>
          </p>
          <p className="mt-2 flex items-center gap-2">
            <Phone className="size-4 text-muted-foreground" aria-hidden />
            <a href={`tel:${order.customerPhone}`} className="hover:underline">
              {order.customerPhone}
            </a>
          </p>
          {order.customerEmail && (
            <p className="mt-2 flex items-center gap-2">
              <Mail className="size-4 text-muted-foreground" aria-hidden />
              <a
                href={`mailto:${order.customerEmail}`}
                className="break-all hover:underline"
              >
                {order.customerEmail}
              </a>
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 text-sm">
          <h2 className="mb-3 text-base font-semibold">{t("deliveryTitle")}</h2>
          <p className="flex items-start gap-2">
            <MapPin
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <span>{address}</span>
          </p>
        </div>
      </section>

      {/* Подарок / комментарий */}
      {(order.isGift || order.comment) && (
        <section className="mb-4 rounded-2xl border border-border bg-card p-5 text-sm">
          {order.isGift && (
            <p className="flex items-start gap-2">
              <Gift
                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <span>
                {t("gift")}
                {order.giftMessage ? `: ${order.giftMessage}` : ""}
              </span>
            </p>
          )}
          {order.comment && (
            <p className="mt-2 flex items-start gap-2">
              <MessageSquare
                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <span>{order.comment}</span>
            </p>
          )}
        </section>
      )}

      {/* История смены статусов */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-3 text-base font-semibold">{t("historyTitle")}</h2>
        {order.statusHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("historyEmpty")}</p>
        ) : (
          <ol className="flex flex-col gap-3">
            {order.statusHistory.map((h) => (
              <li key={h.id} className="flex items-center gap-3 text-sm">
                <OrderStatusBadge status={h.status} />
                <span className="text-muted-foreground">
                  {dateFmt.format(h.createdAt)}
                  {h.changedByName ? ` · ${h.changedByName}` : ""}
                  {h.note ? ` · ${h.note}` : ""}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}

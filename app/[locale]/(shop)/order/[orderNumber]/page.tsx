import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { routing, type Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { dateFormat, formatMoney } from "@/lib/format";
import { OrderProgress } from "@/components/order/order-progress";

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ locale: string; orderNumber: string }>;
}) {
  const { locale, orderNumber } = await params;
  setRequestLocale(locale);
  const loc: Locale = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true },
  });
  if (!order) notFound();

  // Доступ: админ (любой заказ) ИЛИ владелец-пользователь ИЛИ гость с кукой last_order.
  const [session, store] = await Promise.all([auth(), cookies()]);
  const isAdmin = session?.user?.role === "admin";
  const owns =
    isAdmin ||
    (session?.user && order.userId === session.user.id) ||
    store.get("last_order")?.value === orderNumber;
  if (!owns) notFound();

  // Подписи статусов рисует OrderProgress — здесь они больше не нужны.
  const t = await getTranslations("Order");
  const az = loc === "az";
  const dateFmt = dateFormat(loc, { dateStyle: "long" });

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <CheckCircle2 className="size-12 text-primary" aria-hidden />
        <h1 className="text-2xl font-semibold sm:text-3xl">{t("title")}</h1>
        <p className="text-muted-foreground">{t("thanks")}</p>
        <p className="mt-2 text-lg">
          <span className="text-muted-foreground">{t("numberLabel")}: </span>
          <span className="font-semibold">{order.orderNumber}</span>
        </p>
      </div>

      {/* Шаги заказа: где он сейчас и что будет дальше */}
      <div className="mt-6">
        <OrderProgress status={order.status} />
      </div>

      {/* Позиции (снапшот) */}
      <div className="mt-8 rounded-2xl border border-border bg-card p-5">
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
                  {(az ? i.colorAz : i.colorRu)} × {i.quantity}
                </span>
              </span>
              <span className="shrink-0 text-right font-medium">
                {formatMoney(i.lineTotal, order.currency, loc)}
                {/* Куплено по акции — показываем, сколько стоило до скидки. */}
                {i.compareAtPrice !== null && (
                  <span className="block text-xs font-normal text-muted-foreground line-through">
                    {formatMoney(
                      i.compareAtPrice * i.quantity,
                      order.currency,
                      loc,
                    )}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-lg font-semibold">
          <span>{t("totalLabel")}</span>
          <span>{formatMoney(order.total, order.currency, loc)}</span>
        </div>
      </div>

      {/* Доставка / детали */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border p-4 text-sm">
          <h3 className="mb-1 font-semibold">{t("deliveryTitle")}</h3>
          <p>{order.customerName}</p>
          <p className="text-muted-foreground">{order.customerPhone}</p>
          <p className="text-muted-foreground">
            {[
              order.shipPostalCode,
              order.shipCity,
              order.shipLine1,
              order.shipLine2,
            ]
              .filter(Boolean)
              .join(", ")}
          </p>
        </div>
        {(order.isGift || order.comment) && (
          <div className="rounded-2xl border border-border p-4 text-sm">
            {order.isGift && (
              <p>
                🎁 {t("giftLabel")}
                {order.giftMessage ? `: ${order.giftMessage}` : ""}
              </p>
            )}
            {order.comment && (
              <p className="mt-1 text-muted-foreground">
                {t("commentLabel")}: {order.comment}
              </p>
            )}
          </div>
        )}
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        {dateFmt.format(order.createdAt)}
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/catalog"
          className={buttonVariants({ className: "rounded-full" })}
        >
          {t("continueShopping")}
        </Link>
        {session?.user && (
          <Link
            href="/account"
            className={buttonVariants({
              variant: "outline",
              className: "rounded-full",
            })}
          >
            {t("viewInAccount")}
          </Link>
        )}
      </div>
    </main>
  );
}

import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { ShoppingBag } from "lucide-react";
import { routing, type Locale } from "@/i18n/routing";
import { getCart } from "@/lib/cart";
import { auth } from "@/auth";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { CheckoutForm } from "@/components/checkout/checkout-form";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loc: Locale = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;

  const t = await getTranslations("Checkout");
  const [cart, session] = await Promise.all([getCart(loc), auth()]);

  // Пустая корзина.
  if (cart.items.length === 0) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 py-20 text-center">
        <ShoppingBag className="size-10 text-muted-foreground" aria-hidden />
        <h1 className="text-xl font-semibold">{t("Empty.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("Empty.description")}</p>
        <Link
          href="/catalog"
          className={buttonVariants({ className: "mt-2 rounded-full" })}
        >
          {t("Empty.cta")}
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-semibold sm:text-3xl">{t("title")}</h1>

      {cart.hasIssues && (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-sm">
          <span className="text-destructive">{t("issuesWarning")}</span>
          <Link
            href="/cart"
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "rounded-full",
            })}
          >
            {t("backToCart")}
          </Link>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <CheckoutForm
          locale={loc}
          defaultName={session?.user?.name ?? ""}
          defaultEmail={session?.user?.email ?? ""}
        />

        {/* Сводка заказа */}
        <aside>
          <div className="sticky top-20 flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
            <h2 className="text-base font-semibold">{t("summaryTitle")}</h2>
            <ul className="flex flex-col gap-2 text-sm">
              {cart.items.map((i) => (
                <li key={i.id} className="flex justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block truncate">{i.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {i.sizeLabel} · {i.color} × {i.quantity}
                    </span>
                  </span>
                  <span className="shrink-0 font-medium">
                    {formatPrice(i.lineTotalMinor, loc)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-1 flex items-center justify-between border-t border-border pt-3 text-lg font-semibold">
              <span>{t("total")}</span>
              <span>{formatPrice(cart.subtotalMinor, loc)}</span>
            </div>
            <p className="text-xs text-muted-foreground">{t("paymentNote")}</p>
          </div>
        </aside>
      </div>
    </main>
  );
}

import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { ShoppingBag } from "lucide-react";
import { routing, type Locale } from "@/i18n/routing";
import { getCart } from "@/lib/cart";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { CartItemRow } from "@/components/cart/cart-item-row";
import { formatPrice } from "@/lib/format";

export default async function CartPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loc: Locale = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;

  const t = await getTranslations("Cart");
  const cart = await getCart(loc);

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
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-semibold sm:text-3xl">{t("title")}</h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="divide-y divide-border">
          {cart.items.map((item) => (
            <CartItemRow key={item.id} item={item} locale={loc} />
          ))}
        </div>

        <aside>
          <div className="sticky top-20 flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
            {cart.hasIssues && (
              <p className="text-sm text-muted-foreground">{t("issuesNote")}</p>
            )}
            <div className="text-sm text-muted-foreground">
              {t("itemsCount", { count: cart.count })}
            </div>
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>{t("subtotal")}</span>
              <span>{formatPrice(cart.subtotalMinor, loc)}</span>
            </div>
            {cart.savingsMinor > 0 && (
              <p className="flex items-center justify-between rounded-xl bg-secondary-light px-3 py-2 text-sm font-medium text-secondary-foreground">
                <span>{t("savings")}</span>
                <span>−{formatPrice(cart.savingsMinor, loc)}</span>
              </p>
            )}
            <Link
              href="/checkout"
              className={buttonVariants({
                size: "lg",
                className: "w-full rounded-full",
              })}
            >
              {t("checkout")}
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}

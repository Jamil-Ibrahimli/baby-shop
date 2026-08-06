import { getTranslations } from "next-intl/server";
import { Leaf, ShieldCheck, Heart, Truck } from "lucide-react";

// Плашка доверия под каталогом: 4 ценности магазина. Тексты — из messages (ru/az).
export async function TrustBar() {
  const t = await getTranslations("Catalog.Trust");
  const items = [
    { icon: Leaf, title: t("natural.title"), text: t("natural.text") },
    { icon: ShieldCheck, title: t("safe.title"), text: t("safe.text") },
    { icon: Heart, title: t("love.title"), text: t("love.text") },
    { icon: Truck, title: t("delivery.title"), text: t("delivery.text") },
  ];

  return (
    <div className="mt-8 grid gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
      {items.map((it) => (
        <div key={it.title} className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary/40 text-secondary-foreground">
            <it.icon className="size-5" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold">{it.title}</span>
            <span className="block text-xs text-muted-foreground">
              {it.text}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}

import { getTranslations } from "next-intl/server";
import { Gift } from "lucide-react";

// Что входит в набор (только для товаров-комплектов).
export async function BundleContents({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  const t = await getTranslations("Product.Bundle");

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <Gift className="size-4 text-primary" aria-hidden />
        {t("title")}
      </h3>
      <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

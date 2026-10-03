"use client";

import { useTranslations } from "next-intl";
import { colorKey } from "@/lib/color";
import { ImageUploader } from "./image-uploader";
import type { VariantItem, ImageItem } from "./product-form-types";

// Блок «Фото по цветам»: для каждого уникального ЦВЕТА из вариантов — свой загрузчик.
// Фото привязываются к цвету (не к size+color): одно фото цвета работает на все размеры.
export function ColorImagesEditor({
  variants,
  value,
  onChange,
}: {
  variants: VariantItem[];
  value: Record<string, ImageItem[]>;
  onChange: (next: Record<string, ImageItem[]>) => void;
}) {
  const t = useTranslations("Admin.Products");

  // Уникальные цвета из вариантов (по colorKey), с первым встреченным названием/hex.
  const colors: { key: string; name: string; hex: string }[] = [];
  const seen = new Set<string>();
  for (const v of variants) {
    const name = v.colorRu.trim();
    if (!name) continue;
    const key = colorKey(name);
    if (seen.has(key)) continue;
    seen.add(key);
    colors.push({ key, name, hex: v.colorHex });
  }

  if (colors.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("noColorsYet")}</p>;
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-xs text-muted-foreground">{t("colorImagesHint")}</p>
      {colors.map((c) => (
        <div
          key={c.key}
          className="rounded-xl border border-border bg-surface p-4"
        >
          <div className="mb-3 flex items-center gap-2 border-b border-border pb-2">
            <span
              className="size-4 rounded-full border border-black/10 dark:border-white/20"
              style={{ backgroundColor: c.hex || "transparent" }}
              aria-hidden
            />
            <span className="text-sm font-semibold">{c.name}</span>
          </div>
          <ImageUploader
            tone="card"
            images={value[c.key] ?? []}
            onChange={(imgs) => onChange({ ...value, [c.key]: imgs })}
          />
        </div>
      ))}
    </div>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SIZE_CODES, SIZE_TABLE } from "@/lib/constants";
import { brand } from "@/config/brand";
import { type VariantItem, newKey } from "./product-form-types";

// Редактор вариантов товара: размер + цвет + цена + остаток. Здесь же управление
// остатками (stock редактируется прямо в строке варианта). Контролируемый компонент.
export function VariantEditor({
  locale,
  variants,
  onChange,
}: {
  locale: "ru" | "az";
  variants: VariantItem[];
  onChange: (next: VariantItem[]) => void;
}) {
  const t = useTranslations("Admin.Products");

  function add() {
    onChange([
      ...variants,
      {
        key: newKey(),
        sku: "",
        sizeCode: SIZE_CODES[0],
        colorRu: "",
        colorAz: "",
        colorHex: "",
        price: "",
        stock: "0",
        isActive: true,
      },
    ]);
  }
  function update(key: string, patch: Partial<VariantItem>) {
    onChange(variants.map((v) => (v.key === key ? { ...v, ...patch } : v)));
  }
  function remove(key: string) {
    onChange(variants.filter((v) => v.key !== key));
  }

  return (
    <div className="flex flex-col gap-3">
      {variants.length === 0 && (
        <p className="text-sm text-muted-foreground">{t("noVariants")}</p>
      )}

      {variants.map((v) => (
        <div
          key={v.key}
          className="grid gap-3 rounded-xl border border-border p-3 sm:grid-cols-2"
        >
          <div className="flex flex-col gap-1.5">
            <Label>{t("size")}</Label>
            <select
              value={v.sizeCode}
              onChange={(e) => update(v.key, { sizeCode: e.target.value })}
              className="h-9 rounded-xl border border-border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {SIZE_CODES.map((code) => (
                <option key={code} value={code}>
                  {locale === "az"
                    ? SIZE_TABLE[code].labelAz
                    : SIZE_TABLE[code].labelRu}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{t("sku")}</Label>
            <Input
              value={v.sku}
              placeholder="BODY-0-3m-white"
              onChange={(e) => update(v.key, { sku: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{t("colorRu")}</Label>
            <Input
              value={v.colorRu}
              onChange={(e) => update(v.key, { colorRu: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t("colorAz")}</Label>
            <Input
              value={v.colorAz}
              onChange={(e) => update(v.key, { colorAz: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{t("colorHex")}</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={v.colorHex || "#ffffff"}
                onChange={(e) => update(v.key, { colorHex: e.target.value })}
                className="h-9 w-12 shrink-0 rounded border border-border bg-background"
              />
              <Input
                value={v.colorHex}
                placeholder="#ffffff"
                onChange={(e) => update(v.key, { colorHex: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>
                {t("price")} ({brand.currency})
              </Label>
              <Input
                type="text"
                inputMode="decimal"
                value={v.price}
                placeholder="12.90"
                onChange={(e) => update(v.key, { price: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t("stock")}</Label>
              <Input
                type="number"
                min={0}
                value={v.stock}
                onChange={(e) => update(v.key, { stock: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center justify-between sm:col-span-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={v.isActive}
                onChange={(e) => update(v.key, { isActive: e.target.checked })}
                className="size-4 accent-primary"
              />
              {t("variantActive")}
            </label>
            <button
              type="button"
              onClick={() => remove(v.key)}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-4" aria-hidden />
              {t("removeVariant")}
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="inline-flex w-fit items-center gap-2 rounded-full border border-border px-4 py-2 text-sm transition-colors hover:bg-muted"
      >
        <Plus className="size-4" aria-hidden />
        {t("addVariant")}
      </button>
    </div>
  );
}

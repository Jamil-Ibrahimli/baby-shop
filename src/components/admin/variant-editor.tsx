"use client";

import { useTranslations } from "next-intl";
import { Copy, Plus, Trash2 } from "lucide-react";
import {
  CheckField,
  ColorField,
  SelectField,
  TextField,
} from "./form-fields";
import { SIZE_CODES, SIZE_TABLE, type SizeCode } from "@/lib/constants";
import {
  findDuplicateComboIndexes,
  findDuplicateSkuIndexes,
} from "@/lib/variant-dupes";
import { discountPercent, parseMajorToMinor } from "@/lib/discount";
import { brand } from "@/config/brand";
import { type VariantItem, newKey } from "./product-form-types";

// Редактор вариантов товара: размер + цвет + цена + остаток. Здесь же управление
// остатками (stock редактируется прямо в строке варианта). Контролируемый компонент.
export function VariantEditor({
  locale,
  variants,
  onChange,
  showStockHint = false,
}: {
  locale: "ru" | "az";
  variants: VariantItem[];
  onChange: (next: VariantItem[]) => void;
  showStockHint?: boolean; // только при редактировании: у товара уже есть остатки
}) {
  const t = useTranslations("Admin.Products");

  // Повторы считаем на каждый рендер — состояние не дублируем.
  const duplicateCombos = findDuplicateComboIndexes(variants);
  const duplicateSkus = findDuplicateSkuIndexes(variants);

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
        compareAtPrice: "",
        stock: "0",
        isActive: true,
      },
    ]);
  }

  // «Старую цену» этого варианта проставляем во ВСЕ остальные — по кнопке,
  // чтобы не вбивать её в каждый вариант руками. Само ничего не считается:
  // копируется ровно введённое число, дальше правится вручную.
  function applyCompareAtToAll(key: string) {
    const source = variants.find((v) => v.key === key);
    if (!source) return;
    onChange(
      variants.map((v) => ({ ...v, compareAtPrice: source.compareAtPrice })),
    );
  }
  function update(key: string, patch: Partial<VariantItem>) {
    onChange(variants.map((v) => (v.key === key ? { ...v, ...patch } : v)));
  }
  function remove(key: string) {
    onChange(variants.filter((v) => v.key !== key));
  }
  // Копия варианта встаёт сразу под оригиналом. Переносим всё, кроме:
  // id (в БД это новая строка) и остатка (его админ задаёт заново).
  // Остальные поля НЕ подставляем и не меняем — правит их админ вручную.
  function duplicate(key: string) {
    const index = variants.findIndex((v) => v.key === key);
    if (index < 0) return;
    const copy: VariantItem = { ...variants[index], key: newKey(), stock: "0" };
    delete copy.id;
    delete copy.stockLoaded; // копии в БД ещё нет — её остаток пишется как есть
    onChange([
      ...variants.slice(0, index + 1),
      copy,
      ...variants.slice(index + 1),
    ]);
  }

  return (
    <div className="flex flex-col gap-3">
      {showStockHint && (
        <p className="text-sm text-muted-foreground">{t("stockHint")}</p>
      )}

      {variants.length === 0 && (
        <p className="text-sm text-muted-foreground">{t("noVariants")}</p>
      )}

      {variants.map((v, i) => {
        const comboDup = duplicateCombos.has(i);
        const skuDup = duplicateSkus.has(i);
        // Скидка: старая цена должна быть больше текущей, иначе это ошибка ввода.
        const priceMinor = parseMajorToMinor(v.price);
        const compareMinor = parseMajorToMinor(v.compareAtPrice);
        const compareAtInvalid =
          compareMinor !== null &&
          priceMinor !== null &&
          compareMinor <= priceMinor;
        const percent =
          priceMinor !== null ? discountPercent(priceMinor, compareMinor) : null;
        // Короткая сводка в шапке карточки — чтобы длинный список читался.
        const sizeLabel = SIZE_TABLE[v.sizeCode as SizeCode]
          ? locale === "az"
            ? SIZE_TABLE[v.sizeCode as SizeCode].labelAz
            : SIZE_TABLE[v.sizeCode as SizeCode].labelRu
          : v.sizeCode;
        const colorName = (locale === "az" ? v.colorAz : v.colorRu).trim();
        return (
          <div
            key={v.key}
            className={
              comboDup
                ? "grid gap-3 rounded-xl border border-destructive bg-destructive/5 p-3 sm:grid-cols-2"
                : "grid gap-3 rounded-xl border border-border bg-surface p-3 sm:grid-cols-2"
            }
          >
            {/* Шапка карточки: номер, размер+цвет и действия над вариантом. */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2 sm:col-span-2">
              <span className="flex min-w-0 items-center gap-2 text-sm font-semibold">
                {v.colorHex && (
                  <span
                    className="size-4 shrink-0 rounded-full border border-black/10 dark:border-white/20"
                    style={{ backgroundColor: v.colorHex }}
                    aria-hidden
                  />
                )}
                <span className="truncate">
                  {t("variantNumber", { number: i + 1 })}
                  <span className="ml-2 font-normal text-muted-foreground">
                    {colorName ? `${sizeLabel} · ${colorName}` : sizeLabel}
                  </span>
                </span>
              </span>
              <div className="flex shrink-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => duplicate(v.key)}
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  <Copy className="size-4" aria-hidden />
                  {t("duplicateVariant")}
                </button>
                <button
                  type="button"
                  onClick={() => remove(v.key)}
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-4" aria-hidden />
                  <span className="sr-only sm:not-sr-only">
                    {t("removeVariant")}
                  </span>
                </button>
              </div>
            </div>

            {comboDup && (
              <p className="text-sm text-destructive sm:col-span-2">
                {t("variantComboDuplicate")}
              </p>
            )}

            <SelectField
              label={t("size")}
              value={v.sizeCode}
              invalid={comboDup}
              onChange={(next) => update(v.key, { sizeCode: next })}
            >
              {SIZE_CODES.map((code) => (
                <option key={code} value={code}>
                  {locale === "az"
                    ? SIZE_TABLE[code].labelAz
                    : SIZE_TABLE[code].labelRu}
                </option>
              ))}
            </SelectField>

            <TextField
              label={t("sku")}
              value={v.sku}
              placeholder="BODY-0-3m-white"
              mono
              error={skuDup ? t("variantSkuDuplicate") : undefined}
              onChange={(next) => update(v.key, { sku: next })}
            />

            <TextField
              label={t("colorRu")}
              value={v.colorRu}
              invalid={comboDup}
              onChange={(next) => update(v.key, { colorRu: next })}
            />
            <TextField
              label={t("colorAz")}
              value={v.colorAz}
              onChange={(next) => update(v.key, { colorAz: next })}
            />

            <ColorField
              label={t("colorHex")}
              value={v.colorHex}
              onChange={(next) => update(v.key, { colorHex: next })}
            />

            <div className="grid grid-cols-2 gap-3 sm:col-span-2 sm:grid-cols-3">
              <TextField
                label={t("price")}
                type="text"
                inputMode="decimal"
                value={v.price}
                placeholder="12.90"
                suffix={brand.currency}
                onChange={(next) => update(v.key, { price: next })}
              />
              <TextField
                label={t("compareAtPrice")}
                type="text"
                inputMode="decimal"
                value={v.compareAtPrice}
                placeholder={t("compareAtPlaceholder")}
                suffix={brand.currency}
                error={
                  compareAtInvalid ? t("compareAtTooLow") : undefined
                }
                hint={
                  percent !== null ? t("discountHint", { percent }) : undefined
                }
                onChange={(next) => update(v.key, { compareAtPrice: next })}
              />
              <TextField
                label={t("stock")}
                type="number"
                min={0}
                value={v.stock}
                suffix={t("unitsShort")}
                onChange={(next) => update(v.key, { stock: next })}
              />
            </div>

            {/* Проставить эту же старую цену остальным вариантам — по кнопке. */}
            {variants.length > 1 && v.compareAtPrice.trim() !== "" && (
              <button
                type="button"
                onClick={() => applyCompareAtToAll(v.key)}
                className="w-fit text-sm font-medium text-primary hover:underline sm:col-span-2"
              >
                {t("applyCompareAtToAll")}
              </button>
            )}

            <div className="sm:col-span-2">
              <CheckField
                label={t("variantActive")}
                checked={v.isActive}
                onChange={(next) => update(v.key, { isActive: next })}
              />
            </div>
          </div>
        );
      })}

      {/* Пунктирная полоса-«добавить» читается как продолжение списка вариантов. */}
      <button
        type="button"
        onClick={add}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-input py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:bg-primary-soft/50 hover:text-primary"
      >
        <Plus className="size-4" aria-hidden />
        {t("addVariant")}
      </button>
    </div>
  );
}

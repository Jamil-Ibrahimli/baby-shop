"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/admin/guard";
import { sanitizeSlug } from "@/lib/admin/slug";
import { colorKey } from "@/lib/color";
import { findDuplicateComboIndexes } from "@/lib/variant-dupes";
import { SIZE_CODES, SIZE_TABLE, type SizeCode } from "@/lib/constants";

export type ProductActionState = { error?: string; ok?: boolean; id?: string };

// Входные структуры (клиент шлёт варианты/фото JSON-строкой в скрытых полях формы).
type VariantInput = {
  id?: string;
  sku: string;
  sizeCode: string;
  colorRu: string;
  colorAz: string;
  colorHex?: string;
  price: string | number; // в мажорных единицах (манаты) — конвертируем в минорные
  stock: string | number;
  stockLoaded?: string | number; // остаток на момент открытия формы (см. saveProduct)
  isActive?: boolean;
};
type ImageInput = {
  id?: string;
  url: string;
  altRu?: string;
  altAz?: string;
  sortOrder?: number;
  colorKey?: string | null; // null/пусто → общее фото; иначе привязка к цвету
};

function str(v: FormDataEntryValue | null): string {
  return String(v ?? "").trim();
}
function bool(v: FormDataEntryValue | null): boolean {
  return v === "on" || v === "true";
}
function intOrNull(v: FormDataEntryValue | null): number | null {
  const n = Number.parseInt(str(v), 10);
  return Number.isFinite(n) ? n : null;
}

// Мажорные единицы («12.50») → целые минорные (1250). Защита от float-ошибок.
function toMinor(price: string | number): number {
  const n =
    typeof price === "number"
      ? price
      : Number.parseFloat(String(price).replace(",", "."));
  if (!Number.isFinite(n)) return NaN;
  return Math.round(n * 100);
}

function parseJson<T>(raw: string): T[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

// Преобразуем вход варианта в данные БД (подписи размера/рост берём из справочника).
// Остаток сюда НЕ входит — он пишется отдельно, см. stockPatch().
function buildVariantData(v: VariantInput) {
  const size = SIZE_TABLE[v.sizeCode as SizeCode];
  return {
    sku: v.sku.trim(),
    sizeCode: v.sizeCode,
    sizeLabelRu: size.labelRu,
    sizeLabelAz: size.labelAz,
    heightMinCm: size.heightMinCm,
    heightMaxCm: size.heightMaxCm,
    colorRu: v.colorRu.trim(),
    colorAz: v.colorAz.trim(),
    colorHex: v.colorHex?.trim() || null,
    price: toMinor(v.price),
    isActive: v.isActive ?? true,
  };
}

function toStock(v: string | number | undefined): number {
  return Number.parseInt(String(v ?? ""), 10) || 0;
}

// Остаток обновляем ТОЛЬКО если админ правил поле руками. Форма присылает
// stockLoaded — число, которое она получила из БД при открытии страницы. Если
// оно совпадает с отправленным, поле не трогали: между открытием формы и
// сохранением могли пройти заказы, и запись «старого» числа вернула бы уже
// списанный товар на склад. У новых вариантов stockLoaded нет — пишем как есть.
function stockPatch(v: VariantInput): { stock?: number } {
  const untouched =
    v.stockLoaded !== undefined && toStock(v.stockLoaded) === toStock(v.stock);
  return untouched ? {} : { stock: toStock(v.stock) };
}

function isUniqueError(e: unknown): boolean {
  return (
    !!e && typeof e === "object" && (e as { code?: string }).code === "P2002"
  );
}

export async function saveProduct(
  _prev: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  if (!(await getAdminUser())) return { error: "forbidden" };

  const id = str(formData.get("id"));
  const nameRu = str(formData.get("nameRu"));
  const nameAz = str(formData.get("nameAz"));
  const slug = sanitizeSlug(str(formData.get("slug")) || nameRu);

  if (!nameRu || !nameAz) return { error: "name_required" };
  if (!slug) return { error: "slug_required" };

  // Уникальность slug (кроме самого товара).
  const slugClash = await prisma.product.findUnique({ where: { slug } });
  if (slugClash && slugClash.id !== id) return { error: "slug_taken" };

  const variants = parseJson<VariantInput>(str(formData.get("variants")));
  const images = parseJson<ImageInput>(str(formData.get("images")));

  // Валидация вариантов.
  const seenSku = new Set<string>();
  for (const v of variants) {
    if (!(SIZE_CODES as readonly string[]).includes(v.sizeCode)) {
      return { error: "variant_size" };
    }
    if (!v.sku?.trim()) return { error: "variant_sku" };
    if (seenSku.has(v.sku.trim())) return { error: "variant_sku_dup" };
    seenSku.add(v.sku.trim());
    if (!v.colorRu?.trim() || !v.colorAz?.trim()) return { error: "variant_color" };
    const minor = toMinor(v.price);
    if (!Number.isFinite(minor) || minor <= 0) return { error: "variant_price" };
  }
  // Пара «размер + цвет» уникальна в БД — проверяем сами, чтобы вместо
  // ошибки Prisma отдать понятное сообщение (те же правила, что в форме).
  if (findDuplicateComboIndexes(variants).size > 0) {
    return { error: "variant_combo_dup" };
  }

  const categoryId = str(formData.get("categoryId")) || null;

  const baseData = {
    slug,
    nameRu,
    nameAz,
    descriptionRu: str(formData.get("descriptionRu")) || null,
    descriptionAz: str(formData.get("descriptionAz")) || null,
    compositionRu: str(formData.get("compositionRu")) || null,
    compositionAz: str(formData.get("compositionAz")) || null,
    careRu: str(formData.get("careRu")) || null,
    careAz: str(formData.get("careAz")) || null,
    isOrganic: bool(formData.get("isOrganic")),
    isHypoallergenic: bool(formData.get("isHypoallergenic")),
    cottonPercent: intOrNull(formData.get("cottonPercent")),
    certifications: str(formData.get("certifications")) || null,
    isBundle: bool(formData.get("isBundle")),
    isPublished: bool(formData.get("isPublished")),
    bundleItemsRu: str(formData.get("bundleItemsRu")) || null,
    bundleItemsAz: str(formData.get("bundleItemsAz")) || null,
    categoryId,
  };

  try {
    const productId = await prisma.$transaction(async (tx) => {
      // 1. Товар (создание или обновление базовых полей).
      let pid = id;
      if (id) {
        await tx.product.update({ where: { id }, data: baseData });
      } else {
        const created = await tx.product.create({
          data: baseData,
          select: { id: true },
        });
        pid = created.id;
      }

      // 2. Варианты: при обновлении — diff (удалить/обновить/создать), при создании — создать.
      if (id) {
        const existing = await tx.productVariant.findMany({
          where: { productId: id },
          select: { id: true },
        });
        const keepIds = new Set(
          variants.map((v) => v.id).filter((x): x is string => !!x),
        );
        const toDelete = existing.filter((e) => !keepIds.has(e.id));
        if (toDelete.length) {
          await tx.productVariant.deleteMany({
            where: { id: { in: toDelete.map((e) => e.id) } },
          });
        }
      }
      for (const v of variants) {
        const data = buildVariantData(v);
        if (v.id) {
          await tx.productVariant.update({
            where: { id: v.id },
            data: { ...data, ...stockPatch(v) },
          });
        } else {
          await tx.productVariant.create({
            data: { ...data, stock: toStock(v.stock), productId: pid! },
          });
        }
      }

      // 3. Ключ цвета → представитель-вариант (для привязки фото к цвету).
      const finalVariants = await tx.productVariant.findMany({
        where: { productId: pid! },
        select: { id: true, colorRu: true },
      });
      const colorToVariant = new Map<string, string>();
      for (const v of finalVariants) {
        const key = colorKey(v.colorRu);
        if (!colorToVariant.has(key)) colorToVariant.set(key, v.id);
      }

      // 4. Фото — полная замена. Фото цвета привязываем к представителю-варианту;
      //    если цвета уже нет среди вариантов — фото становится общим (variantId=null).
      await tx.productImage.deleteMany({ where: { productId: pid! } });
      const imageCreate = images.map((im, i) => ({
        productId: pid!,
        url: im.url,
        altRu: im.altRu?.trim() || null,
        altAz: im.altAz?.trim() || null,
        sortOrder: im.sortOrder ?? i,
        variantId: im.colorKey ? colorToVariant.get(im.colorKey) ?? null : null,
      }));
      if (imageCreate.length) {
        await tx.productImage.createMany({ data: imageCreate });
      }

      return pid!;
    });

    revalidateProduct(slug);
    return { ok: true, id: productId };
  } catch (e) {
    if (isUniqueError(e)) return { error: "sku_or_variant_taken" };
    throw e;
  }
}

export async function deleteProduct(id: string): Promise<ProductActionState> {
  if (!(await getAdminUser())) return { error: "forbidden" };
  // Варианты/фото удаляются каскадом; в заказах ссылки становятся null (снапшот цел).
  await prisma.product.delete({ where: { id } }).catch(() => {});
  revalidatePath("/[locale]/admin/products", "page");
  revalidatePath("/[locale]/catalog", "page");
  return { ok: true };
}

function revalidateProduct(slug: string) {
  revalidatePath("/[locale]/admin/products", "page");
  revalidatePath("/[locale]/catalog", "page");
  revalidatePath(`/[locale]/product/${slug}`, "page");
}

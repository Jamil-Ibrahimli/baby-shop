"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveProduct, deleteProduct } from "@/lib/admin/product-actions";
import { VariantEditor } from "./variant-editor";
import { ImageUploader } from "./image-uploader";
import { ColorImagesEditor } from "./color-images-editor";
import type { VariantItem, ImageItem } from "./product-form-types";

export type ProductFormInitial = {
  id?: string;
  slug: string;
  nameRu: string;
  nameAz: string;
  descriptionRu: string;
  descriptionAz: string;
  compositionRu: string;
  compositionAz: string;
  careRu: string;
  careAz: string;
  isOrganic: boolean;
  isHypoallergenic: boolean;
  cottonPercent: string;
  certifications: string;
  isBundle: boolean;
  isPublished: boolean;
  bundleItemsRu: string;
  bundleItemsAz: string;
  categoryId: string;
  variants: VariantItem[];
  images: ImageItem[]; // общие фото (галерея, fallback)
  colorImages: Record<string, ImageItem[]>; // фото по ключу цвета
};

type CategoryOption = { id: string; nameRu: string; nameAz: string; depth: number };

export function ProductForm({
  locale,
  categories,
  initial,
}: {
  locale: "ru" | "az";
  categories: CategoryOption[];
  initial: ProductFormInitial;
}) {
  const t = useTranslations("Admin.Products");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [f, setF] = useState<ProductFormInitial>(initial);
  const set = <K extends keyof ProductFormInitial>(
    key: K,
    value: ProductFormInitial[K],
  ) => setF((prev) => ({ ...prev, [key]: value }));

  const isEditing = !!initial.id;

  function submit() {
    setError(null);
    const fd = new FormData();
    fd.set("id", f.id ?? "");
    fd.set("slug", f.slug);
    fd.set("nameRu", f.nameRu);
    fd.set("nameAz", f.nameAz);
    fd.set("descriptionRu", f.descriptionRu);
    fd.set("descriptionAz", f.descriptionAz);
    fd.set("compositionRu", f.compositionRu);
    fd.set("compositionAz", f.compositionAz);
    fd.set("careRu", f.careRu);
    fd.set("careAz", f.careAz);
    fd.set("isOrganic", String(f.isOrganic));
    fd.set("isHypoallergenic", String(f.isHypoallergenic));
    fd.set("cottonPercent", f.cottonPercent);
    fd.set("certifications", f.certifications);
    fd.set("isBundle", String(f.isBundle));
    fd.set("isPublished", String(f.isPublished));
    fd.set("bundleItemsRu", f.bundleItemsRu);
    fd.set("bundleItemsAz", f.bundleItemsAz);
    fd.set("categoryId", f.categoryId);
    fd.set(
      "variants",
      JSON.stringify(
        f.variants.map((v) => ({
          id: v.id,
          sku: v.sku,
          sizeCode: v.sizeCode,
          colorRu: v.colorRu,
          colorAz: v.colorAz,
          colorHex: v.colorHex,
          price: v.price,
          stock: v.stock,
          isActive: v.isActive,
        })),
      ),
    );
    // Общие фото (colorKey=null) + фото по цветам (colorKey=<ключ>) в один список.
    const general = f.images.map((im, i) => ({
      id: im.id,
      url: im.url,
      altRu: im.altRu,
      altAz: im.altAz,
      sortOrder: i,
      colorKey: null as string | null,
    }));
    let order = general.length;
    const colored = Object.entries(f.colorImages).flatMap(([key, imgs]) =>
      imgs.map((im) => ({
        id: im.id,
        url: im.url,
        altRu: im.altRu,
        altAz: im.altAz,
        sortOrder: order++,
        colorKey: key,
      })),
    );
    fd.set("images", JSON.stringify([...general, ...colored]));

    startTransition(async () => {
      const res = await saveProduct({}, fd);
      if (res.error) {
        setError(t(`Errors.${res.error}`));
        return;
      }
      router.push("/admin/products");
      router.refresh();
    });
  }

  function remove() {
    if (!f.id) return;
    if (!window.confirm(t("confirmDelete"))) return;
    startTransition(async () => {
      await deleteProduct(f.id!);
      router.push("/admin/products");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Основное */}
      <Section title={t("sectionBasic")}>
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField label={t("nameRu")} value={f.nameRu} onChange={(v) => set("nameRu", v)} />
          <TextField label={t("nameAz")} value={f.nameAz} onChange={(v) => set("nameAz", v)} />
        </div>
        <TextField
          label={t("slug")}
          value={f.slug}
          onChange={(v) => set("slug", v)}
          placeholder="organic-bodysuit"
        />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="p-cat">{t("category")}</Label>
          <select
            id="p-cat"
            value={f.categoryId}
            onChange={(e) => set("categoryId", e.target.value)}
            className="h-9 rounded-xl border border-border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">{t("noCategory")}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {"— ".repeat(c.depth)}
                {locale === "az" ? c.nameAz : c.nameRu}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <AreaField label={t("descriptionRu")} value={f.descriptionRu} onChange={(v) => set("descriptionRu", v)} />
          <AreaField label={t("descriptionAz")} value={f.descriptionAz} onChange={(v) => set("descriptionAz", v)} />
        </div>
        <div className="flex flex-wrap gap-4">
          <Check label={t("isPublished")} checked={f.isPublished} onChange={(v) => set("isPublished", v)} />
          <Check label={t("isBundle")} checked={f.isBundle} onChange={(v) => set("isBundle", v)} />
        </div>
        {f.isBundle && (
          <div className="grid gap-3 sm:grid-cols-2">
            <AreaField label={t("bundleItemsRu")} value={f.bundleItemsRu} onChange={(v) => set("bundleItemsRu", v)} />
            <AreaField label={t("bundleItemsAz")} value={f.bundleItemsAz} onChange={(v) => set("bundleItemsAz", v)} />
          </div>
        )}
      </Section>

      {/* Состав, уход, безопасность */}
      <Section title={t("sectionCare")}>
        <div className="grid gap-3 sm:grid-cols-2">
          <AreaField label={t("compositionRu")} value={f.compositionRu} onChange={(v) => set("compositionRu", v)} />
          <AreaField label={t("compositionAz")} value={f.compositionAz} onChange={(v) => set("compositionAz", v)} />
          <AreaField label={t("careRu")} value={f.careRu} onChange={(v) => set("careRu", v)} />
          <AreaField label={t("careAz")} value={f.careAz} onChange={(v) => set("careAz", v)} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField
            label={t("cottonPercent")}
            type="number"
            value={f.cottonPercent}
            onChange={(v) => set("cottonPercent", v)}
            placeholder="100"
          />
          <TextField
            label={t("certifications")}
            value={f.certifications}
            onChange={(v) => set("certifications", v)}
            placeholder="OEKO-TEX"
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <Check label={t("isOrganic")} checked={f.isOrganic} onChange={(v) => set("isOrganic", v)} />
          <Check label={t("isHypoallergenic")} checked={f.isHypoallergenic} onChange={(v) => set("isHypoallergenic", v)} />
        </div>
      </Section>

      {/* Варианты (размер+цвет+цена+остаток) */}
      <Section title={t("sectionVariants")}>
        <VariantEditor
          locale={locale}
          variants={f.variants}
          onChange={(v) => set("variants", v)}
        />
      </Section>

      {/* Общие фото (галерея + запасной вариант) */}
      <Section title={t("sectionImages")}>
        <ImageUploader images={f.images} onChange={(v) => set("images", v)} />
      </Section>

      {/* Фото по цветам */}
      <Section title={t("sectionColorImages")}>
        <ColorImagesEditor
          variants={f.variants}
          value={f.colorImages}
          onChange={(v) => set("colorImages", v)}
        />
      </Section>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={submit} disabled={isPending} className="rounded-full">
          {isEditing ? t("save") : t("create")}
        </Button>
        {isEditing && (
          <Button
            variant="outline"
            onClick={remove}
            disabled={isPending}
            className="rounded-full text-destructive"
          >
            <Trash2 className="size-4" aria-hidden />
            {t("delete")}
          </Button>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border p-5">
      <h2 className="text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <Input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function AreaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <textarea
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
    </div>
  );
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 accent-primary"
      />
      {label}
    </label>
  );
}

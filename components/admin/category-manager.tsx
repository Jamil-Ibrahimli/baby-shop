"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Pencil, Trash2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  saveCategory,
  deleteCategory,
} from "@/lib/admin/category-actions";
import type { CategoryNode } from "@/lib/admin/categories";

type Draft = {
  id: string;
  nameRu: string;
  nameAz: string;
  slug: string;
  parentId: string;
  sortOrder: string;
};

const EMPTY: Draft = {
  id: "",
  nameRu: "",
  nameAz: "",
  slug: "",
  parentId: "",
  sortOrder: "0",
};

export function CategoryManager({ categories }: { categories: CategoryNode[] }) {
  const t = useTranslations("Admin.Categories");
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isEditing = draft.id !== "";

  function startEdit(c: CategoryNode) {
    setError(null);
    setDraft({
      id: c.id,
      nameRu: c.nameRu,
      nameAz: c.nameAz,
      slug: c.slug,
      parentId: c.parentId ?? "",
      sortOrder: String(c.sortOrder),
    });
  }

  function reset() {
    setDraft(EMPTY);
    setError(null);
  }

  function submit() {
    setError(null);
    const fd = new FormData();
    fd.set("id", draft.id);
    fd.set("nameRu", draft.nameRu);
    fd.set("nameAz", draft.nameAz);
    fd.set("slug", draft.slug);
    fd.set("parentId", draft.parentId);
    fd.set("sortOrder", draft.sortOrder);
    startTransition(async () => {
      const res = await saveCategory({}, fd);
      if (res.error) {
        setError(t(`Errors.${res.error}`));
        return;
      }
      reset();
      router.refresh();
    });
  }

  function remove(id: string) {
    if (!window.confirm(t("confirmDelete"))) return;
    startTransition(async () => {
      await deleteCategory(id);
      if (draft.id === id) reset();
      router.refresh();
    });
  }

  // Родитель не может быть самой категорией (потомков дополнительно отсекает сервер).
  const parentOptions = categories.filter((c) => c.id !== draft.id);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      {/* Список категорий */}
      <div className="rounded-2xl border border-border">
        {categories.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">
            {t("empty")}
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {categories.map((c) => (
              <li
                key={c.id}
                className="flex items-center gap-2 px-4 py-3 text-sm"
              >
                <span
                  className="min-w-0 flex-1 truncate"
                  style={{ paddingLeft: `${c.depth * 16}px` }}
                >
                  {c.depth > 0 && (
                    <span className="text-muted-foreground">— </span>
                  )}
                  {c.nameRu}
                  <span className="text-muted-foreground"> / {c.nameAz}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    /{c.slug} · {c.productCount} {t("productsShort")}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => startEdit(c)}
                  aria-label={t("edit")}
                  className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Pencil className="size-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => remove(c.id)}
                  aria-label={t("delete")}
                  className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Форма создания/редактирования */}
      <div className="h-fit rounded-2xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">
            {isEditing ? t("editTitle") : t("newTitle")}
          </h2>
          {isEditing && (
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" aria-hidden />
              {t("cancel")}
            </button>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <Field
            id="cat-nameRu"
            label={t("nameRu")}
            value={draft.nameRu}
            onChange={(v) => setDraft((d) => ({ ...d, nameRu: v }))}
          />
          <Field
            id="cat-nameAz"
            label={t("nameAz")}
            value={draft.nameAz}
            onChange={(v) => setDraft((d) => ({ ...d, nameAz: v }))}
          />
          <Field
            id="cat-slug"
            label={t("slug")}
            value={draft.slug}
            onChange={(v) => setDraft((d) => ({ ...d, slug: v }))}
            placeholder="girls-bodysuits"
          />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cat-parent">{t("parent")}</Label>
            <select
              id="cat-parent"
              value={draft.parentId}
              onChange={(e) =>
                setDraft((d) => ({ ...d, parentId: e.target.value }))
              }
              className="h-9 rounded-xl border border-border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">{t("noParent")}</option>
              {parentOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {"— ".repeat(c.depth)}
                  {c.nameRu}
                </option>
              ))}
            </select>
          </div>
          <Field
            id="cat-sort"
            label={t("sortOrder")}
            type="number"
            value={draft.sortOrder}
            onChange={(v) => setDraft((d) => ({ ...d, sortOrder: v }))}
          />

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            onClick={submit}
            disabled={isPending}
            className="mt-1 rounded-full"
          >
            {isEditing ? (
              t("save")
            ) : (
              <>
                <Plus className="size-4" aria-hidden />
                {t("create")}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

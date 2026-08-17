"use client";

import { useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { ArrowDown, ArrowUp, ImageOff, Plus, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { compressImage } from "@/lib/image-compress";
import {
  saveBanner,
  deleteBanner,
  moveBanner,
} from "@/lib/admin/banner-actions";
import { useRouter } from "@/i18n/navigation";
import { CheckField, TextField } from "./form-fields";
import type { AdminBanner } from "@/lib/admin/banners";

// Черновик баннера в форме. Пустой id — ещё не сохранённый (новый) баннер.
type Draft = {
  id: string;
  imageUrl: string;
  titleRu: string;
  titleAz: string;
  subtitleRu: string;
  subtitleAz: string;
  ctaRu: string;
  ctaAz: string;
  linkUrl: string;
  isActive: boolean;
};

function toDraft(b: AdminBanner): Draft {
  return {
    id: b.id,
    imageUrl: b.imageUrl,
    titleRu: b.titleRu ?? "",
    titleAz: b.titleAz ?? "",
    subtitleRu: b.subtitleRu ?? "",
    subtitleAz: b.subtitleAz ?? "",
    ctaRu: b.ctaRu ?? "",
    ctaAz: b.ctaAz ?? "",
    linkUrl: b.linkUrl ?? "",
    isActive: b.isActive,
  };
}

const EMPTY: Draft = {
  id: "",
  imageUrl: "",
  titleRu: "",
  titleAz: "",
  subtitleRu: "",
  subtitleAz: "",
  ctaRu: "",
  ctaAz: "",
  linkUrl: "",
  isActive: true,
};

export function BannerManager({ banners }: { banners: AdminBanner[] }) {
  const t = useTranslations("Admin.Banners");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      {banners.length === 0 && !creating && (
        <p className="rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
          {t("empty")}
        </p>
      )}

      {banners.map((b, i) => (
        <BannerCard
          key={b.id}
          draft={toDraft(b)}
          position={i + 1}
          total={banners.length}
          busy={isPending}
          onMove={(dir) =>
            startTransition(async () => {
              await moveBanner(b.id, dir);
              router.refresh();
            })
          }
          onDelete={() =>
            startTransition(async () => {
              await deleteBanner(b.id);
              router.refresh();
            })
          }
        />
      ))}

      {creating && (
        <BannerCard
          draft={EMPTY}
          position={banners.length + 1}
          total={banners.length + 1}
          busy={isPending}
          onCancel={() => setCreating(false)}
        />
      )}

      {!creating && (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-input py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:bg-primary-soft/50 hover:text-primary"
        >
          <Plus className="size-4" aria-hidden />
          {t("add")}
        </button>
      )}
    </div>
  );
}

function BannerCard({
  draft,
  position,
  total,
  busy,
  onMove,
  onDelete,
  onCancel,
}: {
  draft: Draft;
  position: number;
  total: number;
  busy: boolean;
  onMove?: (dir: "up" | "down") => void;
  onDelete?: () => void;
  onCancel?: () => void;
}) {
  const t = useTranslations("Admin.Banners");
  const router = useRouter();
  const [f, setF] = useState<Draft>(draft);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSave] = useTransition();

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setF((prev) => ({ ...prev, [key]: value }));

  function save() {
    setError(null);
    const fd = new FormData();
    fd.set("id", f.id);
    fd.set("imageUrl", f.imageUrl);
    fd.set("titleRu", f.titleRu);
    fd.set("titleAz", f.titleAz);
    fd.set("subtitleRu", f.subtitleRu);
    fd.set("subtitleAz", f.subtitleAz);
    fd.set("ctaRu", f.ctaRu);
    fd.set("ctaAz", f.ctaAz);
    fd.set("linkUrl", f.linkUrl);
    fd.set("isActive", String(f.isActive));

    startSave(async () => {
      const res = await saveBanner({}, fd);
      if (res.error) {
        setError(t(`Errors.${res.error}`));
        return;
      }
      onCancel?.(); // закрываем форму нового баннера
      router.refresh();
    });
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-heading text-sm font-bold">
          {t("bannerNumber", { number: position })}
          {!f.isActive && (
            <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
              {t("hidden")}
            </span>
          )}
        </span>
        <div className="flex items-center gap-1">
          {onMove && (
            <>
              <button
                type="button"
                onClick={() => onMove("up")}
                disabled={busy || position === 1}
                aria-label={t("moveUp")}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-40"
              >
                <ArrowUp className="size-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => onMove("down")}
                disabled={busy || position === total}
                aria-label={t("moveDown")}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-40"
              >
                <ArrowDown className="size-4" aria-hidden />
              </button>
            </>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm(t("confirmDelete"))) onDelete();
              }}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-lg p-1.5 text-sm text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-4" aria-hidden />
              <span className="sr-only sm:not-sr-only">{t("delete")}</span>
            </button>
          )}
        </div>
      </header>

      <BannerImagePicker
        url={f.imageUrl}
        onChange={(url) => set("imageUrl", url)}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label={t("titleRu")}
          value={f.titleRu}
          onChange={(v) => set("titleRu", v)}
        />
        <TextField
          label={t("titleAz")}
          value={f.titleAz}
          onChange={(v) => set("titleAz", v)}
        />
        <TextField
          label={t("subtitleRu")}
          value={f.subtitleRu}
          onChange={(v) => set("subtitleRu", v)}
        />
        <TextField
          label={t("subtitleAz")}
          value={f.subtitleAz}
          onChange={(v) => set("subtitleAz", v)}
        />
        <TextField
          label={t("ctaRu")}
          value={f.ctaRu}
          onChange={(v) => set("ctaRu", v)}
        />
        <TextField
          label={t("ctaAz")}
          value={f.ctaAz}
          onChange={(v) => set("ctaAz", v)}
        />
      </div>

      <TextField
        label={t("linkUrl")}
        value={f.linkUrl}
        onChange={(v) => set("linkUrl", v)}
        placeholder="/catalog?sale=1"
        hint={t("linkHint")}
        mono
      />

      <CheckField
        label={t("isActive")}
        checked={f.isActive}
        onChange={(v) => set("isActive", v)}
      />

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={save}
          disabled={saving || busy}
          className="rounded-full"
        >
          {f.id ? t("save") : t("create")}
        </Button>
        {onCancel && (
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={saving}
            className="rounded-full"
          >
            {t("cancel")}
          </Button>
        )}
      </div>
    </section>
  );
}

// Одна картинка баннера: загрузка через тот же роут, что и фото товаров
// (там же проверка прав, типа и размера). Перед отправкой сжимаем в браузере.
function BannerImagePicker({
  url,
  onChange,
}: {
  url: string;
  onChange: (url: string) => void;
}) {
  const t = useTranslations("Admin.Banners");
  const tp = useTranslations("Admin.Products");
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File | undefined) {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const fd = new FormData();
      fd.set("file", await compressImage(file));
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          detail?: string;
        };
        setError(
          [tp(`UploadErrors.${data.error ?? "failed"}`), data.detail]
            .filter(Boolean)
            .join(" — "),
        );
        return;
      }
      const data = (await res.json()) as { url: string };
      onChange(data.url);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          className="aspect-[16/7] w-full rounded-xl border border-border object-cover"
        />
      ) : (
        <div className="flex aspect-[16/7] w-full items-center justify-center rounded-xl border border-dashed border-input bg-surface text-muted-foreground">
          <ImageOff className="size-6" aria-hidden />
        </div>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-input py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:bg-primary-soft/50 hover:text-primary disabled:opacity-60"
      >
        <Upload className="size-4" aria-hidden />
        {busy ? tp("uploading") : url ? t("replaceImage") : t("uploadImage")}
      </button>
      <p className="text-xs text-muted-foreground">{t("imageHint")}</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => upload(e.target.files?.[0])}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

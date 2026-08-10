"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Upload, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { type ImageItem, newKey } from "./product-form-types";

// Загрузчик фото товара: файлы уходят на /api/admin/upload, обратно — URL.
// Управляет массивом изображений (порядок + alt ru/az). Контролируемый компонент.
export function ImageUploader({
  images,
  onChange,
}: {
  images: ImageItem[];
  onChange: (next: ImageItem[]) => void;
}) {
  const t = useTranslations("Admin.Products");
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setBusy(true);
    try {
      const uploaded: ImageItem[] = [];
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.set("file", file);
        const res = await fetch("/api/admin/upload", {
          method: "POST",
          body: fd,
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as {
            error?: string;
            detail?: string;
          };
          // detail приходит только при сбое хранилища — показываем как подсказку,
          // иначе владелец магазина не знает, что именно проверять в настройках.
          setError(
            [t(`UploadErrors.${data.error ?? "failed"}`), data.detail]
              .filter(Boolean)
              .join(" — "),
          );
          continue;
        }
        const data = (await res.json()) as { url: string };
        uploaded.push({
          key: newKey(),
          url: data.url,
          altRu: "",
          altAz: "",
        });
      }
      if (uploaded.length) onChange([...images, ...uploaded]);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function update(key: string, patch: Partial<ImageItem>) {
    onChange(images.map((im) => (im.key === key ? { ...im, ...patch } : im)));
  }
  function remove(key: string) {
    onChange(images.filter((im) => im.key !== key));
  }
  function move(index: number, dir: -1 | 1) {
    const next = [...images];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm transition-colors hover:bg-muted disabled:opacity-60"
        >
          <Upload className="size-4" aria-hidden />
          {busy ? t("uploading") : t("uploadImage")}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
        <p className="mt-1 text-xs text-muted-foreground">{t("uploadHint")}</p>
        {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
      </div>

      {images.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noImages")}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {images.map((im, i) => (
            <li
              key={im.key}
              className="flex gap-3 rounded-xl border border-border p-3"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={im.url}
                alt=""
                className="size-16 shrink-0 rounded-lg object-cover"
              />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Input
                  value={im.altRu}
                  placeholder={t("altRu")}
                  onChange={(e) => update(im.key, { altRu: e.target.value })}
                />
                <Input
                  value={im.altAz}
                  placeholder={t("altAz")}
                  onChange={(e) => update(im.key, { altAz: e.target.value })}
                />
              </div>
              <div className="flex shrink-0 flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label={t("moveUp")}
                  className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-40"
                >
                  <ArrowUp className="size-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === images.length - 1}
                  aria-label={t("moveDown")}
                  className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-40"
                >
                  <ArrowDown className="size-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => remove(im.key)}
                  aria-label={t("removeImage")}
                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

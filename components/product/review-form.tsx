"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { submitReview, updateReview } from "@/lib/review-actions";

/**
 * Форма отзыва: оценка звёздами (1–5) + текст.
 * Два режима: добавление нового отзыва (передан productId) и правка своего
 * (передан reviewId). После добавления поля очищаются — можно писать следующий
 * отзыв, ограничения «один на товар» больше нет.
 */
export function ReviewForm({
  productId,
  reviewId,
  initialRating = 0,
  initialBody = "",
  onDone,
}: {
  productId?: string;
  reviewId?: string;
  initialRating?: number;
  initialBody?: string;
  /** Вызывается после успешной правки — закрыть форму в карточке отзыва. */
  onDone?: () => void;
}) {
  const t = useTranslations("Product.Reviews");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [rating, setRating] = useState(initialRating);
  const [hover, setHover] = useState(0);
  const [body, setBody] = useState(initialBody);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const display = hover || rating;
  const isEditing = !!reviewId;

  function submit() {
    setError(null);
    setSaved(false);
    if (rating < 1) {
      setError("rating_required");
      return;
    }
    if (body.trim().length < 3) {
      setError("body_required");
      return;
    }

    startTransition(async () => {
      const res = isEditing
        ? await updateReview(reviewId!, rating, body.trim())
        : await submitReview(productId!, rating, body.trim());

      if (res.error) {
        setError(res.error);
        return;
      }

      if (isEditing) {
        onDone?.();
      } else {
        // Освобождаем форму под следующий отзыв: сам отзыв уже уехал в список.
        setRating(0);
        setBody("");
        setSaved(true);
      }
      router.refresh();
    });
  }

  return (
    <div
      className={cn(
        isEditing ? "mt-3" : "rounded-2xl border border-border bg-card p-4",
      )}
    >
      {!isEditing && (
        <p className="mb-2 text-sm font-medium">{t("formTitle")}</p>
      )}

      <div
        className="flex gap-0.5"
        role="radiogroup"
        aria-label={t("ratingLabel")}
        onMouseLeave={() => setHover(0)}
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={rating === i}
            aria-label={String(i)}
            onClick={() => setRating(i)}
            onMouseEnter={() => setHover(i)}
            className="p-0.5"
          >
            <Star
              className={cn(
                "size-6 transition-colors",
                i <= display
                  ? "fill-primary text-primary"
                  : "fill-transparent text-muted-foreground/40",
              )}
            />
          </button>
        ))}
      </div>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder={t("placeholder")}
        className="mt-3 w-full rounded-xl border border-border bg-background p-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />

      {error && (
        <p className="mt-1 text-sm text-destructive">{t(`Errors.${error}`)}</p>
      )}
      {saved && <p className="mt-1 text-sm text-primary">{t("published")}</p>}

      <div className="mt-3 flex gap-2">
        <Button onClick={submit} disabled={isPending} className="rounded-full">
          {isEditing ? t("update") : t("submit")}
        </Button>
        {isEditing && (
          <Button
            onClick={onDone}
            disabled={isPending}
            variant="outline"
            className="rounded-full"
          >
            {t("cancel")}
          </Button>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { submitReview, deleteReview } from "@/lib/review-actions";

type Initial = { rating: number; body: string } | null;

// Форма отзыва: оценка звёздами (1–5) + текст. Создание/редактирование/удаление.
export function ReviewForm({
  productId,
  initial,
}: {
  productId: string;
  initial: Initial;
}) {
  const t = useTranslations("Product.Reviews");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [body, setBody] = useState(initial?.body ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const display = hover || rating;
  const isEditing = initial !== null;

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
      const res = await submitReview(productId, rating, body.trim());
      if (res.error) {
        setError(res.error);
      } else {
        setSaved(true);
        router.refresh();
      }
    });
  }

  function remove() {
    startTransition(async () => {
      await deleteReview(productId);
      setRating(0);
      setBody("");
      setSaved(false);
      setError(null);
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="mb-2 text-sm font-medium">
        {isEditing ? t("editTitle") : t("formTitle")}
      </p>

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
      {saved && <p className="mt-1 text-sm text-primary">{t("saved")}</p>}

      <div className="mt-3 flex gap-2">
        <Button
          onClick={submit}
          disabled={isPending}
          className="rounded-full"
        >
          {isEditing ? t("update") : t("submit")}
        </Button>
        {isEditing && (
          <Button
            onClick={remove}
            disabled={isPending}
            variant="outline"
            className="rounded-full"
          >
            {t("delete")}
          </Button>
        )}
      </div>
    </div>
  );
}

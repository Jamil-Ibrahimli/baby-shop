"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { MessageSquareReply, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/navigation";
import { StarRating } from "@/components/product/star-rating";
import { replyToReview, deleteReviewAsAdmin } from "@/lib/admin/review-actions";
import { CONTROL_CLASS } from "./form-fields";
import { cn } from "@/lib/utils";

export type ReviewRow = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  dateLabel: string;
  replyBody: string | null;
  replyDateLabel: string | null;
  author: string;
  productName: string;
  productSlug: string;
};

export function ReviewManager({ reviews }: { reviews: ReviewRow[] }) {
  const t = useTranslations("Admin.Reviews");

  if (reviews.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
        {t("empty")}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {reviews.map((r) => (
        <ReviewRowCard key={r.id} review={r} />
      ))}
    </ul>
  );
}

function ReviewRowCard({ review }: { review: ReviewRow }) {
  const t = useTranslations("Admin.Reviews");
  const router = useRouter();
  const [reply, setReply] = useState(review.replyBody ?? "");
  const [open, setOpen] = useState(!review.replyBody);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await replyToReview(review.id, reply);
      if (res.error) {
        setError(t(`Errors.${res.error}`));
        return;
      }
      router.refresh();
    });
  }

  function remove() {
    if (!window.confirm(t("confirmDelete"))) return;
    startTransition(async () => {
      const res = await deleteReviewAsAdmin(review.id);
      if (res.error) {
        setError(t(`Errors.${res.error}`));
        return;
      }
      router.refresh();
    });
  }

  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <Link
            href={`/product/${review.productSlug}`}
            className="font-heading text-sm font-bold hover:text-primary"
          >
            {review.productName}
          </Link>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {review.author} · {review.dateLabel}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StarRating value={review.rating} />
          {!review.replyBody && (
            <span className="rounded-full bg-secondary-light px-2 py-0.5 text-xs font-medium text-secondary-foreground">
              {t("unanswered")}
            </span>
          )}
        </div>
      </div>

      {/* Сам отзыв — на сером фоне, как вложенные блоки в разделе «Товары». */}
      <div className="rounded-xl bg-surface p-3">
        {review.title && (
          <p className="text-sm font-medium">{review.title}</p>
        )}
        <p className="text-sm text-muted-foreground">{review.body}</p>
      </div>

      {/* Ответ магазина: показываем текст, по кнопке открываем правку. */}
      {review.replyBody && !open ? (
        <div className="rounded-xl border border-primary/30 bg-primary-soft p-3">
          <p className="text-xs font-semibold text-primary">{t("replyLabel")}</p>
          <p className="mt-1 text-sm">{review.replyBody}</p>
          {review.replyDateLabel && (
            <p className="mt-1 text-xs text-muted-foreground">
              {review.replyDateLabel}
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <label
            htmlFor={`reply-${review.id}`}
            className="text-xs font-medium text-muted-foreground"
          >
            {t("replyLabel")}
          </label>
          <textarea
            id={`reply-${review.id}`}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={3}
            placeholder={t("replyPlaceholder")}
            className={cn(CONTROL_CLASS, "h-auto resize-y py-2.5")}
          />
          <p className="text-xs text-muted-foreground">{t("replyHint")}</p>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        {review.replyBody && !open ? (
          <Button
            variant="outline"
            onClick={() => setOpen(true)}
            disabled={isPending}
            className="rounded-full"
          >
            <MessageSquareReply className="size-4" aria-hidden />
            {t("editReply")}
          </Button>
        ) : (
          <Button onClick={save} disabled={isPending} className="rounded-full">
            {review.replyBody ? t("saveReply") : t("sendReply")}
          </Button>
        )}
        <button
          type="button"
          onClick={remove}
          disabled={isPending}
          className="ml-auto inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="size-4" aria-hidden />
          {t("deleteReview")}
        </button>
      </div>
    </li>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { ImageOff, MessageSquareReply, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/navigation";
import { StarRating } from "@/components/product/star-rating";
import { replyToReview, deleteReviewAsAdmin } from "@/lib/admin/review-actions";
import { CONTROL_CLASS } from "./form-fields";
import { cn } from "@/lib/utils";

/** Что покупатель брал из этого товара — контекст для жалоб на брак. */
export type ReviewPurchase = {
  orderId: string;
  orderNumber: string;
  statusLabel: string;
  dateLabel: string;
  sizeLabel: string;
  color: string;
  quantity: number;
};

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
  productImageUrl: string | null;
  purchases: ReviewPurchase[];
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
  // Сохранённый ответ держим локально: после отправки карточка сворачивается
  // мгновенно, а router.refresh() догоняет остальное (счётчик в сайдбаре).
  const [savedReply, setSavedReply] = useState(review.replyBody);
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
      // Свернуть форму: ответ сохранён, дальше карточка показывает его текст
      // и кнопку «Изменить ответ». Без этого оставалась открытая форма с
      // «Сохранить», и было непонятно, ушёл ответ или нет.
      setSavedReply(reply.trim() || null);
      setOpen(false);
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
    <li
      id={`review-${review.id}`}
      className="flex scroll-mt-20 flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        {/* Фото товара — узнаётся быстрее названия. */}
        <div className="flex min-w-0 gap-3">
          {review.productImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={review.productImageUrl}
              alt=""
              className="size-12 shrink-0 rounded-lg object-cover"
            />
          ) : (
            <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <ImageOff className="size-4" aria-hidden />
            </span>
          )}
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
        </div>
        <div className="flex items-center gap-3">
          <StarRating value={review.rating} />
          {!savedReply && (
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

      {/* Что человек покупал: размер, цвет, номер заказа. Без этого по жалобе
          «пришло с браком» непонятно, какой вариант заменять. */}
      {review.purchases.length > 0 ? (
        <div className="rounded-xl border border-border p-3">
          <p className="text-xs font-semibold text-muted-foreground">
            {t("purchasesTitle")}
          </p>
          <ul className="mt-1 flex flex-col gap-1">
            {review.purchases.map((p) => (
              <li
                key={`${p.orderId}-${p.sizeLabel}-${p.color}`}
                className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm"
              >
                <Link
                  href={`/admin/orders/${p.orderId}`}
                  className="font-medium text-primary hover:underline"
                >
                  {p.orderNumber}
                </Link>
                <span className="text-muted-foreground">
                  {p.sizeLabel} · {p.color} × {p.quantity}
                </span>
                <span className="text-xs text-muted-foreground/70">
                  {p.statusLabel} · {p.dateLabel}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{t("noPurchase")}</p>
      )}

      {/* Ответ магазина: показываем текст, по кнопке открываем правку. */}
      {savedReply && !open ? (
        <div className="rounded-xl border border-primary/30 bg-primary-soft p-3">
          <p className="text-xs font-semibold text-primary">{t("replyLabel")}</p>
          <p className="mt-1 text-sm">{savedReply}</p>
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
        {savedReply && !open ? (
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
            {savedReply ? t("saveReply") : t("sendReply")}
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

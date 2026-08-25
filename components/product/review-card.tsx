"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Pencil, Trash2 } from "lucide-react";

import { useRouter } from "@/i18n/navigation";
import { deleteReview } from "@/lib/review-actions";
import { StarRating } from "./star-rating";
import { ReviewForm } from "./review-form";
import type { ReviewVM } from "@/lib/product-types";

/**
 * Карточка отзыва в списке. У своих отзывов — «Изменить» и «Удалить»
 * (правка открывается прямо в карточке). Клиентский компонент нужен ради
 * переключения в режим правки; дата приходит уже отформатированной с сервера,
 * чтобы часовой пояс магазина считался в одном месте.
 */
export function ReviewCard({
  review,
  mine,
  dateLabel,
  replyDateLabel,
  shopName,
}: {
  review: ReviewVM;
  mine: boolean;
  dateLabel: string;
  /** Дата ответа магазина, отформатирована на сервере (пояс магазина). */
  replyDateLabel: string | null;
  shopName: string;
}) {
  const t = useTranslations("Product.Reviews");
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  function remove() {
    if (!window.confirm(t("confirmDelete"))) return;
    startTransition(async () => {
      await deleteReview(review.id);
      router.refresh();
    });
  }

  return (
    <li className="rounded-2xl border border-border p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium">
          {review.author ?? t("anonymous")}
          {mine && (
            <span className="ml-2 rounded-full bg-primary-light px-2 py-0.5 text-xs font-normal text-primary">
              {t("yourReview")}
            </span>
          )}
        </span>
        <StarRating value={review.rating} />
      </div>

      {review.verified && (
        <span className="mt-1 inline-block text-xs text-primary">
          {t("verified")}
        </span>
      )}

      {editing ? (
        <ReviewForm
          reviewId={review.id}
          initialRating={review.rating}
          initialBody={review.body}
          onDone={() => setEditing(false)}
        />
      ) : (
        <>
          {review.title && <p className="mt-2 font-medium">{review.title}</p>}
          <p className="mt-1 text-sm text-muted-foreground">{review.body}</p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <time className="text-xs text-muted-foreground/70">{dateLabel}</time>
            {mine && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="size-3.5" aria-hidden />
                  {t("edit")}
                </button>
                <button
                  type="button"
                  onClick={remove}
                  disabled={isPending}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-3.5" aria-hidden />
                  {t("delete")}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Ответ магазина — вложенным блоком под отзывом, с отступом слева,
          чтобы читалось как реплика в переписке. */}
      {review.reply && !editing && (
        <div className="mt-3 rounded-xl border border-primary/30 bg-primary-soft p-3 sm:ml-6">
          <p className="text-xs font-semibold text-primary">
            {t("shopReply", { shop: shopName })}
          </p>
          <p className="mt-1 text-sm">{review.reply}</p>
          {replyDateLabel && (
            <time className="mt-1 block text-xs text-muted-foreground/70">
              {replyDateLabel}
            </time>
          )}
        </div>
      )}
    </li>
  );
}

import { getTranslations } from "next-intl/server";
import { Check, XCircle } from "lucide-react";
import { ORDER_STATUS_FLOW } from "@/lib/constants";
import { cn } from "@/lib/utils";

// Шаги заказа для покупателя: линия с кружками, пройденные залиты цветом бренда,
// текущий — с подсветкой, будущие — приглушённо-серые.
// Отменённый заказ выпадает из цепочки (ORDER_STATUS_FLOW), поэтому для него
// показываем отдельную плашку, а не «сломанную» линию.
export async function OrderProgress({ status }: { status: string }) {
  const [t, tStatus] = await Promise.all([
    getTranslations("Order.Progress"),
    getTranslations("OrderStatus"),
  ]);

  if (status === "cancelled") {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
        <p className="flex items-center justify-center gap-2 text-sm font-semibold text-destructive">
          <XCircle className="size-4 shrink-0" aria-hidden />
          {tStatus("cancelled")}
        </p>
        <p className="mt-1 text-center text-xs text-muted-foreground">
          {t("cancelledNote")}
        </p>
      </div>
    );
  }

  // Неизвестный статус не должен «съедать» весь прогресс → считаем его первым шагом.
  const currentIndex = Math.max(
    ORDER_STATUS_FLOW.indexOf(status as (typeof ORDER_STATUS_FLOW)[number]),
    0,
  );
  const lastIndex = ORDER_STATUS_FLOW.length - 1;

  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <h2 className="mb-4 text-sm font-semibold text-muted-foreground">
        {t("title")}
      </h2>

      <ol className="flex items-start" aria-label={t("title")}>
        {ORDER_STATUS_FLOW.map((step, i) => {
          const isDone = i < currentIndex;
          const isCurrent = i === currentIndex;
          const stateLabel = isDone
            ? t("done")
            : isCurrent
              ? t("current")
              : t("upcoming");

          return (
            <li
              key={step}
              className="flex min-w-0 flex-1 flex-col items-center"
              aria-current={isCurrent ? "step" : undefined}
            >
              {/* Кружок с соединителями по бокам: у крайних шагов они прозрачные,
                  чтобы линия не выходила за пределы полосы, но центры совпадали. */}
              <div className="flex w-full items-center" aria-hidden>
                <span
                  className={cn(
                    "h-0.5 flex-1 rounded-full",
                    i === 0
                      ? "bg-transparent"
                      : i <= currentIndex
                        ? "bg-primary"
                        : "bg-muted",
                  )}
                />
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full sm:size-8",
                    isDone && "bg-primary text-primary-foreground",
                    isCurrent &&
                      "bg-primary text-primary-foreground ring-4 ring-primary/20",
                    !isDone && !isCurrent && "bg-muted",
                  )}
                >
                  {isDone && <Check className="size-4" />}
                  {isCurrent && (
                    <span className="size-2 rounded-full bg-primary-foreground" />
                  )}
                </span>
                <span
                  className={cn(
                    "h-0.5 flex-1 rounded-full",
                    i === lastIndex
                      ? "bg-transparent"
                      : i < currentIndex
                        ? "bg-primary"
                        : "bg-muted",
                  )}
                />
              </div>

              <span
                className={cn(
                  "mt-2 px-0.5 text-center text-[10px] leading-tight sm:text-xs",
                  isCurrent
                    ? "font-semibold text-primary"
                    : isDone
                      ? "text-foreground"
                      : "text-muted-foreground",
                )}
              >
                {tStatus(step)}
                <span className="sr-only"> — {stateLabel}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

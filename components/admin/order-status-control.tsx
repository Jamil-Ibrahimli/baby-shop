"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { changeOrderStatus } from "@/lib/admin/order-status-actions";
import { getNextStatus, canCancel, isFinalStatus } from "@/lib/constants";

// Панель управления статусом заказа (только админ). Двигает по цепочке на один шаг
// вперёд и позволяет отменить, пока заказ не в финале. После смены — refresh.
export function OrderStatusControl({
  orderId,
  status,
}: {
  orderId: string;
  status: string;
}) {
  const t = useTranslations("Admin.Orders");
  const tStatus = useTranslations("OrderStatus");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const next = getNextStatus(status);
  const cancellable = canCancel(status);

  function run(target: string) {
    setError(null);
    startTransition(async () => {
      const res = await changeOrderStatus(orderId, target);
      if (res.error) {
        setError(t(`Errors.${res.error}`));
        return;
      }
      router.refresh();
    });
  }

  function onCancel() {
    if (!window.confirm(t("confirmCancel"))) return;
    run("cancelled");
  }

  if (isFinalStatus(status)) {
    return (
      <p className="text-sm text-muted-foreground">
        {status === "delivered" ? t("doneDelivered") : t("doneCancelled")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {next && (
          <Button
            onClick={() => run(next)}
            disabled={isPending}
            className="rounded-full"
          >
            {t("advanceTo", { status: tStatus(next) })}
          </Button>
        )}
        {cancellable && (
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
            className="rounded-full text-destructive"
          >
            {t("cancelOrder")}
          </Button>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/admin/guard";
import { notifyCustomerOrderStatus } from "@/lib/notifications";
import {
  ORDER_STATUSES,
  getNextStatus,
  canCancel,
  CUSTOMER_NOTIFY_STATUSES,
  type OrderStatus,
} from "@/lib/constants";

export type StatusActionState = { error?: string; ok?: boolean };

// Смена статуса заказа. ТОЛЬКО admin. Разрешено: шаг вперёд по цепочке
// (создан→принят→собран→отправлен→доставлен) ИЛИ отмена, пока заказ не в финале.
// Пишет запись в историю; на ключевые статусы уведомляет клиента в кабинете.
export async function changeOrderStatus(
  orderId: string,
  target: string,
  note?: string,
): Promise<StatusActionState> {
  const admin = await getAdminUser();
  if (!admin) return { error: "forbidden" };

  if (!(ORDER_STATUSES as readonly string[]).includes(target)) {
    return { error: "invalid_status" };
  }
  const nextStatus = target as OrderStatus;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true, userId: true, orderNumber: true },
  });
  if (!order) return { error: "not_found" };

  // Допустимые переходы: ровно следующий шаг цепочки ИЛИ отмена (пока не финал).
  const isForwardStep = getNextStatus(order.status) === nextStatus;
  const isCancel = nextStatus === "cancelled" && canCancel(order.status);
  if (!isForwardStep && !isCancel) {
    return { error: "invalid_transition" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: { status: nextStatus },
    });
    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: nextStatus,
        note: note?.trim() || null,
        changedById: admin.id,
        changedByName: admin.name,
      },
    });
  });

  // Клиенту сообщаем только о ключевых статусах и только если заказ привязан к аккаунту.
  // Уведомление изолировано: его сбой не должен откатывать уже сменённый статус.
  if (order.userId && CUSTOMER_NOTIFY_STATUSES.includes(nextStatus)) {
    await notifyCustomerOrderStatus({
      orderId: order.id,
      userId: order.userId,
      orderNumber: order.orderNumber,
      status: nextStatus,
    }).catch(() => {});
  }

  revalidatePath("/[locale]/admin/orders", "page");
  revalidatePath("/[locale]/admin/orders/[id]", "page");
  revalidatePath("/[locale]/account", "page");
  return { ok: true };
}

import "server-only";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import type { OrderStatus } from "@/lib/constants";
import { sendTelegramNewOrder } from "./telegram";

// Данные заказа, нужные для уведомлений (снапшот позиций уже в OrderItem).
export type OrderNotificationData = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  shipCity: string;
  shipLine1: string;
  shipLine2: string | null;
  shipPostalCode: string | null;
  isGift: boolean;
  giftMessage: string | null;
  comment: string | null;
  total: number;
  currency: string;
  items: {
    productNameRu: string;
    sizeLabelRu: string;
    colorRu: string;
    quantity: number;
    lineTotal: number;
  }[];
};

// In-app уведомление админу (лента + «колокольчик»).
// Заголовок — снапшот на двух языках, формулировка про СОБЫТИЕ («оформлен заказ»),
// а не про новизну: уведомление живёт в ленте и после прочтения.
async function createAdminInApp(order: OrderNotificationData): Promise<void> {
  const [tRu, tAz] = await Promise.all([
    getTranslations({ locale: "ru", namespace: "Notifications" }),
    getTranslations({ locale: "az", namespace: "Notifications" }),
  ]);

  await prisma.notification.create({
    data: {
      type: "new_order",
      recipientRole: "admin",
      orderId: order.id,
      titleRu: `${tRu("orderPlaced")} ${order.orderNumber}`,
      titleAz: `${tAz("orderPlaced")} ${order.orderNumber}`,
      isRead: false,
    },
  });
}

// Уведомления при создании заказа — ПАРАЛЛЕЛЬНО и изолированно (одно не ломает другое).
// Вынесено в отдельный сервис, чтобы позже добавить email/SMS без правок checkout.
export async function notifyNewOrder(
  order: OrderNotificationData,
): Promise<void> {
  await Promise.allSettled([
    createAdminInApp(order),
    sendTelegramNewOrder(order),
  ]);
}

// Число непрочитанных уведомлений админа (для счётчика «колокольчика»).
export async function getAdminUnreadCount(): Promise<number> {
  return prisma.notification.count({
    where: { recipientRole: "admin", isRead: false },
  });
}

// In-app уведомление КЛИЕНТУ о смене статуса заказа. Вызывается только на ключевые
// статусы (см. CUSTOMER_NOTIFY_STATUSES) и только если у заказа есть userId
// (у гостя нет кабинета). Текст сохраняем снапшотом сразу на двух языках.
export async function notifyCustomerOrderStatus(params: {
  orderId: string;
  userId: string;
  orderNumber: string;
  status: OrderStatus;
}): Promise<void> {
  const { orderId, userId, orderNumber, status } = params;

  // Локализованный снапшот заголовка на ru и az (как у админ-уведомлений).
  const [tRu, tAz, tStatusRu, tStatusAz] = await Promise.all([
    getTranslations({ locale: "ru", namespace: "Notifications" }),
    getTranslations({ locale: "az", namespace: "Notifications" }),
    getTranslations({ locale: "ru", namespace: "OrderStatus" }),
    getTranslations({ locale: "az", namespace: "OrderStatus" }),
  ]);

  await prisma.notification.create({
    data: {
      type: "order_status",
      recipientRole: "customer",
      userId,
      orderId,
      titleRu: tRu("statusChanged", { order: orderNumber, status: tStatusRu(status) }),
      titleAz: tAz("statusChanged", { order: orderNumber, status: tStatusAz(status) }),
      isRead: false,
    },
  });
}

// Число непрочитанных уведомлений конкретного клиента (счётчик «колокольчика»).
export async function getCustomerUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { recipientRole: "customer", userId, isRead: false },
  });
}

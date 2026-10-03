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

// In-app уведомление АДМИНУ: покупатель написал отзыв. Без этого о новом отзыве
// никто не сообщал — владелец узнавал о нём, только открыв раздел «Отзывы»,
// и плохой отзыв мог висеть без ответа неделями. Заказа за уведомлением нет,
// поэтому в ленте оно идёт «системным», а название товара — в заголовке.
export async function notifyNewReview(params: {
  reviewId: string;
  productNameRu: string;
  productNameAz: string;
  rating: number;
  author: string;
}): Promise<void> {
  const { reviewId, productNameRu, productNameAz, rating, author } = params;

  const [tRu, tAz] = await Promise.all([
    getTranslations({ locale: "ru", namespace: "Notifications" }),
    getTranslations({ locale: "az", namespace: "Notifications" }),
  ]);

  await prisma.notification.create({
    data: {
      type: "new_review",
      recipientRole: "admin",
      titleRu: tRu("newReview", { product: productNameRu, rating, author }),
      titleAz: tAz("newReview", { product: productNameAz, rating, author }),
      // Владельца ведём туда, где он может ОТВЕТИТЬ — к карточке этого отзыва
      // в разделе «Отзывы». Покупателя, наоборот, на страницу товара: ему нужен
      // не инструмент, а результат. Отсюда и разные ссылки у двух уведомлений.
      link: `/admin/reviews#review-${reviewId}`,
      isRead: false,
    },
  });
}

// In-app уведомление КЛИЕНТУ: магазин ответил на его отзыв. Заказа за этим
// уведомлением нет, поэтому ссылку кладём в поле link — с якорем на конкретный
// отзыв, чтобы клик открывал именно его, а не просто страницу товара.
export async function notifyCustomerReviewReply(params: {
  userId: string;
  reviewId: string;
  productSlug: string;
  productNameRu: string;
  productNameAz: string;
}): Promise<void> {
  const { userId, reviewId, productSlug, productNameRu, productNameAz } =
    params;

  const [tRu, tAz] = await Promise.all([
    getTranslations({ locale: "ru", namespace: "Notifications" }),
    getTranslations({ locale: "az", namespace: "Notifications" }),
  ]);

  await prisma.notification.create({
    data: {
      type: "review_reply",
      recipientRole: "customer",
      userId,
      titleRu: tRu("reviewReplied", { product: productNameRu }),
      titleAz: tAz("reviewReplied", { product: productNameAz }),
      link: `/product/${productSlug}#review-${reviewId}`,
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

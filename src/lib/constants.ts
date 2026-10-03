// Единый источник правды для «enum-подобных» строковых полей БД.
// SQLite не поддерживает enum в Prisma, поэтому допустимые значения фиксируем здесь
// и переиспользуем в коде вместо магических строк.

// Роли пользователя (User.role)
export const USER_ROLES = ["customer", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

// Статусы заказа (Order.status): создан → принят → собран → отправлен → доставлен (+ отменён)
export const ORDER_STATUSES = [
  "created",
  "accepted",
  "assembled",
  "shipped",
  "delivered",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

// Линейная цепочка «жизни» заказа (без отмены). Движение только вперёд по одному шагу.
export const ORDER_STATUS_FLOW = [
  "created",
  "accepted",
  "assembled",
  "shipped",
  "delivered",
] as const;

// Следующий статус по цепочке (или null, если заказ уже доставлен).
export function getNextStatus(status: string): OrderStatus | null {
  const i = ORDER_STATUS_FLOW.indexOf(status as (typeof ORDER_STATUS_FLOW)[number]);
  if (i === -1 || i >= ORDER_STATUS_FLOW.length - 1) return null;
  return ORDER_STATUS_FLOW[i + 1];
}

// Заказ в финальном состоянии (доставлен/отменён) — статусы больше не меняются.
export function isFinalStatus(status: string): boolean {
  return status === "delivered" || status === "cancelled";
}

// Отменить можно, пока заказ не доставлен и не отменён.
export function canCancel(status: string): boolean {
  return !isFinalStatus(status);
}

/**
 * Статусы, о которых уведомляем КЛИЕНТА в кабинете. Уведомляем не о каждом
 * переходе: «создан» клиент и так видит сразу после оформления, а «отменён»
 * владелец объясняет звонком, а не системной строчкой в ленте.
 *
 * «Собран» (`assembled`) добавлен по просьбе владельца: формально это складское
 * состояние, но покупателю оно показывает, что заказом занялись, — между
 * «принят» и «отправлен» иначе повисает тишина.
 */
export const CUSTOMER_NOTIFY_STATUSES: readonly OrderStatus[] = [
  "accepted",
  "assembled",
  "shipped",
  "delivered",
];

// Статус оплаты (Order.paymentStatus) — задел под Stripe
export const PAYMENT_STATUSES = ["unpaid", "paid", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

// Типы уведомлений (Notification.type)
export const NOTIFICATION_TYPES = ["new_order", "order_status"] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

// Получатель уведомления (Notification.recipientRole)
export const NOTIFICATION_RECIPIENTS = ["admin", "customer"] as const;
export type NotificationRecipient = (typeof NOTIFICATION_RECIPIENTS)[number];

// Размеры детской одежды 0–3 (ProductVariant.sizeCode) с привязкой к росту в см.
export const SIZE_CODES = [
  "0-3m",
  "3-6m",
  "6-9m",
  "9-12m",
  "12-18m",
  "18-24m",
  "2-3y",
] as const;
export type SizeCode = (typeof SIZE_CODES)[number];

// Справочник размеров: подписи (ru/az) и диапазон роста (см). Используется в сиде и UI.
export const SIZE_TABLE: Record<
  SizeCode,
  { labelRu: string; labelAz: string; heightMinCm: number; heightMaxCm: number }
> = {
  "0-3m": { labelRu: "0–3 мес", labelAz: "0–3 ay", heightMinCm: 56, heightMaxCm: 62 },
  "3-6m": { labelRu: "3–6 мес", labelAz: "3–6 ay", heightMinCm: 62, heightMaxCm: 68 },
  "6-9m": { labelRu: "6–9 мес", labelAz: "6–9 ay", heightMinCm: 68, heightMaxCm: 74 },
  "9-12m": { labelRu: "9–12 мес", labelAz: "9–12 ay", heightMinCm: 74, heightMaxCm: 80 },
  "12-18m": { labelRu: "12–18 мес", labelAz: "12–18 ay", heightMinCm: 80, heightMaxCm: 86 },
  "18-24m": { labelRu: "18–24 мес", labelAz: "18–24 ay", heightMinCm: 86, heightMaxCm: 92 },
  "2-3y": { labelRu: "2–3 года", labelAz: "2–3 yaş", heightMinCm: 92, heightMaxCm: 98 },
};

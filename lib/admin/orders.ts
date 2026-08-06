import "server-only";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/constants";

// Данные для админ-раздела заказов. Доступ к страницам гарантирует admin-layout,
// но действия смены статуса дополнительно проверяются в order-status-actions.

// Нормализуем строку фильтра из URL: валидный статус или undefined (все заказы).
export function parseStatusFilter(raw: string | undefined): OrderStatus | undefined {
  if (raw && (ORDER_STATUSES as readonly string[]).includes(raw)) {
    return raw as OrderStatus;
  }
  return undefined;
}

// Список ВСЕХ заказов магазина (клиентов и гостей) для таблицы админки.
export async function getAdminOrders(status?: OrderStatus) {
  return prisma.order.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      customerName: true,
      customerPhone: true,
      total: true,
      currency: true,
      userId: true, // null → гостевой заказ
      createdAt: true,
      _count: { select: { items: true } },
    },
  });
}

// Счётчики по статусам — для чипсов-фильтров (сколько заказов в каждом статусе).
export async function getOrderStatusCounts(): Promise<Record<string, number>> {
  const grouped = await prisma.order.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const counts: Record<string, number> = {};
  for (const g of grouped) counts[g.status] = g._count._all;
  return counts;
}

// Полная карточка заказа для страницы управления: состав, клиент, история статусов.
export async function getAdminOrderById(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      items: { orderBy: { createdAt: "asc" } },
      statusHistory: { orderBy: { createdAt: "desc" } },
      user: { select: { id: true, name: true, email: true } },
    },
  });
}

export type AdminOrderListItem = Awaited<ReturnType<typeof getAdminOrders>>[number];
export type AdminOrderDetail = NonNullable<
  Awaited<ReturnType<typeof getAdminOrderById>>
>;

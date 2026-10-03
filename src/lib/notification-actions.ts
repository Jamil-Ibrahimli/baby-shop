"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function isAdmin(): Promise<boolean> {
  const session = await auth();
  return session?.user?.role === "admin";
}

// Обновляем layout локали — там «колокольчик» в шапке + под ним ленты уведомлений.
function revalidateNotifications() {
  revalidatePath("/[locale]", "layout");
}

// Пометить уведомление прочитанным (только admin).
export async function markNotificationRead(id: string): Promise<void> {
  if (!(await isAdmin())) return;
  await prisma.notification
    .update({ where: { id }, data: { isRead: true } })
    .catch(() => {});
  revalidateNotifications();
}

// Пометить все уведомления админа прочитанными.
export async function markAllNotificationsRead(): Promise<void> {
  if (!(await isAdmin())) return;
  await prisma.notification.updateMany({
    where: { recipientRole: "admin", isRead: false },
    data: { isRead: true },
  });
  revalidateNotifications();
}

// Удалить одно уведомление админа.
export async function deleteNotification(id: string): Promise<void> {
  if (!(await isAdmin())) return;
  await prisma.notification
    .deleteMany({ where: { id, recipientRole: "admin" } })
    .catch(() => {});
  revalidateNotifications();
}

// Очистить ленту админа от прочитанных (непрочитанные остаются).
export async function deleteReadNotifications(): Promise<void> {
  if (!(await isAdmin())) return;
  await prisma.notification.deleteMany({
    where: { recipientRole: "admin", isRead: true },
  });
  revalidateNotifications();
}

// Пометить прочитанным СВОЁ уведомление (клиент). Обновляем только записи этого userId.
export async function markMyNotificationRead(id: string): Promise<void> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return;
  await prisma.notification
    .updateMany({
      where: { id, userId, recipientRole: "customer" },
      data: { isRead: true },
    })
    .catch(() => {});
  revalidateNotifications();
}

// Удалить СВОЁ уведомление (клиент) — только запись этого userId.
export async function deleteMyNotification(id: string): Promise<void> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return;
  await prisma.notification
    .deleteMany({ where: { id, userId, recipientRole: "customer" } })
    .catch(() => {});
  revalidateNotifications();
}

// Очистить СВОЮ ленту от прочитанных (клиент). Непрочитанные остаются.
export async function deleteMyReadNotifications(): Promise<void> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return;
  await prisma.notification.deleteMany({
    where: { recipientRole: "customer", userId, isRead: true },
  });
  revalidateNotifications();
}

// Пометить все свои уведомления прочитанными (клиент).
export async function markAllMyNotificationsRead(): Promise<void> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return;
  await prisma.notification.updateMany({
    where: { recipientRole: "customer", userId, isRead: false },
    data: { isRead: true },
  });
  revalidateNotifications();
}

/**
 * Сколько у меня непрочитанных. Отдельный экшен ради ОПРОСА: колокольчик
 * считается на сервере при сборке страницы, поэтому без перезагрузки цифра
 * не менялась. Опрашивать этим, а не router.refresh(): тот пересобрал бы всю
 * страницу со всеми её запросами, а здесь один COUNT.
 *
 * Ничего не ревалидируем — это чтение.
 */
export async function getMyUnreadCount(): Promise<number> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return 0;
  return prisma.notification.count({
    where: { recipientRole: "customer", userId, isRead: false },
  });
}

/** То же для ленты магазина (сайдбар админки). Только admin. */
export async function getShopUnreadCount(): Promise<number> {
  if (!(await isAdmin())) return 0;
  return prisma.notification.count({
    where: { recipientRole: "admin", isRead: false },
  });
}

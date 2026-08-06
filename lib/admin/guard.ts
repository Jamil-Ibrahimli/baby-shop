import "server-only";
import { auth } from "@/auth";

// Единая серверная проверка прав администратора для data-функций и Server Actions.
// Доступ к страницам /admin гарантирует layout (редирект customer/гостя), но
// действия и запросы всё равно проверяем здесь — защита на сервере, не только в UI.

export type AdminUser = {
  id: string;
  name: string | null;
  email: string | null;
};

// Возвращает админа или null (для actions: null → тихо выходим/возвращаем ошибку).
export async function getAdminUser(): Promise<AdminUser | null> {
  const session = await auth();
  if (session?.user?.role !== "admin") return null;
  return {
    id: session.user.id,
    name: session.user.name ?? null,
    email: session.user.email ?? null,
  };
}

// Требует админа или бросает (для data-функций под защищённым layout — «не должно случиться»).
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Forbidden: admin access required");
  return admin;
}

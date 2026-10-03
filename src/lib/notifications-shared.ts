// Общее между сервером и клиентом для ленты уведомлений (без server-only импортов,
// чтобы модуль можно было тянуть в клиентские компоненты).

/** Фильтры ленты. «orders» — есть привязанный заказ, «system» — нет. */
export const NOTIFICATION_FILTERS = [
  "all",
  "unread",
  "orders",
  "system",
] as const;

export type NotificationFilter = (typeof NOTIFICATION_FILTERS)[number];

export const DEFAULT_NOTIFICATION_FILTER: NotificationFilter = "all";

/** Разбор ?filter= из URL: неизвестное значение → фильтр по умолчанию. */
export function parseNotificationFilter(
  value: string | string[] | undefined,
): NotificationFilter {
  const v = Array.isArray(value) ? value[0] : value;
  return NOTIFICATION_FILTERS.includes(v as NotificationFilter)
    ? (v as NotificationFilter)
    : DEFAULT_NOTIFICATION_FILTER;
}

/** Подходит ли уведомление под фильтр. Общее для админской и клиентской ленты. */
export function matchesNotificationFilter(
  n: { isRead: boolean; orderId: string | null },
  filter: NotificationFilter,
): boolean {
  if (filter === "unread") return !n.isRead;
  if (filter === "orders") return n.orderId !== null;
  if (filter === "system") return n.orderId === null;
  return true;
}

export type NotificationDayGroup<T> = {
  key: string;
  label: string;
  items: T[];
};

// Локальный день (не UTC) — по нему группируем ленту.
function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/**
 * Группировка ленты по дням с сохранением исходного порядка («новые сверху»).
 * Подпись группы отдаём наружу (`labelFor`), потому что «Сегодня»/«Вчера» и формат
 * даты зависят от локали и переводов, а этот модуль должен остаться клиентским.
 */
export function groupNotificationsByDay<T extends { createdAt: Date }>(
  items: T[],
  labelFor: (date: Date, kind: "today" | "yesterday" | "other") => string,
  now: Date,
): NotificationDayGroup<T>[] {
  const todayKey = dayKey(now);
  const yesterdayKey = dayKey(new Date(now.getTime() - 86_400_000));
  const groups: NotificationDayGroup<T>[] = [];

  for (const item of items) {
    const key = dayKey(item.createdAt);
    let group = groups.at(-1);
    if (!group || group.key !== key) {
      const kind =
        key === todayKey ? "today" : key === yesterdayKey ? "yesterday" : "other";
      group = { key, label: labelFor(item.createdAt, kind), items: [] };
      groups.push(group);
    }
    group.items.push(item);
  }

  return groups;
}

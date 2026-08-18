// Клиент-безопасные типы баннеров (без prisma / server-only):
// слайдер на главной — клиентский компонент.

// Где рисуем надписи поверх картинки. Enum'ов в проекте нет — строка + список.
export const BANNER_TEXT_POSITIONS = ["left", "center", "right"] as const;
export type BannerTextPosition = (typeof BANNER_TEXT_POSITIONS)[number];
export const DEFAULT_BANNER_TEXT_POSITION: BannerTextPosition = "left";

/** Приводит значение из БД/формы к допустимому. Мусор → положение по умолчанию. */
export function toBannerTextPosition(raw: string): BannerTextPosition {
  return (BANNER_TEXT_POSITIONS as readonly string[]).includes(raw)
    ? (raw as BannerTextPosition)
    : DEFAULT_BANNER_TEXT_POSITION;
}

export type BannerVM = {
  id: string;
  imageUrl: string;
  /** Текст уже выбран под локаль; пусто — показываем только картинку. */
  title: string | null;
  subtitle: string | null;
  cta: string | null;
  /** Внутренний путь без локали (например «/catalog?sale=1»). */
  href: string | null;
  textPosition: BannerTextPosition;
};

/**
 * Ссылка баннера должна быть внутренним путём: с «/», без «//» в начале
 * (иначе это протокол-относительный внешний адрес). Пустое — просто картинка.
 */
export function sanitizeBannerLink(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

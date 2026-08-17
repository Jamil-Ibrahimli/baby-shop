// Клиент-безопасные типы баннеров (без prisma / server-only):
// слайдер на главной — клиентский компонент.

export type BannerVM = {
  id: string;
  imageUrl: string;
  /** Текст уже выбран под локаль; пусто — показываем только картинку. */
  title: string | null;
  subtitle: string | null;
  cta: string | null;
  /** Внутренний путь без локали (например «/catalog?sale=1»). */
  href: string | null;
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

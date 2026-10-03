// Санитайзер slug: латиница/цифры/дефис. Кириллицу/спецсимволы не транслитерируем —
// admin задаёт slug явно (в форме есть поле), это лишь нормализация ввода.
export function sanitizeSlug(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

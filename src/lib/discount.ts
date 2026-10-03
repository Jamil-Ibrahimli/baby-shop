// Скидка = «старая цена» (compareAtPrice) рядом с обычной ценой варианта.
// Продажа всегда идёт по price: корзина, сумма заказа и списание остатка это
// поле не читают. Здесь только правила показа — одни и те же на витрине,
// в корзине, в заказе и в проверке формы админки.

/** «12,90» из поля формы → 1290 минорных единиц. Пусто или мусор → null. */
export function parseMajorToMinor(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number.parseFloat(trimmed.replace(",", "."));
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}

/** Скидка есть, только если старая цена задана и БОЛЬШЕ текущей. */
export function hasDiscount(
  priceMinor: number,
  compareAtMinor: number | null | undefined,
): compareAtMinor is number {
  return (
    typeof compareAtMinor === "number" &&
    Number.isFinite(compareAtMinor) &&
    compareAtMinor > priceMinor
  );
}

/** Процент для бейджа «−N%». null — если скидки нет. Округляем к ближайшему. */
export function discountPercent(
  priceMinor: number,
  compareAtMinor: number | null | undefined,
): number | null {
  if (!hasDiscount(priceMinor, compareAtMinor)) return null;
  const percent = Math.round((1 - priceMinor / compareAtMinor) * 100);
  // 0% (разница меньше половины процента) бейджем не показываем — выглядит как ошибка.
  return percent > 0 ? percent : null;
}

/** Сколько сэкономлено на одной единице. 0 — если скидки нет. */
export function savingsMinor(
  priceMinor: number,
  compareAtMinor: number | null | undefined,
): number {
  return hasDiscount(priceMinor, compareAtMinor)
    ? compareAtMinor - priceMinor
    : 0;
}

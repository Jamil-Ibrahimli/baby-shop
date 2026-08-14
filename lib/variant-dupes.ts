// Поиск повторов среди вариантов товара. Общий модуль: одни и те же правила
// работают и в форме админки (подсветка строк), и на сервере при сохранении.

import { colorKey } from "./color";

export type VariantCombo = { sizeCode: string; colorRu: string };

// Ключ пары «размер + цвет». В БД на неё стоит уникальность
// (@@unique([productId, sizeCode, colorRu])). Цвет нормализуем тем же ключом,
// что и для фото: «Белый» и «белый» — один цвет, иначе у товара появились бы
// два «одинаковых» цвета с одной галереей фото.
export function variantComboKey(v: VariantCombo): string {
  return `${v.sizeCode.trim()}::${colorKey(v.colorRu)}`;
}

// Индексы вариантов, у которых пара «размер + цвет» повторяется (все участники
// повтора, включая первый). Строки без цвета пропускаем — это ещё не заполненный
// вариант, про пустой цвет есть отдельная ошибка variant_color.
export function findDuplicateComboIndexes(variants: VariantCombo[]): Set<number> {
  return collectDuplicates(variants, (v) =>
    v.colorRu.trim() ? variantComboKey(v) : null,
  );
}

// Индексы вариантов с повторяющимся артикулом. Сравниваем как на сервере —
// по обрезанной строке, с учётом регистра (SKU в БД уникален глобально).
export function findDuplicateSkuIndexes(variants: { sku: string }[]): Set<number> {
  return collectDuplicates(variants, (v) => v.sku.trim() || null);
}

function collectDuplicates<T>(
  items: T[],
  keyOf: (item: T) => string | null,
): Set<number> {
  const firstSeen = new Map<string, number>();
  const duplicates = new Set<number>();
  items.forEach((item, index) => {
    const key = keyOf(item);
    if (key === null) return;
    const first = firstSeen.get(key);
    if (first === undefined) {
      firstSeen.set(key, index);
      return;
    }
    duplicates.add(first);
    duplicates.add(index);
  });
  return duplicates;
}

// Общие типы для формы товара (клиентское состояние вариантов и фото).

export type VariantItem = {
  key: string; // стабильный ключ на клиенте (для React list)
  id?: string; // id в БД (у существующих вариантов)
  sku: string;
  sizeCode: string;
  colorRu: string;
  colorAz: string;
  colorHex: string;
  price: string; // мажорные единицы (строкой из инпута)
  stock: string;
  isActive: boolean;
};

export type ImageItem = {
  key: string;
  id?: string;
  url: string;
  altRu: string;
  altAz: string;
};

// Уникальный ключ для нового элемента списка (браузерный crypto).
export function newKey(): string {
  return crypto.randomUUID();
}

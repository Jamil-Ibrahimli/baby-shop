// Клиент-безопасные типы и константы корзины (без prisma / server-only).

// Имя куки с session-токеном гостевой корзины.
export const CART_COOKIE = "cart_session";

export type CartItemVM = {
  id: string;
  variantId: string;
  productSlug: string;
  name: string;
  sizeLabel: string;
  color: string;
  colorHex: string | null;
  imageUrl: string | null;
  imageAlt: string;
  unitPriceMinor: number; // текущая цена варианта
  quantity: number; // сохранённое количество
  maxStock: number; // текущий остаток
  lineTotalMinor: number; // с учётом доступности и остатка
  available: boolean; // опубликован && активен && stock > 0
  quantityReduced: boolean; // сохранённое кол-во > остатка
  priceChanged: boolean; // цена изменилась с момента добавления
};

export type CartVM = {
  items: CartItemVM[];
  subtotalMinor: number; // сумма доступных позиций
  count: number; // суммарное количество товаров
  hasIssues: boolean; // есть проблемные позиции (нет в наличии / кол-во уменьшено)
};

// Результат добавления в корзину (возвращается server action-ом).
// `remaining` — сколько ещё можно добавить сверх того, что уже в корзине:
// 0 означает, что взяли последнюю доступную единицу. Склад не резервируется,
// остаток списывается только при оформлении заказа — здесь лишь обратная связь.
export type AddToCartResult =
  | {
      ok: true;
      capped: boolean; // просили больше, чем осталось — добавили сколько было
      quantity: number; // итоговое количество этого варианта в корзине
      stock: number;
      remaining: number;
    }
  | {
      ok: false;
      // already_max — весь доступный остаток варианта уже лежит в корзине
      reason: "out_of_stock" | "not_found" | "already_max";
    };

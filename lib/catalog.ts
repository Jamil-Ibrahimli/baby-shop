import "server-only";
import { prisma } from "@/lib/prisma";
import { SIZE_CODES, SIZE_TABLE, type SizeCode } from "@/lib/constants";
import { discountPercent, hasDiscount } from "@/lib/discount";
import {
  SAFETY_FILTERS,
  SORT_OPTIONS,
  DEFAULT_SORT,
  type SafetyFilter,
  type SortOption,
  type CatalogFilters,
  type CategoryNode,
} from "@/lib/catalog-shared";
import type { Locale } from "@/i18n/routing";

type RawSearchParams = Record<string, string | string[] | undefined>;

function firstValue(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

// Разбор фильтров из searchParams. Мульти-значения — через запятую (?size=0-3m,3-6m).
export function parseFilters(sp: RawSearchParams): CatalogFilters {
  const category = firstValue(sp.category) || undefined;

  const rawSizes = (firstValue(sp.size) ?? "").split(",").filter(Boolean);
  const sizes = rawSizes.filter((s): s is SizeCode =>
    (SIZE_CODES as readonly string[]).includes(s),
  );

  const rawSafety = (firstValue(sp.safety) ?? "").split(",").filter(Boolean);
  const safety = rawSafety.filter((s): s is SafetyFilter =>
    (SAFETY_FILTERS as readonly string[]).includes(s),
  );

  const minPrice = numberOrUndefined(firstValue(sp.min));
  const maxPrice = numberOrUndefined(firstValue(sp.max));

  const rawSort = firstValue(sp.sort);
  const sort: SortOption = (SORT_OPTIONS as readonly string[]).includes(
    rawSort ?? "",
  )
    ? (rawSort as SortOption)
    : DEFAULT_SORT;

  const onSale = firstValue(sp.sale) === "1";

  return { category, sizes, safety, minPrice, maxPrice, onSale, sort };
}

function numberOrUndefined(v: string | undefined): number | undefined {
  if (v === undefined || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

// ── Категории ───────────────────────────────────────────────
type CategoryRow = {
  id: string;
  slug: string;
  nameRu: string;
  nameAz: string;
  parentId: string | null;
  sortOrder: number;
};

async function allCategories(): Promise<CategoryRow[]> {
  return prisma.category.findMany({
    select: {
      id: true,
      slug: true,
      nameRu: true,
      nameAz: true,
      parentId: true,
      sortOrder: true,
    },
    orderBy: [{ sortOrder: "asc" }, { nameRu: "asc" }],
  });
}

// Дерево категорий с локализованными именами — для панели фильтров.
export async function getCategoryTree(locale: Locale): Promise<CategoryNode[]> {
  const rows = await allCategories();
  const name = (c: CategoryRow) => (locale === "az" ? c.nameAz : c.nameRu);

  const build = (parentId: string | null): CategoryNode[] =>
    rows
      .filter((c) => c.parentId === parentId)
      .map((c) => ({
        slug: c.slug,
        name: name(c),
        children: build(c.id),
      }));

  return build(null);
}

// Категория по slug + все её потомки (чтобы выбор «Унисекс» включал «Боди» и т.д.).
async function categoryAndDescendantIds(
  slug: string,
): Promise<string[] | null> {
  const rows = await allCategories();
  const root = rows.find((c) => c.slug === slug);
  if (!root) return null;

  const ids = [root.id];
  const queue = [root.id];
  while (queue.length) {
    const current = queue.shift()!;
    for (const c of rows) {
      if (c.parentId === current) {
        ids.push(c.id);
        queue.push(c.id);
      }
    }
  }
  return ids;
}

// ── Диапазон цен (для слайдера) ─────────────────────────────
export async function getPriceBounds(): Promise<{ min: number; max: number }> {
  const agg = await prisma.productVariant.aggregate({
    where: { isActive: true, product: { isPublished: true } },
    _min: { price: true },
    _max: { price: true },
  });
  return {
    min: agg._min.price ?? 0,
    max: agg._max.price ?? 0,
  };
}

// ── Карточки товаров ────────────────────────────────────────
export type ProductCardVM = {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  imageAlt: string;
  isBundle: boolean;
  isOrganic: boolean;
  priceFromMinor: number;
  // Скидка показывается по тому же варианту, что дал цену «от».
  compareAtFromMinor: number | null;
  discountPercent: number | null;
  sizeFromLabel: string | null;
  sizeToLabel: string | null;
  ratingAvg: number | null;
  ratingCount: number;
};

// Диапазон размеров по имеющимся вариантам (по порядку SIZE_CODES).
function sizeRange(codes: string[], locale: Locale) {
  const present = SIZE_CODES.filter((c) => codes.includes(c));
  if (present.length === 0) return { fromLabel: null, toLabel: null };
  const label = (c: SizeCode) =>
    locale === "az" ? SIZE_TABLE[c].labelAz : SIZE_TABLE[c].labelRu;
  const from = label(present[0]);
  const to = label(present[present.length - 1]);
  return { fromLabel: from, toLabel: from === to ? null : to };
}

export async function getCatalogProducts(
  filters: CatalogFilters,
  locale: Locale,
): Promise<ProductCardVM[]> {
  const categoryIds = filters.category
    ? await categoryAndDescendantIds(filters.category)
    : null;

  // Диапазон цены варианта (в минорных единицах).
  const priceFilter =
    filters.minPrice !== undefined || filters.maxPrice !== undefined
      ? {
          price: {
            ...(filters.minPrice !== undefined
              ? { gte: filters.minPrice * 100 }
              : {}),
            ...(filters.maxPrice !== undefined
              ? { lte: filters.maxPrice * 100 }
              : {}),
          },
        }
      : {};

  const variantSome = {
    isActive: true,
    ...(filters.sizes.length ? { sizeCode: { in: filters.sizes } } : {}),
    ...priceFilter,
    // «Только со скидкой»: у товара есть вариант со старой ценой. Условие
    // «старая > текущей» в SQL не выразить, поэтому здесь грубый отбор по
    // наличию поля, а точная проверка — ниже, при сборке карточек.
    ...(filters.onSale ? { compareAtPrice: { not: null } } : {}),
  };

  const products = await prisma.product.findMany({
    where: {
      isPublished: true,
      // Несуществующий slug (categoryIds === null при заданной категории) → пустой результат.
      ...(filters.category ? { categoryId: { in: categoryIds ?? [] } } : {}),
      ...(filters.safety.includes("organic") ? { isOrganic: true } : {}),
      ...(filters.safety.includes("hypoallergenic")
        ? { isHypoallergenic: true }
        : {}),
      ...(filters.safety.includes("cotton100") ? { cottonPercent: 100 } : {}),
      ...(filters.safety.includes("bundle") ? { isBundle: true } : {}),
      variants: { some: variantSome },
    },
    orderBy: { createdAt: "desc" },
    include: {
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
      variants: {
        where: { isActive: true },
        select: { price: true, sizeCode: true, compareAtPrice: true },
      },
      reviews: { select: { rating: true } },
    },
  });

  const cards = products.map((p) => {
    const prices = p.variants.map((v) => v.price);
    // Карточка показывает цену «от» — скидку берём у того же варианта.
    // При равных ценах выбираем вариант с большей скидкой: иначе у товара, где
    // уценён только один размер из пяти одинаковых по цене, бейдж не появился бы.
    const cheapest = p.variants.reduce<(typeof p.variants)[number] | null>(
      (best, v) => {
        if (best === null || v.price < best.price) return v;
        if (v.price > best.price) return best;
        const vPercent = discountPercent(v.price, v.compareAtPrice) ?? 0;
        const bestPercent = discountPercent(best.price, best.compareAtPrice) ?? 0;
        return vPercent > bestPercent ? v : best;
      },
      null,
    );
    const compareAtFromMinor =
      cheapest && hasDiscount(cheapest.price, cheapest.compareAtPrice)
        ? cheapest.compareAtPrice
        : null;
    const { fromLabel, toLabel } = sizeRange(
      p.variants.map((v) => v.sizeCode),
      locale,
    );
    const image = p.images[0];
    const ratingCount = p.reviews.length;
    const ratingAvg = ratingCount
      ? Math.round((p.reviews.reduce((s, r) => s + r.rating, 0) / ratingCount) * 10) / 10
      : null;
    return {
      id: p.id,
      slug: p.slug,
      name: locale === "az" ? p.nameAz : p.nameRu,
      imageUrl: image?.url ?? null,
      imageAlt:
        (locale === "az" ? image?.altAz : image?.altRu) ??
        (locale === "az" ? p.nameAz : p.nameRu),
      isBundle: p.isBundle,
      isOrganic: p.isOrganic,
      priceFromMinor: prices.length ? Math.min(...prices) : 0,
      compareAtFromMinor,
      discountPercent: cheapest
        ? discountPercent(cheapest.price, cheapest.compareAtPrice)
        : null,
      sizeFromLabel: fromLabel,
      sizeToLabel: toLabel,
      ratingAvg,
      ratingCount,
    };
  });

  // Точный отбор «со скидкой»: в запросе мы лишь проверили, что поле заполнено,
  // а скидка считается только когда старая цена выше текущей.
  const visible = filters.onSale
    ? cards.filter((c) => c.discountPercent !== null)
    : cards;

  // Сортировка по цене — в памяти: цена карточки = минимум по вариантам.
  // «popular» оставляет порядок БД (по дате создания).
  if (filters.sort === "price_asc") {
    visible.sort((a, b) => a.priceFromMinor - b.priceFromMinor);
  } else if (filters.sort === "price_desc") {
    visible.sort((a, b) => b.priceFromMinor - a.priceFromMinor);
  }

  return visible;
}

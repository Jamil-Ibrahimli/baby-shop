// Клиент-безопасные типы и константы каталога (без prisma / server-only).
// Импортируется и серверным lib/catalog.ts, и клиентскими компонентами фильтров.
import type { SizeCode } from "@/lib/constants";

// Признаки состава/безопасности, доступные как фильтры.
export const SAFETY_FILTERS = [
  "organic",
  "hypoallergenic",
  "cotton100",
  "bundle",
] as const;
export type SafetyFilter = (typeof SAFETY_FILTERS)[number];

// Варианты сортировки каталога (значение ?sort= в URL).
export const SORT_OPTIONS = ["popular", "price_asc", "price_desc"] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];
export const DEFAULT_SORT: SortOption = "popular";

export type CatalogFilters = {
  category?: string; // slug
  sizes: SizeCode[];
  safety: SafetyFilter[];
  minPrice?: number; // МАЖОРНЫЕ единицы (как в URL/UI)
  maxPrice?: number;
  onSale: boolean; // ?sale=1 — только товары со скидкой
  sort: SortOption;
};

export type CategoryNode = {
  slug: string;
  name: string;
  children: CategoryNode[];
};

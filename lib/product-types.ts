// Клиент-безопасные типы страницы товара (без prisma / server-only).
// Импортируются и серверным lib/product.ts, и клиентскими компонентами.
import type { SizeCode } from "@/lib/constants";

export type ProductVariantVM = {
  id: string;
  sizeCode: SizeCode;
  sizeLabel: string;
  heightMinCm: number | null;
  heightMaxCm: number | null;
  color: string;
  colorKey: string; // ключ цвета (по colorRu) для сопоставления с фото
  colorHex: string | null;
  priceMinor: number;
  compareAtMinor: number | null; // старая цена, если у варианта есть скидка
  discountPercent: number | null;
  stock: number;
  available: boolean; // isActive && stock > 0
};

// colorKey: если фото привязано к цвету — его ключ; null → общее фото галереи.
export type ProductImageVM = { url: string; alt: string; colorKey: string | null };

export type ReviewVM = {
  id: string;
  author: string | null;
  rating: number;
  title: string | null;
  body: string;
  createdAt: string; // ISO
  verified: boolean;
};

export type ProductDetailVM = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  composition: string | null;
  care: string | null;
  isBundle: boolean;
  bundleItems: string[];
  isOrganic: boolean;
  isHypoallergenic: boolean;
  cottonPercent: number | null;
  certifications: string[];
  categoryName: string | null;
  images: ProductImageVM[];
  variants: ProductVariantVM[];
  priceFromMinor: number;
  reviews: ReviewVM[];
  ratingAvg: number | null;
  ratingCount: number;
  metaTitle: string | null;
  metaDescription: string | null;
};

import "server-only";
import { prisma } from "@/lib/prisma";

// Данные товаров для админки.

// Список товаров: первое фото, число вариантов, суммарный остаток, категория.
export async function getAdminProducts() {
  const products = await prisma.product.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      slug: true,
      nameRu: true,
      nameAz: true,
      isPublished: true,
      isBundle: true,
      category: { select: { nameRu: true, nameAz: true } },
      images: {
        orderBy: { sortOrder: "asc" },
        take: 1,
        select: { url: true },
      },
      variants: { select: { stock: true, price: true } },
    },
  });

  return products.map((p) => ({
    id: p.id,
    slug: p.slug,
    nameRu: p.nameRu,
    nameAz: p.nameAz,
    isPublished: p.isPublished,
    isBundle: p.isBundle,
    categoryNameRu: p.category?.nameRu ?? null,
    categoryNameAz: p.category?.nameAz ?? null,
    imageUrl: p.images[0]?.url ?? null,
    variantCount: p.variants.length,
    totalStock: p.variants.reduce((s, v) => s + v.stock, 0),
    minPrice: p.variants.length
      ? Math.min(...p.variants.map((v) => v.price))
      : null,
  }));
}

// Полный товар для формы редактирования.
export async function getAdminProductById(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: {
      variants: { orderBy: { createdAt: "asc" } },
      images: { orderBy: { sortOrder: "asc" } },
    },
  });
}

export type AdminProductListItem = Awaited<
  ReturnType<typeof getAdminProducts>
>[number];
export type AdminProductDetail = NonNullable<
  Awaited<ReturnType<typeof getAdminProductById>>
>;

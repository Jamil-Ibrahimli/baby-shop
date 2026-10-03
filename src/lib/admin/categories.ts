import "server-only";
import { prisma } from "@/lib/prisma";

// Данные категорий для админки и для селекта категории в форме товара.

export type CategoryNode = {
  id: string;
  slug: string;
  nameRu: string;
  nameAz: string;
  parentId: string | null;
  sortOrder: number;
  productCount: number;
  depth: number;
};

// Все категории плоским списком с вычисленной глубиной (для дерева и селекта).
// Иерархия неглубокая (родитель → подкатегории), поэтому строим дерево в памяти.
export async function getCategoriesFlat(): Promise<CategoryNode[]> {
  const rows = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { nameRu: "asc" }],
    select: {
      id: true,
      slug: true,
      nameRu: true,
      nameAz: true,
      parentId: true,
      sortOrder: true,
      _count: { select: { products: true } },
    },
  });

  const byParent = new Map<string | null, typeof rows>();
  for (const r of rows) {
    const key = r.parentId;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(r);
  }

  const out: CategoryNode[] = [];
  const walk = (parentId: string | null, depth: number) => {
    for (const r of byParent.get(parentId) ?? []) {
      out.push({
        id: r.id,
        slug: r.slug,
        nameRu: r.nameRu,
        nameAz: r.nameAz,
        parentId: r.parentId,
        sortOrder: r.sortOrder,
        productCount: r._count.products,
        depth,
      });
      walk(r.id, depth + 1);
    }
  };
  walk(null, 0);
  return out;
}

export async function getAdminCategoryById(id: string) {
  return prisma.category.findUnique({ where: { id } });
}

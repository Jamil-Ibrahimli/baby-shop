"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/admin/guard";
import { sanitizeSlug } from "@/lib/admin/slug";

export type CategoryActionState = { error?: string; ok?: boolean };

function str(v: FormDataEntryValue | null): string {
  return String(v ?? "").trim();
}

// Собрать множество id-потомков категории (для защиты от циклов при смене родителя).
async function collectDescendants(rootId: string): Promise<Set<string>> {
  const all = await prisma.category.findMany({
    select: { id: true, parentId: true },
  });
  const childrenOf = new Map<string, string[]>();
  for (const c of all) {
    if (!c.parentId) continue;
    if (!childrenOf.has(c.parentId)) childrenOf.set(c.parentId, []);
    childrenOf.get(c.parentId)!.push(c.id);
  }
  const acc = new Set<string>();
  const stack = [rootId];
  while (stack.length) {
    const cur = stack.pop()!;
    for (const child of childrenOf.get(cur) ?? []) {
      if (!acc.has(child)) {
        acc.add(child);
        stack.push(child);
      }
    }
  }
  return acc;
}

// Создать/обновить категорию (id пустой → создание).
export async function saveCategory(
  _prev: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  if (!(await getAdminUser())) return { error: "forbidden" };

  const id = str(formData.get("id"));
  const nameRu = str(formData.get("nameRu"));
  const nameAz = str(formData.get("nameAz"));
  const slug = sanitizeSlug(str(formData.get("slug")) || nameRu);
  const parentIdRaw = str(formData.get("parentId"));
  const parentId = parentIdRaw || null;
  const sortOrder = Number.parseInt(str(formData.get("sortOrder")), 10) || 0;

  if (!nameRu || !nameAz) return { error: "name_required" };
  if (!slug) return { error: "slug_required" };

  // Защита от циклов: родитель не может быть самой категорией или её потомком.
  if (id && parentId) {
    if (parentId === id) return { error: "cycle" };
    const descendants = await collectDescendants(id);
    if (descendants.has(parentId)) return { error: "cycle" };
  }

  // Уникальность slug (кроме самой себя).
  const clash = await prisma.category.findUnique({ where: { slug } });
  if (clash && clash.id !== id) return { error: "slug_taken" };

  const data = { slug, nameRu, nameAz, parentId, sortOrder };
  if (id) {
    await prisma.category.update({ where: { id }, data });
  } else {
    await prisma.category.create({ data });
  }

  revalidatePath("/[locale]/admin/categories", "page");
  return { ok: true };
}

export async function deleteCategory(id: string): Promise<CategoryActionState> {
  if (!(await getAdminUser())) return { error: "forbidden" };
  // Товары этой категории получают categoryId=null, подкатегории становятся корневыми
  // (onDelete: SetNull в схеме) — данные не теряются.
  await prisma.category.delete({ where: { id } }).catch(() => {});
  revalidatePath("/[locale]/admin/categories", "page");
  return { ok: true };
}

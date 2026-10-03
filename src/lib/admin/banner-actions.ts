"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/admin/guard";
import {
  sanitizeBannerLink,
  toBannerTextPosition,
} from "@/lib/banner-types";

export type BannerActionState = { error?: string; ok?: boolean };

function str(v: FormDataEntryValue | null): string {
  return String(v ?? "").trim();
}
function bool(v: FormDataEntryValue | null): boolean {
  return v === "on" || v === "true";
}

// Обновляем и главную, и раздел админки: баннеры видны в обоих местах.
function revalidateBanners() {
  revalidatePath("/[locale]", "page");
  revalidatePath("/[locale]/admin/banners", "page");
}

export async function saveBanner(
  _prev: BannerActionState,
  formData: FormData,
): Promise<BannerActionState> {
  if (!(await getAdminUser())) return { error: "forbidden" };

  const id = str(formData.get("id"));
  const imageUrl = str(formData.get("imageUrl"));
  if (!imageUrl) return { error: "image_required" };

  const rawLink = str(formData.get("linkUrl"));
  const linkUrl = sanitizeBannerLink(rawLink);
  // Ссылку ввели, но она не внутренняя — молча сохранять «никуда» нельзя.
  if (rawLink && linkUrl === null) return { error: "bad_link" };

  // Кнопка без ссылки нажимать нечего, поэтому на витрине она не рисуется.
  // Раньше это происходило молча: админ вписывал подпись и не понимал,
  // почему кнопки нет. Теперь говорим прямо.
  const ctaRu = str(formData.get("ctaRu"));
  const ctaAz = str(formData.get("ctaAz"));
  if ((ctaRu || ctaAz) && !linkUrl) return { error: "cta_without_link" };

  const data = {
    imageUrl,
    titleRu: str(formData.get("titleRu")) || null,
    titleAz: str(formData.get("titleAz")) || null,
    subtitleRu: str(formData.get("subtitleRu")) || null,
    subtitleAz: str(formData.get("subtitleAz")) || null,
    ctaRu: ctaRu || null,
    ctaAz: ctaAz || null,
    linkUrl,
    textPosition: toBannerTextPosition(str(formData.get("textPosition"))),
    isActive: bool(formData.get("isActive")),
  };

  if (id) {
    await prisma.banner.update({ where: { id }, data });
  } else {
    // Новый баннер встаёт в конец списка.
    const last = await prisma.banner.findFirst({
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    await prisma.banner.create({
      data: { ...data, sortOrder: (last?.sortOrder ?? 0) + 1 },
    });
  }

  revalidateBanners();
  return { ok: true };
}

export async function deleteBanner(id: string): Promise<BannerActionState> {
  if (!(await getAdminUser())) return { error: "forbidden" };
  await prisma.banner.delete({ where: { id } }).catch(() => {});
  revalidateBanners();
  return { ok: true };
}

/**
 * Сдвинуть баннер в порядке показа. Меняемся местами с соседом — так порядок
 * остаётся предсказуемым, и не нужно перенумеровывать весь список.
 */
export async function moveBanner(
  id: string,
  direction: "up" | "down",
): Promise<BannerActionState> {
  if (!(await getAdminUser())) return { error: "forbidden" };

  const all = await prisma.banner.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, sortOrder: true },
  });
  const index = all.findIndex((b) => b.id === id);
  if (index < 0) return { error: "not_found" };

  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= all.length) return { ok: true }; // уже край списка

  const a = all[index];
  const b = all[target];
  // Порядковые номера могут совпадать (например все нули) — тогда просто
  // расставляем позиции по текущему порядку списка, иначе обмен ничего не даст.
  const aOrder = a.sortOrder === b.sortOrder ? index : a.sortOrder;
  const bOrder = a.sortOrder === b.sortOrder ? target : b.sortOrder;

  await prisma.$transaction([
    prisma.banner.update({ where: { id: a.id }, data: { sortOrder: bOrder } }),
    prisma.banner.update({ where: { id: b.id }, data: { sortOrder: aOrder } }),
  ]);

  revalidateBanners();
  return { ok: true };
}

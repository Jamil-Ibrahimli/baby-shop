import "server-only";
import { prisma } from "@/lib/prisma";

// Все баннеры для админки — включая выключенные, в порядке показа.
export async function getAdminBanners() {
  return prisma.banner.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export type AdminBanner = Awaited<ReturnType<typeof getAdminBanners>>[number];

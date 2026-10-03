import "server-only";
import { prisma } from "@/lib/prisma";
import { toBannerTextPosition, type BannerVM } from "@/lib/banner-types";
import type { Locale } from "@/i18n/routing";

// Баннеры для главной: только активные, в порядке, заданном админом.
export async function getActiveBanners(locale: Locale): Promise<BannerVM[]> {
  const rows = await prisma.banner.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      imageUrl: true,
      titleRu: true,
      titleAz: true,
      subtitleRu: true,
      subtitleAz: true,
      ctaRu: true,
      ctaAz: true,
      linkUrl: true,
      textPosition: true,
    },
  });

  const az = locale === "az";
  return rows.map((b) => ({
    id: b.id,
    imageUrl: b.imageUrl,
    title: (az ? b.titleAz : b.titleRu) || null,
    subtitle: (az ? b.subtitleAz : b.subtitleRu) || null,
    cta: (az ? b.ctaAz : b.ctaRu) || null,
    href: b.linkUrl || null,
    textPosition: toBannerTextPosition(b.textPosition),
  }));
}

"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { BannerVM } from "@/lib/banner-types";

const AUTOPLAY_MS = 6000;

/**
 * Слайдер баннеров на главной. Прокрутка — нативная, через scroll-snap:
 * свайп на телефоне работает сам, без библиотек карусели. Точки и стрелки
 * просто скроллят контейнер к нужному слайду.
 */
export function BannerSlider({ banners }: { banners: BannerVM[] }) {
  const t = useTranslations("Home");
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const count = banners.length;

  function scrollTo(next: number) {
    const track = trackRef.current;
    if (!track) return;
    const target = ((next % count) + count) % count; // по кругу
    track.scrollTo({ left: track.clientWidth * target, behavior: "smooth" });
  }

  // Автопрокрутка. Останавливается на наведении/фокусе и при одном баннере.
  useEffect(() => {
    if (count < 2 || paused) return;
    const timer = window.setInterval(() => {
      const track = trackRef.current;
      if (!track) return;
      const current = Math.round(track.scrollLeft / track.clientWidth);
      track.scrollTo({
        left: track.clientWidth * (((current + 1) % count + count) % count),
        behavior: "smooth",
      });
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [count, paused]);

  // Точку-индикатор считаем из фактической прокрутки — работает и при свайпе.
  function handleScroll() {
    const track = trackRef.current;
    if (!track) return;
    setIndex(Math.round(track.scrollLeft / track.clientWidth));
  }

  return (
    <section
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label={t("bannersLabel")}
    >
      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth rounded-3xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {banners.map((b, i) => (
          <BannerSlide key={b.id} banner={b} priority={i === 0} />
        ))}
      </div>

      {count > 1 && (
        <>
          {/* Стрелки — только на десктопе: на телефоне есть свайп. */}
          <button
            type="button"
            onClick={() => scrollTo(index - 1)}
            aria-label={t("bannerPrev")}
            className="absolute top-1/2 left-3 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full bg-card/90 text-foreground shadow-md transition-colors hover:bg-card sm:flex"
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => scrollTo(index + 1)}
            aria-label={t("bannerNext")}
            className="absolute top-1/2 right-3 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full bg-card/90 text-foreground shadow-md transition-colors hover:bg-card sm:flex"
          >
            <ChevronRight className="size-5" aria-hidden />
          </button>

          <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-2">
            {banners.map((b, i) => (
              <button
                key={b.id}
                type="button"
                onClick={() => scrollTo(i)}
                aria-label={t("bannerGoTo", { number: i + 1 })}
                aria-current={i === index ? "true" : undefined}
                className={cn(
                  "h-2 rounded-full transition-all",
                  i === index
                    ? "w-6 bg-card"
                    : "w-2 bg-card/60 hover:bg-card/80",
                )}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function BannerSlide({
  banner,
  priority,
}: {
  banner: BannerVM;
  priority: boolean;
}) {
  const hasText = !!(banner.title || banner.subtitle || banner.cta);

  const content = (
    <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted sm:aspect-[16/7]">
      <Image
        src={banner.imageUrl}
        alt={banner.title ?? ""}
        fill
        sizes="(min-width: 1280px) 1152px, 100vw"
        className="object-cover"
        priority={priority}
      />

      {hasText && (
        <>
          {/* Затемнение только под текстом — фото остаётся читаемым. */}
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent"
            aria-hidden
          />
          {/* Положение надписей выбирает админ под конкретную картинку. */}
          <div
            className={cn(
              "absolute inset-x-0 bottom-0 flex flex-col gap-2 p-5 pb-10 sm:max-w-lg sm:p-8 sm:pb-12",
              banner.textPosition === "right" &&
                "items-end text-right sm:ml-auto",
              banner.textPosition === "center" &&
                "items-center text-center sm:mx-auto",
              banner.textPosition === "left" && "items-start text-left",
            )}
          >
            {banner.title && (
              <h2 className="font-heading text-xl font-extrabold text-white text-balance drop-shadow-sm sm:text-3xl">
                {banner.title}
              </h2>
            )}
            {banner.subtitle && (
              <p className="text-sm text-white/90 text-pretty sm:text-base">
                {banner.subtitle}
              </p>
            )}
            {banner.cta && banner.href && (
              <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-sm">
                {banner.cta}
                <ChevronRight className="size-4" aria-hidden />
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );

  // Слайд целиком — ссылка, если она задана. Иначе просто картинка.
  return (
    <div className="w-full shrink-0 grow-0 basis-full snap-center">
      {banner.href ? (
        <Link href={banner.href} className="block outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {content}
        </Link>
      ) : (
        content
      )}
    </div>
  );
}

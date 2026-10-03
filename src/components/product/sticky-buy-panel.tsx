"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/** Отступ сверху, когда колонка помещается в экран: под шапку. */
const TOP_GAP_PX = 72;

/** Воздух снизу, чтобы низ колонки не прилипал вплотную к краю окна. */
const BOTTOM_GAP_PX = 16;

/** Ниже этой ширины колонка одна — липкость не нужна. */
const DESKTOP_QUERY = "(min-width: 1024px)";

/**
 * Правая колонка страницы товара: едет вместе со страницей, пока не покажется
 * её низ, и дальше стоит на месте, пока слева листаются фото и отзывы.
 *
 * Почему без чистого CSS. `sticky top: N` приклеил бы колонку сразу и её низ
 * был бы недостижим, если содержимого больше экрана. `sticky bottom: 0`
 * наоборот — короткую колонку вдавливает к нижнему краю окна. Правильное
 * значение зависит от ВЫСОТЫ содержимого, а её в CSS не узнать:
 *
 *   top = min(отступ под шапку, высота окна − высота колонки − воздух)
 *
 * Колонка выше экрана → значение отрицательное: она уезжает вверх вместе со
 * страницей ровно настолько, чтобы показался её низ, и там замирает.
 * Колонка ниже экрана → обычный отступ под шапкой.
 *
 * Пишем в style напрямую, без состояния: значение меняется на каждый кадр
 * изменения размера, перерисовывать поддерево React незачем (и правило
 * React 19 set-state-in-effect это бы запретило).
 */
export function StickyBuyPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const media = window.matchMedia(DESKTOP_QUERY);

    function measure() {
      if (!element) return;
      if (!media.matches) {
        // Телефон: колонка одна, липкость только мешала бы.
        element.style.top = "";
        return;
      }
      const fits = window.innerHeight - element.offsetHeight - BOTTOM_GAP_PX;
      element.style.top = `${Math.min(TOP_GAP_PX, fits)}px`;
    }

    measure();

    // Высота колонки меняется не только от окна: выбрали другой цвет —
    // подпись стала длиннее, раскрыли таблицу размеров — блок вырос.
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    window.addEventListener("resize", measure);
    media.addEventListener("change", measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
      media.removeEventListener("change", measure);
    };
  }, []);

  return (
    <div ref={ref} className={cn("lg:sticky lg:self-start", className)}>
      {children}
    </div>
  );
}

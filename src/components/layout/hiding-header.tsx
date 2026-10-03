"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Насколько нужно проехать, чтобы шапка среагировала. Без этого порога она
 * дёргалась бы от каждого микродвижения колеса и от «резинки» на телефоне.
 */
const THRESHOLD_PX = 8;

/**
 * До этой отметки шапку не прячем вовсе: у самого верха страницы она должна
 * быть на месте, иначе короткий рывок вниз убирает её сразу после загрузки.
 */
const KEEP_VISIBLE_UNTIL_PX = 80;

/**
 * Шапка, которая уезжает вверх при прокрутке вниз и возвращается при
 * прокрутке вверх.
 *
 * Смысл: на телефоне липкая шапка съедает заметную часть экрана, а при чтении
 * карточки товара она не нужна. Стоит потянуть вверх — она снова под рукой,
 * и не надо возвращаться в начало страницы.
 *
 * Клиентский только каркас: содержимое приходит из серверной SiteHeader
 * через children, поэтому запросы к сессии и корзине остаются на сервере.
 */
export function HidingHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [hidden, setHidden] = useState(false);
  // Последнюю позицию держим в ref, а не в состоянии: она меняется на каждый
  // кадр прокрутки, и перерисовывать шапку из-за неё незачем.
  const lastY = useRef(0);

  useEffect(() => {
    lastY.current = window.scrollY;
    let ticking = false;

    function update() {
      ticking = false;
      const y = window.scrollY;
      const delta = y - lastY.current;

      if (Math.abs(delta) < THRESHOLD_PX) return;
      lastY.current = y;

      if (y < KEEP_VISIBLE_UNTIL_PX) {
        setHidden(false);
        return;
      }
      setHidden(delta > 0);
    }

    function onScroll() {
      // Считаем в кадре отрисовки, а не на каждое событие: событий прокрутки
      // прилетают сотни в секунду, и дёргать layout на каждом — лишнее.
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-transform duration-300 motion-reduce:transition-none",
        hidden ? "-translate-y-full" : "translate-y-0",
        className,
      )}
    >
      {children}
    </header>
  );
}

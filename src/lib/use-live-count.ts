"use client";

import { useEffect, useState } from "react";

/**
 * Как часто спрашиваем сервер. Десять секунд — компромисс: колокольчик
 * ощущается живым, но мы не платим за вызов функции и запрос к базе каждую
 * секунду ради цифры, на которую смотрят раз в час. Опрашивают только вошедшие
 * пользователи (у гостя колокольчика нет), поэтому нагрузка маленькая.
 * Менять интервал — здесь, одно число на весь проект.
 */
export const LIVE_COUNT_INTERVAL_MS = 10_000;

/**
 * Держит счётчик свежим опросом сервера.
 *
 * Зачем вообще: счётчики считаются в серверных компонентах при сборке
 * страницы, поэтому до перезагрузки цифра не менялась.
 *
 * Опрос ЗАСЫПАЕТ, когда вкладка неактивна, и будится при возврате — там же
 * сразу делается внеочередной запрос, чтобы человек не ждал целый интервал.
 * Это экономит почти всё: вкладка магазина обычно висит в фоне часами.
 *
 * @param initial  значение, посчитанное на сервере (показываем до первого ответа)
 * @param load     серверный экшен; ССЫЛКА ДОЛЖНА БЫТЬ СТАБИЛЬНОЙ — передавайте
 *                 импортированный экшен, а не стрелку, объявленную в рендере,
 *                 иначе эффект будет перезапускаться на каждый рендер.
 */
export function useLiveCount(
  initial: number,
  load: () => Promise<number>,
): number {
  const [count, setCount] = useState(initial);

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setInterval> | undefined;

    async function tick() {
      try {
        const next = await load();
        if (!stopped) setCount(next);
      } catch {
        // Сеть моргнула или сессия истекла — молча ждём следующего тика.
        // Ронять шапку из-за счётчика нельзя.
      }
    }

    function start() {
      timer ??= setInterval(tick, LIVE_COUNT_INTERVAL_MS);
    }

    function stop() {
      if (timer === undefined) return;
      clearInterval(timer);
      timer = undefined;
    }

    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        void tick();
        start();
      } else {
        stop();
      }
    }

    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      stopped = true;
      stop();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [load]);

  return count;
}

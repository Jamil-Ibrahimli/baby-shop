"use client";

import { useEffect, useState } from "react";
import { playNotifySound } from "@/lib/notification-sound";

/**
 * Как часто спрашиваем сервер. Десять секунд — компромисс: колокольчик
 * ощущается живым, но мы не платим за вызов функции и запрос к базе каждую
 * секунду ради цифры, на которую смотрят раз в час. Опрашивают только вошедшие
 * пользователи (у гостя колокольчика нет), поэтому нагрузка маленькая.
 * Менять интервал — здесь, одно число на весь проект.
 */
export const LIVE_COUNT_INTERVAL_MS = 10_000;

/** Сколько неудач подряд терпим, прежде чем остановить опрос. */
const MAX_FAILURES = 3;

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
 * @param initial   значение, посчитанное на сервере (показываем до первого ответа)
 * @param load      серверный экшен; ССЫЛКА ДОЛЖНА БЫТЬ СТАБИЛЬНОЙ — передавайте
 *                  импортированный экшен, а не стрелку, объявленную в рендере,
 *                  иначе эффект будет перезапускаться на каждый рендер.
 * @param soundSrc  звук, которым сообщаем о НОВОМ уведомлении (путь из
 *                  NOTIFY_SOUND). Звучит, только когда счётчик ВЫРОС: не при
 *                  первом ответе, не когда человек прочитал и число упало.
 */
export function useLiveCount(
  initial: number,
  load: () => Promise<number>,
  soundSrc?: string,
): number {
  const [count, setCount] = useState(initial);

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setInterval> | undefined;
    let failures = 0;
    // Отсчитываем от серверного значения, а не от нуля: иначе первый же ответ
    // выглядел бы как рост и звонил бы на пустом месте. Компонент пересоздаётся
    // по key, когда сервер пересчитал счётчик, так что эта метка всегда свежая.
    let previous = initial;

    async function tick() {
      try {
        const next = await load();
        if (stopped) return;
        failures = 0;
        if (soundSrc && next > previous) playNotifySound(soundSrc);
        previous = next;
        setCount(next);
      } catch {
        // Сеть моргнула или сессия истекла — молча ждём следующего тика.
        // Ронять шапку из-за счётчика нельзя.
        //
        // Но если не отвечает раз за разом, опрос ОСТАНАВЛИВАЕМ. Вкладка может
        // остаться открытой на мёртвой сборке (в разработке — после
        // перезапуска сервера) или на отвалившейся сессии, и тогда она будет
        // долбить сервер вечно. Попробуем снова, когда человек вернётся на
        // вкладку: visibilitychange ниже всё перезапустит.
        failures += 1;
        if (failures >= MAX_FAILURES) stop();
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
        // Вернулись на вкладку — даём опросу второй шанс, даже если он
        // остановился из-за ошибок: сервер мог уже подняться.
        failures = 0;
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
  }, [load, initial, soundSrc]);

  return count;
}

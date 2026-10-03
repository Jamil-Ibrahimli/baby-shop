"use client";

import { useEffect, useState } from "react";
import type { AdminUnreadCounts } from "@/lib/notifications";
import { NOTIFY_SOUND, playNotifySound } from "@/lib/notification-sound";

/**
 * Как часто спрашиваем сервер — одно число на весь проект, и активная вкладка
 * от фоновой не отличается.
 *
 * Тридцать секунд, а не десять: опрос идёт в том числе в фоне, иначе звук
 * нового заказа не догнал бы владельца, пока он в другой вкладке, — а звук
 * ровно для этого и нужен.
 *
 * Оговорка, которую не обойти: браузеры сами душат таймеры в спрятанных
 * вкладках (Chrome со временем урезает их примерно до раза в минуту). Так что
 * в фоне задержка будет больше заявленной, сколько сюда ни пиши.
 */
export const LIVE_COUNT_INTERVAL_MS = 30_000;

/** Сколько неудач подряд терпим, прежде чем остановить опрос. */
const MAX_FAILURES = 3;

/** Что проигрывать, если счётчики выросли. `null` — молчать. */
type SoundPicker<T> = (next: T, previous: T) => string | null;

/**
 * Покупателю сигнал один на все случаи: уведомления приходят ему редко,
 * различать их на слух незачем.
 */
export const customerSound: SoundPicker<number> = (next, previous) =>
  next > previous ? NOTIFY_SOUND.notify : null;

/**
 * Владельцу — два разных сигнала. За один тик звучит ТОЛЬКО ОДИН: если пришёл
 * и заказ, и отзыв, побеждает заказ (деньги важнее). Второе событие остаётся
 * без звука — его видно по счётчику.
 *
 * Категории сравниваются ПО ОТДЕЛЬНОСТИ, а не по общему числу. Иначе чтение
 * гасило бы приход: было «всего 2, заказов 2», владелец прочитал один заказ и
 * в тот же тик пришёл отзыв — стало «всего 2, заказов 1». Заказы не выросли,
 * общее не выросло, и отзыв прошёл бы молча.
 */
export const shopSound: SoundPicker<AdminUnreadCounts> = (next, previous) => {
  if (next.orders > previous.orders) return NOTIFY_SOUND.order;
  const nextOther = next.total - next.orders;
  const previousOther = previous.total - previous.orders;
  if (nextOther > previousOther) return NOTIFY_SOUND.notify;
  return null;
};

/**
 * Держит счётчик свежим опросом сервера.
 *
 * Зачем вообще: счётчики считаются в серверных компонентах при сборке
 * страницы, поэтому до перезагрузки цифра не менялась.
 *
 * Опрос идёт и в фоне — иначе звук не дошёл бы до человека, пока он в другой
 * вкладке. При возврате на вкладку делается внеочередной запрос: браузер мог
 * придушить таймер, и значение успело устареть.
 *
 * @param initial  значение с сервера; РАСКЛАДЫВАЙТЕ НА ПРИМИТИВЫ в сигнатуре
 *                 вызывающего хука — объект, собранный в рендере, менял бы
 *                 ссылку каждый раз и перезапускал эффект.
 * @param load     серверный экшен; ссылка должна быть стабильной (импортируйте
 *                 экшен, не объявляйте стрелку в рендере).
 * @param soundFor чистая функция уровня модуля: по старому и новому значению
 *                 решает, что проиграть.
 */
function useLivePoll<T>(
  initial: T,
  load: () => Promise<T>,
  soundFor: SoundPicker<T>,
  // Зависимости эффекта — только примитивы из initial. Передаются отдельно,
  // потому что сам initial может быть объектом с новой ссылкой на каждый рендер.
  initialKeys: readonly unknown[],
): T {
  const [value, setValue] = useState(initial);

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setInterval> | undefined;
    let failures = 0;
    // Отсчитываем от серверного значения, а не от нуля: иначе первый же ответ
    // выглядел бы как рост и звонил бы на пустом месте.
    let previous = initial;

    async function tick() {
      try {
        const next = await load();
        if (stopped) return;
        failures = 0;
        const sound = soundFor(next, previous);
        if (sound) playNotifySound(sound);
        previous = next;
        setValue(next);
      } catch {
        // Сеть моргнула или сессия истекла — молча ждём следующего тика.
        // Ронять шапку из-за счётчика нельзя.
        //
        // Но если не отвечает раз за разом, опрос ОСТАНАВЛИВАЕМ. Вкладка может
        // остаться открытой на мёртвой сборке (в разработке — после
        // перезапуска сервера) или на отвалившейся сессии, и тогда она будет
        // долбить сервер вечно. Попробуем снова, когда человек вернётся на
        // вкладку.
        failures += 1;
        if (failures >= MAX_FAILURES) stop();
      }
    }

    function start() {
      timer ??= setInterval(() => void tick(), LIVE_COUNT_INTERVAL_MS);
    }

    function stop() {
      if (timer === undefined) return;
      clearInterval(timer);
      timer = undefined;
    }

    function onVisibilityChange() {
      if (document.visibilityState !== "visible") return;
      // Вернулись на вкладку: догоняем значение сразу (в фоне браузер мог
      // придушить таймер) и даём опросу второй шанс, если он остановился
      // из-за ошибок — сервер мог уже подняться.
      failures = 0;
      void tick();
      start();
    }

    start();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      stopped = true;
      stop();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
    // initial намеренно НЕ в зависимостях — вместо него примитивы из initialKeys.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, soundFor, ...initialKeys]);

  return value;
}

/** Непрочитанные покупателя. Возвращает число. */
export function useLiveCount(
  initial: number,
  load: () => Promise<number>,
): number {
  return useLivePoll(initial, load, customerSound, [initial]);
}

/** Непрочитанные магазина с разбивкой. Возвращает общее число. */
export function useLiveShopCount(
  initialTotal: number,
  initialOrders: number,
  load: () => Promise<AdminUnreadCounts>,
): number {
  return useLivePoll(
    { total: initialTotal, orders: initialOrders },
    load,
    shopSound,
    [initialTotal, initialOrders],
  ).total;
}

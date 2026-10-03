"use client";

/**
 * Звуки уведомлений. Файлы лежат в public/sounds — см. тамошний README.
 * Путь начинается со слэша: Next отдаёт содержимое public/ от корня сайта.
 */
export const NOTIFY_SOUND = {
  /**
   * Обычное уведомление. Звучит на витрине (всё, что приходит покупателю)
   * и в админке — на всём, КРОМЕ заказов: отзывы и прочее.
   */
  notify: "/sounds/notify-sound.mp3",
  /**
   * Новый заказ — только в админке. Отдельный сигнал потому, что заказ это
   * деньги и срочность: владелец должен узнавать его, не глядя на экран.
   */
  order: "/sounds/order-sound.mp3",
} as const;

/**
 * Громкость. Меньше единицы намеренно: звук срабатывает, когда человек занят
 * другим делом, и пугать его не нужно.
 */
const VOLUME = 0.4;

/**
 * Один элемент Audio на файл. Создавать новый на каждое срабатывание —
 * значит каждый раз заново тянуть и декодировать mp3.
 */
const players = new Map<string, HTMLAudioElement>();

function getPlayer(src: string): HTMLAudioElement {
  let audio = players.get(src);
  if (!audio) {
    audio = new Audio(src);
    audio.preload = "auto";
    audio.volume = VOLUME;
    players.set(src, audio);
  }
  return audio;
}

/**
 * Проиграть звук уведомления.
 *
 * Молча ничего не делает, если браузер не разрешил. Это НЕ ошибка: браузеры
 * запрещают звук, пока человек хоть раз не взаимодействовал со страницей —
 * защита от сайтов, которые орут при открытии. На практике первое уведомление
 * сразу после загрузки вкладки может пройти беззвучно, дальше всё работает.
 */
export function playNotifySound(src: string): void {
  try {
    const audio = getPlayer(src);
    // Перематываем в начало: иначе второе уведомление подряд не прозвучит,
    // пока не доиграет первое.
    audio.currentTime = 0;
    void audio.play().catch(() => {});
  } catch {
    // Старый браузер без Audio или заблокированный автоплей — звук не главное.
  }
}

/** Пауза между звуками в очереди. */
const GAP_MS = 3000;

/** Отложенный звук очереди — чтобы новую очередь не наслоить на старую. */
let queued: ReturnType<typeof setTimeout> | undefined;

/**
 * Проиграть несколько звуков ПО ОЧЕРЕДИ, с паузой между ними.
 *
 * Нужно, когда за один тик опроса пришли разные события: заказ и отзыв.
 * Проигрывать их одновременно нельзя — услышится каша, из которой не понять,
 * что пришло. Поэтому строго один за другим.
 *
 * Новая очередь отменяет недоигранную старую: если события посыпались,
 * последнее важнее, чем хвост предыдущего.
 */
export function playNotifySounds(sources: readonly string[]): void {
  if (queued !== undefined) {
    clearTimeout(queued);
    queued = undefined;
  }
  if (sources.length === 0) return;

  const playFrom = (index: number): void => {
    playNotifySound(sources[index]);
    const next = index + 1;
    if (next >= sources.length) return;
    queued = setTimeout(() => {
      queued = undefined;
      playFrom(next);
    }, GAP_MS);
  };

  playFrom(0);
}

"use client";

/**
 * Звуки уведомлений. Файлы лежат в public/sounds — см. тамошний README.
 * Путь начинается со слэша: Next отдаёт содержимое public/ от корня сайта.
 */
export const NOTIFY_SOUND = {
  /** Покупателю — колокольчик в шапке витрины. */
  customer: "/sounds/notify-customer.mp3",
  /** Владельцу — лента магазина в админке. */
  admin: "/sounds/notify-admin.mp3",
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

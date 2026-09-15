"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Sun, Moon } from "lucide-react";
import {
  applyThemeMode,
  DARK_QUERY,
  readThemeMode,
  resolveDark,
  THEME_STORAGE_KEY,
  type ThemeMode,
} from "@/lib/theme";

/**
 * Событие «тему поменяли в ЭТОЙ вкладке». Штатное storage-событие браузер шлёт
 * только другим вкладкам, поэтому своей нужен собственный сигнал — иначе иконка
 * кнопки не обновилась бы до перезагрузки.
 */
const THEME_EVENT = "balaca:themechange";

function subscribe(onChange: () => void): () => void {
  const media = window.matchMedia(DARK_QUERY);
  media.addEventListener("change", onChange);
  window.addEventListener(THEME_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    media.removeEventListener("change", onChange);
    window.removeEventListener(THEME_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

// Кнопка показывает РЕЗУЛЬТАТ, а не сохранённый режим: пока выбора не было,
// значение приходит из настроек системы.
const isDarkNow = (): boolean => resolveDark(readThemeMode());

// На сервере ни localStorage, ни настроек ОС нет — там всегда светлая.
const serverSnapshot = (): boolean => false;

/**
 * Переключатель темы: светлая ↔ тёмная.
 *
 * Отдельного пункта «как в системе» нет — это состояние по умолчанию, оно
 * работает само, пока человек не нажал кнопку. Поэтому выбора всего два, и
 * меню для них избыточно: одна кнопка короче любого списка.
 */
export function ThemeToggle() {
  const t = useTranslations("Theme");

  // useSyncExternalStore, а НЕ useState + useEffect: и localStorage, и
  // matchMedia — внешние хранилища. Хук честно разводит серверный снимок и
  // клиентский, поэтому иконка не даёт ошибку гидратации, и заодно обходит
  // запрет React 19 set-state-in-effect.
  const isDark = useSyncExternalStore(subscribe, isDarkNow, serverSnapshot);

  // Пока режим системный, тема обязана меняться на лету вслед за ОС
  // (например, когда та переключается по расписанию «на закате»).
  useEffect(() => {
    const media = window.matchMedia(DARK_QUERY);
    const sync = () => applyThemeMode(readThemeMode());
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const select = useCallback((next: ThemeMode) => {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Хранилище недоступно — тему всё равно применяем, просто не запомним.
    }
    applyThemeMode(next);
    window.dispatchEvent(new Event(THEME_EVENT));
  }, []);

  // Иконка и подпись описывают то, что произойдёт ПОСЛЕ нажатия: у голой
  // картинки солнца/луны иначе не понять, это текущее состояние или кнопка.
  const label = isDark ? t("toLight") : t("toDark");
  const Icon = isDark ? Sun : Moon;

  return (
    <button
      type="button"
      onClick={() => select(isDark ? "light" : "dark")}
      aria-label={label}
      title={label}
      className="inline-flex size-9 items-center justify-center rounded-full outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Icon className="size-5" aria-hidden />
    </button>
  );
}

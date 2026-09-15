"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Monitor, Sun, Moon, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  applyThemeMode,
  DARK_QUERY,
  readThemeMode,
  THEME_MODES,
  THEME_STORAGE_KEY,
  type ThemeMode,
} from "@/lib/theme";

const ICONS: Record<ThemeMode, typeof Monitor> = {
  system: Monitor,
  light: Sun,
  dark: Moon,
};

/**
 * Событие «тему поменяли в ЭТОЙ вкладке». Штатное storage-событие браузер шлёт
 * только другим вкладкам, поэтому своей нужен собственный сигнал — иначе иконка
 * переключателя не обновилась бы до перезагрузки.
 */
const THEME_EVENT = "balaca:themechange";

function subscribe(onChange: () => void): () => void {
  window.addEventListener(THEME_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(THEME_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

// На сервере выбора не знаем — там всегда «системная».
const serverSnapshot = (): ThemeMode => "system";

/** Выбор темы: системная / светлая / тёмная. */
export function ThemeToggle() {
  const t = useTranslations("Theme");

  // useSyncExternalStore, а НЕ useState + useEffect: localStorage это внешнее
  // хранилище, и хук честно разводит серверный снимок и клиентский, поэтому
  // иконка не даёт ошибку гидратации. Заодно обходим правило React 19
  // set-state-in-effect, которое такой синхронизации не разрешает.
  const mode = useSyncExternalStore(subscribe, readThemeMode, serverSnapshot);

  // В системном режиме тема обязана меняться на лету, когда человек переключает
  // её в самой ОС (например по расписанию «на закате»).
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

  const Icon = ICONS[mode];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("label")}
        title={t("label")}
        className="inline-flex size-9 items-center justify-center rounded-full outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Icon className="size-5" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {THEME_MODES.map((item) => {
          const ItemIcon = ICONS[item];
          const isActive = item === mode;
          return (
            <DropdownMenuItem
              key={item}
              onClick={() => select(item)}
              aria-current={isActive ? "true" : undefined}
            >
              <ItemIcon className="size-4" aria-hidden />
              {t(item)}
              {isActive && (
                <Check className="ml-auto size-4 text-primary" aria-hidden />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

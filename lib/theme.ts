/**
 * Тема оформления: системная (как в настройках телефона/ноутбука), светлая, тёмная.
 *
 * Выбор темы — настройка БРАУЗЕРА, а не аккаунта: лежит в localStorage. Поэтому
 * она работает и для гостя, не требует входа и не стоит ни одного запроса к БД.
 * Побочный эффект: на другом устройстве выбор придётся сделать заново — это
 * ожидаемо, так ведут себя почти все сайты.
 */
export const THEME_STORAGE_KEY = "balaca-theme";

export const THEME_MODES = ["system", "light", "dark"] as const;
export type ThemeMode = (typeof THEME_MODES)[number];

/** Медиа-запрос «в системе включена тёмная тема». */
export const DARK_QUERY = "(prefers-color-scheme: dark)";

export function isThemeMode(value: unknown): value is ThemeMode {
  return (
    typeof value === "string" &&
    (THEME_MODES as readonly string[]).includes(value)
  );
}

/** Сохранённый режим. Чужое/битое значение и запрет на хранилище → «системная». */
export function readThemeMode(): ThemeMode {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeMode(stored) ? stored : "system";
  } catch {
    // Приватный режим Safari и «блокировать данные сайтов» бросают исключение.
    return "system";
  }
}

/** Режим → нужен ли сейчас класс dark на <html>. */
export function resolveDark(mode: ThemeMode): boolean {
  if (mode === "system") return window.matchMedia(DARK_QUERY).matches;
  return mode === "dark";
}

/**
 * Применить режим к документу. Класс dark на <html> включает и токены палитры
 * (.dark из brandThemeCss), и утилиты Tailwind вида dark:bg-... — одним движением.
 */
export function applyThemeMode(mode: ThemeMode): void {
  document.documentElement.classList.toggle("dark", resolveDark(mode));
}

/**
 * Тот же расчёт, но строкой — для инлайн-скрипта в начале <body>.
 *
 * Он обязан отработать ДО первой отрисовки: сервер не знает ни localStorage, ни
 * настроек ОС и всегда присылает светлую разметку, так что без этого скрипта
 * тёмная тема на долю секунды мигала бы белым при каждом переходе.
 * Импортировать сюда модуль нельзя — он приедет только с гидратацией, то есть
 * поздно. Поэтому логика продублирована; обе половины меняем парой.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var m=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(m!=="light"&&m!=="dark"){m="system"}var d=m==="dark"||(m==="system"&&window.matchMedia(${JSON.stringify(
  DARK_QUERY,
)}).matches);document.documentElement.classList.toggle("dark",d)}catch(e){}})()`;

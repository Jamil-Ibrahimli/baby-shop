// ЕДИНЫЙ КОНФИГ БРЕНДА.
// Меняешь значения здесь — и это уже другой магазин: название, цвета, логотип,
// контакты, Telegram. Никаких захардкоженных названий/цветов в компонентах —
// только отсюда и через Tailwind-токены (которые тоже питаются этим конфигом,
// см. brandCssVariables() и app/[locale]/layout.tsx).
//
// СЕКРЕТЫ ЗДЕСЬ НЕ ХРАНЯТСЯ. Токен Telegram-бота и chat_id — в .env
// (TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID). Тут только публичные данные.

export const brand = {
  /** Название магазина. Показывается в шапке, title, письмах. */
  name: "Balaca",

  /** Короткий слоган (локализованный). */
  tagline: {
    ru: "Тёплая одежда для малышей 0–3",
    az: "0–3 yaş körpələr üçün isti geyim",
  },

  /** Совсем короткая подпись под логотипом (2–3 слова), локализованная. */
  shortTagline: {
    ru: "детская одежда",
    az: "uşaq geyimi",
  },

  /** Валюта магазина (ISO 4217). Цены в БД хранятся в минорных единицах. */
  currency: "AZN",

  /**
   * Символ валюты для показа цен. Задан явно, а не берётся из Intl: у Node и
   * браузера разные данные о локалях, и одна и та же цена выходила как «49,90 ₼»
   * на сервере и «AZN 49.90» в браузере — React ругался на несовпадение разметки.
   */
  currencySymbol: "₼",

  /**
   * Часовой пояс магазина (IANA). Сервер на хостинге живёт по UTC, поэтому все
   * даты — и в номере заказа, и на экранах — считаем в этом поясе. Иначе заказ,
   * оформленный ночью, датировался бы вчерашним днём.
   */
  timeZone: "Asia/Baku",

  /** Префикс номера заказа: BS-130826-A1B2C3D4. Дата — день-месяц-год. */
  orderNumberPrefix: "BS",

  /**
   * Логотип. Если logo.src задан — показываем картинку из /public,
   * иначе рисуем текстовый логотип из name.
   */
  logo: {
    src: null as string | null, // напр. "/logo.svg"
    alt: "Balaca",
  },

  /**
   * Пастельная, тёплая, «доверительная» палитра (спецификация, раздел 9).
   * HEX — чтобы владелец-не-технарь мог поменять цвет вручную.
   * Эти значения проецируются в CSS-переменные shadcn/ui (--primary и т.д.),
   * поэтому смена цвета здесь перекрашивает весь UI.
   */
  colors: {
    background: "#FFFFFF", // чистый белый фон
    foreground: "#332E2C", // тёмный тёплый графит (текст)
    card: "#FFFFFF", // карточки — чистый белый
    surface: "#F7F9F8", // мягкая подложка под карточками (фон админ-панели)
    primary: "#6FAFA8", // бирюзовый (кнопки, цена, логотип, активные фильтры)
    primaryForeground: "#FFFFFF",
    primaryLight: "#E7F3F1", // мягкий teal (бейдж «Органик», подложки)
    primarySoft: "#F2FAF8", // ещё светлее teal (крупные подложки)
    secondary: "#D6A3AC", // пыльно-розовый (бейдж «Комплект», тёплые акценты)
    secondaryForeground: "#4E2831",
    secondaryLight: "#F7EBED", // светло-розовая подложка
    // Текст НА розовой подложке. Отдельно от secondaryForeground: тот написан
    // для насыщенного розового, а эти два цвета в тёмной теме расходятся —
    // подложка уходит в тёмный, а текст обязан стать светлым.
    secondaryLightForeground: "#4E2831",
    accent: "#EAF3F1", // очень светлый teal (рамка каталога, мягкие подложки)
    accentForeground: "#332E2C",
    muted: "#F1F0EC", // тёплый светло-серый (плейсхолдеры)
    mutedForeground: "#7C7773",
    border: "#E3ECEA", // мягкая холодноватая граница
    ring: "#6FAFA8",
  },

  /**
   * ТЁМНАЯ палитра — те же роли, что и в colors, другие значения.
   * Не «инверсия светлой»: на тёмном фоне чистый чёрный выглядит дёшево, а
   * насыщенный бирюзовый теряет контраст. Поэтому фон — тёплый графит с лёгким
   * зелёным подтоном (родня основному цвету), а бирюзовый и розовый осветлены,
   * чтобы текст на них и они сами на фоне читались.
   *
   * Отношение «подложка темнее карточек» сохранено как в светлой теме:
   * surface уходит вглубь, card всплывает — иначе админка теряет глубину.
   */
  colorsDark: {
    background: "#15191A", // тёплый графит с зелёным подтоном
    foreground: "#E9E6E1", // тёплый белёсый (пара к графиту #332E2C)
    card: "#1D2223", // карточки всплывают над фоном
    surface: "#101314", // подложка админки — глубже фона
    primary: "#7FC5BC", // бирюзовый, осветлён ради контраста на тёмном
    primaryForeground: "#0D2220", // тёмный текст на бирюзовой кнопке
    primaryLight: "#1D3330", // мягкая бирюзовая подложка (бейджи)
    primarySoft: "#182826", // ещё глубже — крупные подложки
    secondary: "#E2B4BC", // пыльно-розовый, осветлён
    secondaryForeground: "#392026",
    secondaryLight: "#2E2226", // тёмно-розовая подложка
    secondaryLightForeground: "#E8CBD1", // светло-розовый текст на ней
    accent: "#1E2B2A",
    accentForeground: "#E9E6E1",
    muted: "#232829", // плейсхолдеры, скелетоны
    mutedForeground: "#9AA2A1", // приглушённый текст
    border: "#2B3334", // граница чуть светлее карточки
    ring: "#7FC5BC",
  },

  /** Контакты магазина (публичные). */
  contacts: {
    phone: "+994 00 000 00 00",
    email: "hello@example.com",
    address: {
      ru: "г. Баку, ул. Пример, 1",
      az: "Bakı ş., Nümunə küç. 1",
    },
    instagram: "https://instagram.com/example",
    whatsapp: "+994000000000",
  },

  /** Telegram — публичные ссылки. Токен бота и chat_id владельца — в .env. */
  telegram: {
    /** Публичный контакт/канал магазина для покупателей (не бот уведомлений). */
    contactUsername: "@example_shop",
  },
} as const;

export type Brand = typeof brand;

type Palette = typeof brand.colors | typeof brand.colorsDark;

/** Палитра → список объявлений CSS-переменных shadcn/ui. */
function paletteVars(c: Palette): string {
  const vars: Record<string, string> = {
    "--background": c.background,
    "--foreground": c.foreground,
    "--card": c.card,
    "--card-foreground": c.foreground,
    "--surface": c.surface,
    "--popover": c.card,
    "--popover-foreground": c.foreground,
    "--primary": c.primary,
    "--primary-foreground": c.primaryForeground,
    "--secondary": c.secondary,
    "--secondary-foreground": c.secondaryForeground,
    "--muted": c.muted,
    "--muted-foreground": c.mutedForeground,
    "--accent": c.accent,
    "--accent-foreground": c.accentForeground,
    "--border": c.border,
    "--input": c.border,
    "--ring": c.ring,
    // Дополнительные оттенки бренда для мягких подложек и бейджей.
    "--primary-light": c.primaryLight,
    "--primary-soft": c.primarySoft,
    "--secondary-light": c.secondaryLight,
    "--secondary-light-foreground": c.secondaryLightForeground,
  };
  return Object.entries(vars)
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
}

/**
 * Обе палитры бренда одним куском CSS: :root — светлая, .dark — тёмная.
 *
 * Раньше переменные вешались инлайн-стилем на <html>. Это удобно, пока тема
 * одна, но инлайн-стиль сильнее ЛЮБОГО селектора, поэтому правило .dark его
 * физически не могло перебить — тёмная тема была невозможна в принципе.
 * Теперь это обычный CSS, и переключение темы — просто класс на <html>.
 *
 * Единственный источник цвета по-прежнему config/brand.ts: одноимённые
 * переменные из globals.css удалены, чтобы значение не задавалось в двух местах.
 * Радиус тоже мягкий (скруглённые формы из спецификации).
 */
export function brandThemeCss(): string {
  return [
    `:root{color-scheme:light;${paletteVars(brand.colors)};--radius:0.9rem}`,
    `.dark{color-scheme:dark;${paletteVars(brand.colorsDark)}}`,
  ].join("");
}

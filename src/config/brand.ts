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
   * Палитра направления «Яркий и живой» (макет Balaca, холст Claude Design).
   * HEX — чтобы владелец-не-технарь мог поменять цвет вручную.
   * Эти значения проецируются в CSS-переменные shadcn/ui (--primary и т.д.),
   * поэтому смена цвета здесь перекрашивает весь UI.
   *
   * Макет отдан в oklch, здесь он переведён в sRGB: конфиг держит HEX, чтобы
   * цвет можно было скопировать в любой редактор. Прежняя палитра была
   * бирюза + пыльно-розовый; теперь основа — коралл, а рядом три ярких
   * акцента (жёлтый, голубой, зелёный) для категорий и бейджей.
   */
  colors: {
    background: "#FDFBF9", // тёплый молочный, не чисто белый
    foreground: "#151B24", // почти чёрный с холодным подтоном (текст)
    card: "#FFFFFF", // карточки — чистый белый поверх молочного фона
    surface: "#F2EEE7", // мягкая тёплая подложка (фон админ-панели, пилюли)
    primary: "#C83122", // коралл: логотип, цена, ссылки, активные фильтры
    primaryForeground: "#FFFFFF",
    primaryLight: "#FFEDEA", // светлая коралловая подложка (плитки, бейджи)
    primarySoft: "#FFF6F4", // ещё светлее — крупные подложки
    secondary: "#EDCC48", // жёлтый: главная кнопка призыва
    secondaryForeground: "#362607", // тёмный текст на жёлтой кнопке
    secondaryLight: "#F7ECBE", // светло-жёлтая подложка
    // Текст НА светлой подложке. Отдельно от secondaryForeground: тот написан
    // для насыщенного жёлтого, а в тёмной теме эти два цвета расходятся —
    // подложка уходит в тёмный, а текст обязан стать светлым.
    secondaryLightForeground: "#3D2A02",
    accent: "#FFDDD4", // светло-коралловая подложка
    accentForeground: "#151B24",
    muted: "#F2EEE7", // плейсхолдеры, скелетоны
    mutedForeground: "#66635D", // приглушённый текст (тёплый серый)
    border: "#EDE4DC", // тёплая тонкая граница
    ring: "#C83122",

    // Два дополнительных акцента бренда — плитки категорий, бейдж «Органик».
    // Текст на них ТЁМНЫЙ: в макете он был белым, но белое на этих пастельных
    // тонах даёт контраст 2.2 и 1.9 при норме 4.5, то есть подпись почти не
    // читается. Жёлтая плитка в макете уже сделана тёмным текстом — здесь
    // то же правило распространено на голубую и зелёную.
    accentBlue: "#2BBDF5",
    accentBlueForeground: "#06384D",
    accentBlueLight: "#B6E6FF",
    accentGreen: "#6FD087",
    accentGreenForeground: "#0F3D1E",
    accentGreenLight: "#D5F5DA",
  },

  /**
   * ТЁМНАЯ палитра — те же роли, что и в colors, другие значения.
   *
   * ВНИМАНИЕ: тёмная тема СЕЙЧАС ОТКЛЮЧЕНА (макет «Яркий и живой» её не
   * описывает, см. CLAUDE.md п. 27). Палитра оставлена и переведена на коралл,
   * чтобы при включении не начинать с нуля, но вживую она не проверялась —
   * считайте её черновиком, а не готовым результатом.
   *
   * Не «инверсия светлой»: на тёмном фоне чистый чёрный выглядит дёшево, а
   * насыщенный коралл теряет контраст. Поэтому фон — тёплый графит с красным
   * подтоном (родня основному цвету), а коралл осветлён.
   *
   * Отношение «подложка темнее карточек» сохранено как в светлой теме:
   * surface уходит вглубь, card всплывает — иначе админка теряет глубину.
   */
  colorsDark: {
    // Фон намеренно глубже, чем «просто тёмно-серый»: карточке нужно откуда
    // всплывать. Если фон и карточка почти совпадают, экран выглядит плоским,
    // и никакая тень этого не спасает — на тёмном она почти не видна.
    background: "#17120F", // тёплый графит с красным подтоном
    foreground: "#EDE7E1", // тёплый белёсый (пара к #151B24)
    card: "#231C18", // карточки всплывают над фоном
    surface: "#100C0A", // подложка админки — глубже фона
    primary: "#F0806E", // коралл, осветлён ради контраста на тёмном
    primaryForeground: "#3A0D07", // тёмный текст на коралловой кнопке
    primaryLight: "#3A201B", // мягкая коралловая подложка (бейджи)
    primarySoft: "#2B1815", // ещё глубже — крупные подложки
    secondary: "#EDCC48", // жёлтый на тёмном работает как есть
    secondaryForeground: "#362607",
    secondaryLight: "#332810", // тёмно-жёлтая подложка
    secondaryLightForeground: "#F2DFA0", // светло-жёлтый текст на ней
    accent: "#33201C",
    accentForeground: "#EDE7E1",
    muted: "#282220", // плейсхолдеры, скелетоны
    mutedForeground: "#A39A93", // приглушённый текст
    border: "#372D28", // граница чуть светлее карточки
    ring: "#F0806E",

    // Акценты категорий. Сами тона осветлены под тёмный фон, текст на них
    // остаётся тёмным — как и в светлой теме.
    accentBlue: "#4FC9F7",
    accentBlueForeground: "#06384D",
    accentBlueLight: "#14303D",
    accentGreen: "#7FD894",
    accentGreenForeground: "#0F3D1E",
    accentGreenLight: "#16331F",
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
    // Акценты категорий: голубой и зелёный.
    "--accent-blue": c.accentBlue,
    "--accent-blue-foreground": c.accentBlueForeground,
    "--accent-blue-light": c.accentBlueLight,
    "--accent-green": c.accentGreen,
    "--accent-green-foreground": c.accentGreenForeground,
    "--accent-green-light": c.accentGreenLight,
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

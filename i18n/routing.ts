import { defineRouting } from "next-intl/routing";

// Маршрутизация локалей. По умолчанию — русский (спецификация, раздел 3).
// localePrefix "always" → URL всегда с префиксом (/ru, /az); "/" редиректит на /ru.
export const routing = defineRouting({
  locales: ["ru", "az"],
  defaultLocale: "ru",
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];

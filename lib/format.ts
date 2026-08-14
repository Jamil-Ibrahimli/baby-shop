import { brand } from "@/config/brand";
import type { Locale } from "@/i18n/routing";

// Форматирование денег. В БД цены в МИНОРНЫХ единицах (qəpik), поэтому /100.
const localeTag: Record<Locale, string> = {
  ru: "ru-RU",
  az: "az-AZ",
};

// Форматирование с явной валютой (напр. валюта-снапшот заказа).
export function formatMoney(
  minorUnits: number,
  currency: string,
  locale: Locale,
): string {
  return new Intl.NumberFormat(localeTag[locale], {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(minorUnits / 100);
}

// Форматирование в валюте магазина (из config/brand.ts).
export function formatPrice(minorUnits: number, locale: Locale): string {
  return formatMoney(minorUnits, brand.currency, locale);
}

/**
 * Формат даты/времени во времени магазина (brand.timeZone). Сервер на хостинге
 * работает по UTC, поэтому без пояса ночной заказ показывался бы вчерашним днём.
 * Порядок дат европейский — его даёт локаль ru-RU / az-AZ (13.08.2026).
 */
export function dateFormat(
  locale: Locale,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(localeTag[locale], {
    timeZone: brand.timeZone,
    ...options,
  });
}

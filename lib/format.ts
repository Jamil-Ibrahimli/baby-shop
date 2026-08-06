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

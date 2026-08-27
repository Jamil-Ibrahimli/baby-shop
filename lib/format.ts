import { brand } from "@/config/brand";
import type { Locale } from "@/i18n/routing";

// Форматирование денег. В БД цены в МИНОРНЫХ единицах (qəpik), поэтому /100.
const localeTag: Record<Locale, string> = {
  ru: "ru-RU",
  az: "az-AZ",
};

// Разделители по локали. Русский и азербайджанский тут совпадают (запятая и
// неразрывный пробел), но список оставлен явным — форматы валют по странам разные.
const numberSeparators: Record<Locale, { decimal: string; group: string }> = {
  ru: { decimal: ",", group: " " },
  az: { decimal: ",", group: " " },
};

/**
 * Цену собираем САМИ, без Intl.NumberFormat.
 * Причина: у Node и у браузера разные данные о локалях, и «49,90 ₼» на сервере
 * превращалось в «AZN 49.90» в браузере. Цены выводятся и в клиентских
 * компонентах (выбор варианта, строка корзины), поэтому разметка не сходилась
 * и React перерисовывал дерево с предупреждением о гидратации.
 * Ручной формат даёт один и тот же текст в любой среде.
 */
function formatAmount(minorUnits: number, locale: Locale): string {
  const { decimal, group } = numberSeparators[locale];
  const rounded = Math.round(minorUnits);
  const sign = rounded < 0 ? "-" : "";
  const abs = Math.abs(rounded);

  const major = String(Math.trunc(abs / 100)).replace(
    /\B(?=(\d{3})+(?!\d))/g,
    group,
  );
  const minor = String(abs % 100).padStart(2, "0");
  return `${sign}${major}${decimal}${minor}`;
}

// Форматирование с явной валютой (напр. валюта-снапшот заказа).
// Символ берём из конфига только для валюты магазина; у прочих показываем код.
export function formatMoney(
  minorUnits: number,
  currency: string,
  locale: Locale,
): string {
  const unit =
    currency === brand.currency ? brand.currencySymbol : currency;
  return `${formatAmount(minorUnits, locale)} ${unit}`;
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

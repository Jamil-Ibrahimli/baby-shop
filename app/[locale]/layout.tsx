import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Inter, Nunito } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import { brand, brandThemeCss } from "@/config/brand";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import "../globals.css";

// Кириллица (ru) + расширенная латиница (az: ə, ğ, ş, ...) + латиница.
const inter = Inter({
  subsets: ["latin", "latin-ext", "cyrillic"],
  variable: "--font-sans",
});

// Дружелюбный округлый шрифт для заголовков и логотипа (поддерживает ru + az).
const nunito = Nunito({
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["600", "700", "800"],
  variable: "--font-nunito",
});

// Пререндер обеих локалей.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const loc: Locale = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;
  return {
    title: { default: brand.name, template: `%s · ${brand.name}` },
    description: brand.tagline[loc],
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  // Включаем статический рендер для этой локали.
  setRequestLocale(locale);

  return (
    // suppressHydrationWarning: класс dark на <html> дописывает скрипт ниже,
    // то есть разметка на клиенте заведомо отличается от серверной.
    <html
      lang={locale}
      className={`${inter.variable} ${nunito.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      {/* Обе палитры бренда (:root и .dark) из config/brand.ts. Раньше цвета
          вешались инлайн-стилем на <html>, но инлайн сильнее любого селектора и
          правило .dark не могло его перебить — тёмная тема была невозможна.
          href + precedence — это React 19: стиль поднимается в <head> и при
          навигации не дублируется. */}
      <style href="brand-theme" precedence="high">
        {brandThemeCss()}
      </style>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        {/* Ставит класс dark ДО первой отрисовки. Сервер не знает ни localStorage,
            ни настроек ОС и всегда отдаёт светлую разметку, поэтому без этого
            скрипта тёмная тема мигала бы белым на каждом переходе. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}

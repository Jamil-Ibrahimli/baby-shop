import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import { Inter, Nunito } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import { brand, brandStyleVars } from "@/config/brand";
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
    <html
      lang={locale}
      className={`${inter.variable} ${nunito.variable} h-full antialiased`}
      // Палитра бренда как инлайн-переменные — перекрашивает весь UI из config/brand.ts.
      style={brandStyleVars() as CSSProperties}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}

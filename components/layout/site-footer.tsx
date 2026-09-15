import { getTranslations } from "next-intl/server";
import { MapPin, Phone, Mail } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/brand/logo";
import {
  InstagramIcon,
  WhatsAppIcon,
} from "@/components/brand/social-icons";
import { brand } from "@/config/brand";
import type { Locale } from "@/i18n/routing";

/**
 * Подвал витрины. Всё содержимое — из config/brand.ts и messages, поэтому при
 * смене бренда меняется вместе с ним.
 * Ссылки ведём ТОЛЬКО на существующие страницы: «Доставка», «О нас» и прочих
 * страниц в проекте пока нет, а ссылка в никуда хуже её отсутствия.
 */
export async function SiteFooter({ locale }: { locale: Locale }) {
  const [t, tHeader, tCatalog] = await Promise.all([
    getTranslations("Footer"),
    getTranslations("Header"),
    getTranslations("Catalog"),
  ]);

  const whatsappDigits = brand.contacts.whatsapp.replace(/[^\d]/g, "");
  const year = new Date().getFullYear();

  return (
    <footer className="mt-12 border-t border-border bg-surface">
      <div className="mx-auto grid w-full max-w-site gap-8 px-4 py-10 sm:px-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Бренд */}
        <div className="flex flex-col gap-3 lg:col-span-2">
          <Link href="/" aria-label={tHeader("home")} className="w-fit">
            <Logo />
          </Link>
          <p className="max-w-sm text-sm text-muted-foreground">
            {brand.tagline[locale]}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <a
              href={`https://wa.me/${whatsappDigits}`}
              target="_blank"
              rel="noreferrer"
              aria-label="WhatsApp"
              className="inline-flex size-9 items-center justify-center rounded-full bg-card text-foreground shadow-sm transition-colors hover:text-primary"
            >
              <WhatsAppIcon />
            </a>
            <a
              href={brand.contacts.instagram}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="inline-flex size-9 items-center justify-center rounded-full bg-card text-foreground shadow-sm transition-colors hover:text-primary"
            >
              <InstagramIcon />
            </a>
          </div>
        </div>

        {/* Магазин */}
        <nav className="flex flex-col gap-2" aria-label={t("shopTitle")}>
          <h2 className="font-heading text-sm font-bold">{t("shopTitle")}</h2>
          <FooterLink href="/catalog">{tHeader("catalog")}</FooterLink>
          <FooterLink href="/catalog?sale=1">
            {tCatalog("Filters.onSale")}
          </FooterLink>
          <FooterLink href="/cart">{tHeader("cart")}</FooterLink>
          <FooterLink href="/account">{tHeader("account")}</FooterLink>
        </nav>

        {/* Контакты */}
        <div className="flex flex-col gap-2">
          <h2 className="font-heading text-sm font-bold">
            {t("contactsTitle")}
          </h2>
          <a
            href={`tel:${brand.contacts.phone.replace(/\s/g, "")}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Phone className="size-3.5 shrink-0" aria-hidden />
            {brand.contacts.phone}
          </a>
          <a
            href={`mailto:${brand.contacts.email}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Mail className="size-3.5 shrink-0" aria-hidden />
            {brand.contacts.email}
          </a>
          <p className="inline-flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            {brand.contacts.address[locale]}
          </p>
        </div>
      </div>

      {/* Нижняя строка: копирайт и честная приписка про оплату */}
      <div className="border-t border-border">
        <div className="mx-auto flex w-full max-w-site flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground sm:px-6">
          <span>{t("copyright", { year, shop: brand.name })}</span>
          <span>{t("paymentNote")}</span>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="w-fit text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      {children}
    </Link>
  );
}

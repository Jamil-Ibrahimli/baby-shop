"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Menu, Heart } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { brand } from "@/config/brand";
import type { Locale } from "@/i18n/routing";
import { Logo } from "@/components/brand/logo";
import { BearMascot } from "@/components/brand/bear-mascot";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminUserCard } from "@/components/admin/admin-user-card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

type AdminUser = { name: string; email: string | null };

// Содержимое сайдбара: логотип → навигация → карточка-маскот → язык → админ.
// Одно и то же и на десктопе (постоянный сайдбар), и в мобильном меню (sheet).
function SidebarBody({
  unread,
  user,
  onNavigate,
}: {
  unread: number;
  user: AdminUser;
  onNavigate?: () => void;
}) {
  const t = useTranslations("Admin.Nav");
  const locale = useLocale() as Locale;

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto p-4">
      <Link
        href="/"
        onClick={onNavigate}
        className="flex flex-col gap-0.5 rounded-xl px-1 py-1 outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Logo className="text-xl" />
        <span className="text-[11px] text-muted-foreground">
          {brand.shortTagline[locale]}
        </span>
      </Link>

      <AdminNav unread={unread} onNavigate={onNavigate} />

      {/* Тёплая карточка с маскотом — «мягкая» пауза между навигацией и профилем */}
      <div className="mt-auto rounded-2xl bg-primary-soft p-4 text-center">
        <BearMascot className="mx-auto h-16 w-auto" />
        <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
          {t("withLove")}
          <Heart className="size-3 fill-secondary text-secondary" aria-hidden />
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <LocaleSwitcher />
        <AdminUserCard name={user.name} email={user.email} />
      </div>
    </div>
  );
}

// Постоянный сайдбар (десктоп).
export function AdminSidebar({
  unread,
  user,
}: {
  unread: number;
  user: AdminUser;
}) {
  return (
    <aside className="sticky top-0 hidden h-svh w-64 shrink-0 border-r border-border bg-card lg:block">
      <SidebarBody unread={unread} user={user} />
    </aside>
  );
}

// Мобильная шапка админки: кнопка меню (открывает тот же сайдбар в sheet) + логотип.
export function AdminMobileBar({
  unread,
  user,
}: {
  unread: number;
  user: AdminUser;
}) {
  const t = useTranslations("Admin.Nav");
  const [open, setOpen] = useState(false);

  return (
    <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card/90 px-4 backdrop-blur lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          aria-label={t("openMenu")}
          className="relative inline-flex size-9 items-center justify-center rounded-full outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Menu className="size-5" aria-hidden />
          {unread > 0 && (
            <span
              className="absolute right-1 top-1 size-2 rounded-full bg-primary"
              aria-hidden
            />
          )}
        </SheetTrigger>
        <SheetContent side="left" className="w-72 gap-0 p-0">
          <SidebarBody
            unread={unread}
            user={user}
            onNavigate={() => setOpen(false)}
          />
        </SheetContent>
      </Sheet>
      <Link href="/admin" className="min-w-0">
        <Logo className="text-lg" />
      </Link>
    </div>
  );
}

"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { User, ChevronsUpDown, Store, UserCircle, LogOut } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { logoutAction } from "@/lib/auth-actions";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

// Карточка текущего администратора в подвале сайдбара: имя, email и меню
// (в магазин / личный кабинет / выход).
export function AdminUserCard({
  name,
  email,
}: {
  name: string;
  email: string | null;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex w-full items-center gap-2.5 rounded-2xl border border-border bg-card p-2.5 text-left outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={name}
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary">
          <User className="size-4.5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{name}</span>
          {email && (
            <span className="block truncate text-xs text-muted-foreground">
              {email}
            </span>
          )}
        </span>
        <ChevronsUpDown
          className="size-4 shrink-0 text-muted-foreground"
          aria-hidden
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-56">
        <DropdownMenuItem render={<Link href="/" />}>
          <Store className="size-4" aria-hidden />
          {t("Admin.Nav.toShop")}
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/account" />}>
          <UserCircle className="size-4" aria-hidden />
          {t("Auth.Account.title")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() =>
            startTransition(async () => {
              await logoutAction();
              router.replace("/");
              router.refresh();
            })
          }
        >
          <LogOut className="size-4" aria-hidden />
          {t("Auth.signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

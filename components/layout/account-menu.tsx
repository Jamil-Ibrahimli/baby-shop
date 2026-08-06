"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { User, UserCircle, Bell, LayoutDashboard, LogOut } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { logoutAction } from "@/lib/auth-actions";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

// Меню аккаунта: личный кабинет, (для admin) админка, выход.
export function AccountMenu({
  name,
  isAdmin,
}: {
  name: string;
  isAdmin: boolean;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={name}
        className="inline-flex size-9 items-center justify-center rounded-full outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
      >
        <User className="size-5" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{name}</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/account" />}>
          <UserCircle className="size-4" aria-hidden />
          {t("Auth.Account.title")}
        </DropdownMenuItem>
        {/* Уведомления — отдельный раздел, не часть кабинета */}
        {!isAdmin && (
          <DropdownMenuItem render={<Link href="/notifications" />}>
            <Bell className="size-4" aria-hidden />
            {t("Notifications.title")}
          </DropdownMenuItem>
        )}
        {isAdmin && (
          <DropdownMenuItem render={<Link href="/admin" />}>
            <LayoutDashboard className="size-4" aria-hidden />
            {t("Admin.title")}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
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

"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  User,
  UserCircle,
  Bell,
  LayoutDashboard,
  LogOut,
  SquareArrowOutUpRight,
} from "lucide-react";
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
        {/* Уведомления — отдельный раздел, не часть кабинета. Показываем всем,
            включая админа: это его покупательская лента. Лента магазина — внутри
            админки, отдельным пунктом сайдбара. */}
        <DropdownMenuItem render={<Link href="/notifications" />}>
          <Bell className="size-4" aria-hidden />
          {t("Notifications.title")}
        </DropdownMenuItem>
        {/* Админка открывается в ОТДЕЛЬНОЙ вкладке: витрина и панель нужны
            владельцу одновременно — посмотрел заказ в панели, проверил, как
            товар выглядит покупателю, вернулся. В одной вкладке это постоянная
            беготня назад. Значок и скрытая подпись предупреждают заранее:
            неожиданный переход сбивает, особенно со скринридером.

            Имя вкладки, а НЕ _blank: с `_blank` каждый клик открывал новую, и
            они копились. Каждая такая вкладка опрашивает сервер и проигрывает
            свой звук уведомления — было измерено вдвое больше запросов, чем
            положено, и звук дублировался. С именем браузер переиспользует уже
            открытую. rel="noopener" убран намеренно: он мешает браузеру найти
            вкладку по имени, а страница своя же, того же origin. */}
        {isAdmin && (
          <DropdownMenuItem render={<Link href="/admin" target="balaca-admin" />}>
            <LayoutDashboard className="size-4" aria-hidden />
            {t("Admin.title")}
            <span className="sr-only"> — {t("Common.newTab")}</span>
            <SquareArrowOutUpRight
              className="ml-auto size-3.5 text-muted-foreground"
              aria-hidden
            />
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

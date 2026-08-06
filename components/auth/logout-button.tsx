"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { logoutAction } from "@/lib/auth-actions";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      className="rounded-full"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await logoutAction();
          router.replace("/");
          router.refresh();
        })
      }
    >
      {t("signOut")}
    </Button>
  );
}

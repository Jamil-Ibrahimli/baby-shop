"use client";

import { useActionState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { registerAction, type AuthActionState } from "@/lib/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const [state, formAction, pending] = useActionState<
    AuthActionState,
    FormData
  >(registerAction, {});

  useEffect(() => {
    if (state.ok) {
      router.replace("/account");
      router.refresh();
    }
  }, [state.ok, router]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">{t("name")}</Label>
        <Input id="name" name="name" type="text" autoComplete="name" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">{t("email")}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">{t("password")}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          minLength={6}
        />
        <p className="text-xs text-muted-foreground">
          {t("Register.passwordHint")}
        </p>
      </div>
      {state.error && (
        <p className="text-sm text-destructive">{t(`Errors.${state.error}`)}</p>
      )}
      <Button type="submit" disabled={pending} className="rounded-full">
        {t("Register.submit")}
      </Button>
    </form>
  );
}

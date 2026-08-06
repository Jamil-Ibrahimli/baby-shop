"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { placeOrder, type PlaceOrderState } from "@/lib/order-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Locale } from "@/i18n/routing";

export function CheckoutForm({
  locale,
  defaultName,
  defaultEmail,
}: {
  locale: Locale;
  defaultName: string;
  defaultEmail: string;
}) {
  const t = useTranslations("Checkout");
  const [isGift, setIsGift] = useState(false);
  // Успех обрабатывается серверным redirect() в placeOrder — на клиенте ловим
  // только ошибки валидации/наличия (state.error), форма остаётся на месте.
  const [state, formAction, pending] = useActionState<
    PlaceOrderState,
    FormData
  >(placeOrder, {});

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="locale" value={locale} />

      {/* Контакты */}
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-base font-semibold">
          {t("contactsTitle")}
        </legend>
        <Field id="name" label={t("name")} required defaultValue={defaultName} />
        <Field id="phone" label={t("phone")} type="tel" required />
        <Field
          id="email"
          label={t("email")}
          type="email"
          defaultValue={defaultEmail}
        />
      </fieldset>

      {/* Адрес */}
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-base font-semibold">
          {t("addressTitle")}
        </legend>
        <Field id="city" label={t("city")} required />
        <Field id="line1" label={t("line1")} required />
        <Field id="line2" label={t("line2")} />
        <div className="grid grid-cols-2 gap-3">
          <Field id="postalCode" label={t("postalCode")} />
          <Field id="country" label={t("country")} />
        </div>
      </fieldset>

      {/* Подарок */}
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-base font-semibold">
          {t("giftTitle")}
        </legend>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isGift"
            checked={isGift}
            onChange={(e) => setIsGift(e.target.checked)}
            className="size-4 accent-primary"
          />
          {t("isGift")}
        </label>
        {isGift && (
          <textarea
            name="giftMessage"
            rows={2}
            placeholder={t("giftMessagePlaceholder")}
            className="w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        )}
      </fieldset>

      {/* Комментарий */}
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-base font-semibold">
          {t("commentTitle")}
        </legend>
        <textarea
          name="comment"
          rows={2}
          placeholder={t("commentPlaceholder")}
          className="w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </fieldset>

      {state.error && (
        <p className="text-sm text-destructive">{t(`Errors.${state.error}`)}</p>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={pending}
        className="rounded-full"
      >
        {t("submit")}
      </Button>
    </form>
  );
}

function Field({
  id,
  label,
  type = "text",
  required = false,
  defaultValue,
}: {
  id: string;
  label: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      <Input
        id={id}
        name={id}
        type={type}
        required={required}
        defaultValue={defaultValue}
      />
    </div>
  );
}

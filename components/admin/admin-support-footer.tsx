import { getTranslations } from "next-intl/server";
import { HelpCircle } from "lucide-react";
import { brand } from "@/config/brand";

// Подвал админки: «Нужна помощь? Свяжитесь с нами». Контакт — из config/brand.ts.
export async function AdminSupportFooter() {
  const t = await getTranslations("Admin");

  return (
    <footer className="flex items-center justify-center gap-1.5 px-4 py-6 text-xs text-muted-foreground">
      <HelpCircle className="size-3.5 shrink-0" aria-hidden />
      <span>{t("supportQuestion")}</span>
      <a
        href={`mailto:${brand.contacts.email}`}
        className="font-medium text-primary underline-offset-2 hover:underline"
      >
        {t("supportLink")}
      </a>
    </footer>
  );
}

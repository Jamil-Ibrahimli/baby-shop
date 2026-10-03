import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { RegisterForm } from "@/components/auth/register-form";

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Auth");

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-16">
      <h1 className="text-2xl font-semibold">{t("Register.title")}</h1>
      <RegisterForm />
      <p className="text-sm text-muted-foreground">
        {t("Register.haveAccount")}{" "}
        <Link
          href="/login"
          className="font-medium text-foreground underline underline-offset-4"
        >
          {t("Register.loginLink")}
        </Link>
      </p>
    </main>
  );
}

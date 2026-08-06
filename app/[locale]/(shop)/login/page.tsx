import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Auth");

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-16">
      <h1 className="text-2xl font-semibold">{t("Login.title")}</h1>
      <LoginForm />
      <p className="text-sm text-muted-foreground">
        {t("Login.noAccount")}{" "}
        <Link
          href="/register"
          className="font-medium text-foreground underline underline-offset-4"
        >
          {t("Login.registerLink")}
        </Link>
      </p>
    </main>
  );
}

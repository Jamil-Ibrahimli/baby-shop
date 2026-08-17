import { getTranslations } from "next-intl/server";
// Иконок брендов в lucide 1.x больше нет (их убрали из набора) — для Instagram
// берём нейтральную «камеру», для WhatsApp — облачко сообщения.
import { Camera, MessageCircle } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { BearMascot } from "@/components/brand/bear-mascot";
import { brand } from "@/config/brand";

// Блок «спросите нас»: связь идёт по телефону и в мессенджерах (онлайн-оплаты нет),
// поэтому WhatsApp и Instagram — главные кнопки. Ссылки — из config/brand.ts.
export async function ContactCta() {
  const t = await getTranslations("Home");
  const whatsappDigits = brand.contacts.whatsapp.replace(/[^\d]/g, "");

  return (
    <section className="flex flex-col items-center gap-5 rounded-3xl bg-secondary-light px-5 py-8 text-center sm:px-10">
      <BearMascot className="size-16" />
      <div>
        <h2 className="font-heading text-xl font-bold sm:text-2xl">
          {t("contactTitle")}
        </h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground text-pretty">
          {t("contactLead")}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <a
          href={`https://wa.me/${whatsappDigits}`}
          target="_blank"
          rel="noreferrer"
          className={buttonVariants({ className: "rounded-full" })}
        >
          <MessageCircle className="size-4" aria-hidden />
          {t("contactWhatsapp")}
        </a>
        <a
          href={brand.contacts.instagram}
          target="_blank"
          rel="noreferrer"
          className={buttonVariants({
            variant: "outline",
            className: "rounded-full bg-card",
          })}
        >
          <Camera className="size-4" aria-hidden />
          {t("contactInstagram")}
        </a>
      </div>
    </section>
  );
}

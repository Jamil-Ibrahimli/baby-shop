import { getTranslations } from "next-intl/server";
import { SIZE_CODES, SIZE_TABLE } from "@/lib/constants";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Locale } from "@/i18n/routing";

// Таблица размеров 0–3 (возраст ↔ рост) + подсказка «как выбрать». В диалоге.
export async function SizeGuideDialog({ locale }: { locale: Locale }) {
  const t = await getTranslations("Product.SizeGuide");
  const az = locale === "az";

  return (
    <Dialog>
      <DialogTrigger className="text-sm font-medium text-primary underline underline-offset-4">
        {t("trigger")}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("howToText")}</DialogDescription>
        </DialogHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("colSize")}</TableHead>
              <TableHead>{t("colAge")}</TableHead>
              <TableHead className="text-right">{t("colHeight")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {SIZE_CODES.map((code) => {
              const s = SIZE_TABLE[code];
              return (
                <TableRow key={code}>
                  <TableCell className="font-medium">{code}</TableCell>
                  <TableCell>{az ? s.labelAz : s.labelRu}</TableCell>
                  <TableCell className="text-right">
                    {s.heightMinCm}–{s.heightMaxCm}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
}

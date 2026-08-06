import { getTranslations } from "next-intl/server";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import type { ProductDetailVM } from "@/lib/product-types";

// Аккордеон с деталями: описание, состав, уход, безопасность/сертификаты.
export async function ProductDetails({
  product,
}: {
  product: ProductDetailVM;
}) {
  const t = await getTranslations("Product");

  const hasSafety =
    product.isOrganic ||
    product.isHypoallergenic ||
    !!product.cottonPercent ||
    product.certifications.length > 0;

  const defaultOpen = product.description ? ["description"] : [];

  return (
    <Accordion multiple defaultValue={defaultOpen}>
      {product.description && (
        <AccordionItem value="description">
          <AccordionTrigger>{t("Details.description")}</AccordionTrigger>
          <AccordionContent>
            <p className="whitespace-pre-line text-muted-foreground">
              {product.description}
            </p>
          </AccordionContent>
        </AccordionItem>
      )}

      {product.composition && (
        <AccordionItem value="composition">
          <AccordionTrigger>{t("Details.composition")}</AccordionTrigger>
          <AccordionContent>
            <p className="whitespace-pre-line text-muted-foreground">
              {product.composition}
            </p>
          </AccordionContent>
        </AccordionItem>
      )}

      {product.care && (
        <AccordionItem value="care">
          <AccordionTrigger>{t("Details.care")}</AccordionTrigger>
          <AccordionContent>
            <p className="whitespace-pre-line text-muted-foreground">
              {product.care}
            </p>
          </AccordionContent>
        </AccordionItem>
      )}

      {hasSafety && (
        <AccordionItem value="safety">
          <AccordionTrigger>{t("Details.safety")}</AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-wrap gap-2">
              {product.cottonPercent && (
                <Badge variant="secondary">
                  {t("Safety.cotton", { percent: product.cottonPercent })}
                </Badge>
              )}
              {product.isOrganic && (
                <Badge variant="secondary">{t("Safety.organic")}</Badge>
              )}
              {product.isHypoallergenic && (
                <Badge variant="secondary">{t("Safety.hypoallergenic")}</Badge>
              )}
              {product.certifications.map((c) => (
                <Badge key={c} variant="outline">
                  {c}
                </Badge>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      )}
    </Accordion>
  );
}

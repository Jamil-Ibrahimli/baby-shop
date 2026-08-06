import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

// Презентационный рейтинг из 5 звёзд (без интерактива).
// tone: "primary" — цвет бренда (страница товара), "amber" — золотые (карточки каталога).
export function StarRating({
  value,
  tone = "primary",
  size = "size-4",
  className,
}: {
  value: number;
  tone?: "primary" | "amber";
  size?: string;
  className?: string;
}) {
  const rounded = Math.round(value);
  const filled =
    tone === "amber" ? "fill-amber-400 text-amber-400" : "fill-primary text-primary";
  return (
    <div className={cn("flex items-center gap-0.5", className)} aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            size,
            i <= rounded ? filled : "fill-transparent text-muted-foreground/30",
          )}
        />
      ))}
    </div>
  );
}

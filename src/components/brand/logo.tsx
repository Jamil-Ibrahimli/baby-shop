import Image from "next/image";
import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";

// Логотип магазина. Если в конфиге задан logo.src — показываем картинку,
// иначе рисуем текстовый wordmark из brand.name + сердечко (цвета из палитры).
// Никакого хардкода названия — всё из config/brand.ts.
export function Logo({ className }: { className?: string }) {
  if (brand.logo.src) {
    return (
      <Image
        src={brand.logo.src}
        alt={brand.logo.alt}
        width={120}
        height={32}
        className={cn("h-8 w-auto", className)}
        priority
      />
    );
  }

  return (
    <span
      className={cn(
        "font-heading text-2xl font-extrabold tracking-tight text-primary",
        className,
      )}
    >
      {brand.name}
      <svg
        viewBox="0 0 24 24"
        className="ml-0.5 inline-block size-4 -translate-y-1.5 text-secondary"
        aria-hidden
        focusable="false"
      >
        <path
          fill="currentColor"
          d="M12 21s-7.5-4.9-10-9.3C.7 9.1 1.6 5.6 4.7 4.6c2-.7 4 .2 5.1 1.9l1.2 1.8 1.2-1.8c1.1-1.7 3.1-2.6 5.1-1.9 3.1 1 4 4.5 2.7 7.1C19.5 16.1 12 21 12 21Z"
        />
      </svg>
    </span>
  );
}

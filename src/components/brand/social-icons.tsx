import { cn } from "@/lib/utils";

// Логотипы Instagram и WhatsApp. Своими файлами, потому что в lucide 1.x
// иконки брендов из набора убрали. Цвет наследуется (currentColor), поэтому
// на цветной кнопке глиф белый, на белой — цвета текста.
// Формы — узнаваемые марки брендов; используются только как ссылки на профили
// магазина, что для логотипов обычная практика.

type IconProps = { className?: string };

/** Instagram: контурная «камера» — скруглённый квадрат, объектив и вспышка. */
export function InstagramIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-4", className)}
      aria-hidden
      focusable="false"
    >
      <rect x="2" y="2" width="20" height="20" rx="5.5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="1.15" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * WhatsApp: облачко с хвостиком и телефонной трубкой внутри.
 * Всё контуром в currentColor — так глиф работает и на цветной кнопке, и на
 * белой. Заливать нельзя: тогда трубку пришлось бы «вырезать» цветом фона,
 * а фон у кнопок разный.
 */
export function WhatsAppIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-4", className)}
      aria-hidden
      focusable="false"
    >
      {/* облачко: круг с хвостиком влево-вниз */}
      <path d="M21.5 11.7a9.5 9.5 0 0 1-14.1 8.3L2.5 21.5l1.6-4.8A9.5 9.5 0 1 1 21.5 11.7Z" />
      {/* трубка — уменьшенный телефонный глиф в центре облачка */}
      <g transform="translate(6.96 6.4) scale(0.42)" strokeWidth={4}>
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
      </g>
    </svg>
  );
}

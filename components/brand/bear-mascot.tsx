import { cn } from "@/lib/utils";

// Маскот-мишка на облачке со звёздочками (декоративный, для «тёплых» блоков —
// например карточка в сайдбаре админки). Цвета — только токены бренда,
// поэтому меняются вместе с палитрой config/brand.ts. Смысла не несёт → aria-hidden.
export function BearMascot({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 96 80"
      className={cn("text-accent", className)}
      aria-hidden
      focusable="false"
    >
      {/* звёздочки вокруг */}
      <path
        className="fill-secondary"
        d="M14 16l1.5 3.4L19 21l-3.5 1.6L14 26l-1.5-3.4L9 21l3.5-1.6L14 16Z"
      />
      <path
        className="fill-primary/50"
        d="M82 10l1.2 2.7 2.8 1.3-2.8 1.3L82 18l-1.2-2.7L78 14l2.8-1.3L82 10Z"
      />
      <circle cx="26" cy="8" r="2" className="fill-primary/40" />
      <circle cx="72" cy="26" r="1.6" className="fill-secondary/70" />

      {/* облачко-подушка под мишкой */}
      <path
        fill="currentColor"
        d="M24 76c-8.3 0-15-4.9-15-11 0-4.6 3.8-8.5 9.2-10.1 1.6-4.3 6.4-7.4 12-7.4 2.2 0 4.3.5 6.1 1.3C39.1 45.3 44.6 42 51 42c8.4 0 15.4 5.6 16.7 12.9 6.5.7 11.3 4.8 11.3 9.7 0 5.7-6.5 11.4-14.5 11.4H24Z"
      />

      {/* мишка */}
      {/* ушки */}
      <circle cx="34" cy="30" r="7" className="fill-secondary" />
      <circle cx="62" cy="30" r="7" className="fill-secondary" />
      <circle cx="34" cy="30" r="3.4" className="fill-secondary-light" />
      <circle cx="62" cy="30" r="3.4" className="fill-secondary-light" />
      {/* голова */}
      <ellipse cx="48" cy="42" rx="18" ry="16" className="fill-secondary" />
      {/* мордочка */}
      <ellipse cx="48" cy="47" rx="9" ry="7" className="fill-secondary-light" />
      {/* щёчки */}
      <circle cx="33" cy="45" r="3" className="fill-primary/25" />
      <circle cx="63" cy="45" r="3" className="fill-primary/25" />
      {/* глазки */}
      <circle cx="41" cy="39" r="2.2" className="fill-foreground" />
      <circle cx="55" cy="39" r="2.2" className="fill-foreground" />
      {/* носик */}
      <ellipse cx="48" cy="44.5" rx="2.4" ry="1.8" className="fill-foreground" />
      {/* улыбка */}
      <path
        d="M43.5 48.5c1.3 2.2 7.7 2.2 9 0"
        className="stroke-foreground"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

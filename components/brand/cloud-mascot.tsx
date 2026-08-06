import { cn } from "@/lib/utils";

// Милый маскот-облачко с сердечком (декоративный). Цвета — из токенов бренда,
// меняются вместе с палитрой config/brand.ts. Смысла не несёт → aria-hidden.
export function CloudMascot({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 72 64"
      className={cn("text-accent", className)}
      aria-hidden
      focusable="false"
    >
      {/* сердечко над облачком */}
      <path
        className="fill-secondary"
        d="M50 4c-1.7 0-3.3.8-4.3 2.1C44.7 4.8 43.1 4 41.4 4c-2.8 0-5 2.2-5 5 0 3.7 4.6 6.7 8.6 9.4 4-2.7 8.6-5.7 8.6-9.4 0-2.8-2.2-5-4.6-5Z"
      />
      {/* пышное тело облачка (несколько долей) */}
      <path
        fill="currentColor"
        d="M22 60c-9.4 0-17-6.7-17-15 0-6.2 4.2-11.6 10.2-14C16.6 22.7 22.7 18 30 18c6.4 0 12 3.6 14.8 8.9 1.3-.5 2.7-.8 4.2-.8 6.6 0 12 5.1 12 11.4 0 .7-.1 1.4-.2 2C66.6 41.7 70 46 70 51c0 5-4.6 9-10.3 9H22Z"
      />
      {/* щёчки */}
      <circle cx="27" cy="44" r="3.2" className="fill-primary/30" />
      <circle cx="47" cy="44" r="3.2" className="fill-primary/30" />
      {/* глазки */}
      <circle cx="31" cy="40" r="2" className="fill-foreground" />
      <circle cx="43" cy="40" r="2" className="fill-foreground" />
      {/* улыбка */}
      <path
        d="M33 45c1.6 2 5.4 2 7 0"
        className="stroke-foreground"
        strokeWidth="1.7"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

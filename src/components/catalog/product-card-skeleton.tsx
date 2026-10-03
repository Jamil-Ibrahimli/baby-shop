import { Skeleton } from "@/components/ui/skeleton";

// Скелетон карточки — совпадает по раскладке с ProductCard (белая карточка,
// квадратное фото, текстовый блок с отступом), чтобы сетка не «прыгала» при загрузке.
export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="flex flex-col gap-2 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="mt-2 h-5 w-1/3" />
      </div>
    </div>
  );
}

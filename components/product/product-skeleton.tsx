import { Skeleton } from "@/components/ui/skeleton";

// Скелетон содержимого товара — fallback для Suspense (пока грузятся данные).
export function ProductSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="flex flex-col gap-3">
        {/* Та же рамка 2:1, что у галереи — иначе при загрузке страница дёргается. */}
        <Skeleton className="aspect-2/1 w-full rounded-2xl" />
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="size-16 rounded-lg" />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-9 w-32" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-24" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-16 rounded-full" />
            ))}
          </div>
        </div>
        <Skeleton className="h-11 w-full rounded-full sm:w-40" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    </div>
  );
}

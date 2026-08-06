import { Skeleton } from "@/components/ui/skeleton";
import { ProductCardSkeleton } from "./product-card-skeleton";

// Сетка скелетонов: fallback для Suspense и для loading.tsx.
export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div>
      <Skeleton className="mb-4 h-4 w-40" />
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-3">
        {Array.from({ length: count }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

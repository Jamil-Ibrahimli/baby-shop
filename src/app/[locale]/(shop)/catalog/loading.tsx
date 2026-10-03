import { Skeleton } from "@/components/ui/skeleton";
import { ProductGridSkeleton } from "@/components/catalog/product-grid-skeleton";

// Скелетон всей страницы каталога — показывается при переходе на маршрут.
export default function CatalogLoading() {
  return (
    <main className="mx-auto w-full max-w-site flex-1 px-4 py-8 sm:px-6">
      <div className="mb-6 space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[260px_1fr] lg:gap-8">
        <div className="hidden lg:block">
          <Skeleton className="h-[520px] w-full rounded-2xl" />
        </div>
        <ProductGridSkeleton />
      </div>
    </main>
  );
}

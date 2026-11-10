import { Skeleton } from "@/components/club-hub/ui";

/** Shown while the Wire's latest edition is being put together. */
export default function Loading() {
  return (
    <div className="min-h-screen bg-ink">
      <div className="h-[60px] border-b border-line" />
      <main className="mx-auto max-w-7xl space-y-10 px-4 pt-10 sm:px-6 lg:px-8" aria-busy aria-label="Loading the latest football news">
        <div className="space-y-4 border-b border-line pb-7">
          <Skeleton className="h-3 w-48" />
          <Skeleton className="h-14 w-80 max-w-full" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <Skeleton className="aspect-[16/9] w-full lg:aspect-auto lg:h-[30rem]" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        </div>
      </main>
    </div>
  );
}

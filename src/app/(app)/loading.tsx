import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-24 w-full max-w-xl" />
      <div className="flex max-w-xl flex-col gap-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    </main>
  );
}

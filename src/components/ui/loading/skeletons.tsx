import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function PageHeaderSkeleton() {
  return (
    <div className="flex items-start justify-between gap-3" data-loading="header" aria-hidden>
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <Skeleton className="h-10 w-32" />
    </div>
  );
}

export function MetricCardSkeleton() {
  return (
    <div className="space-y-2" data-loading="metric" aria-hidden>
      <Skeleton className="h-9 w-9 rounded-xl" />
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-3 w-28" />
    </div>
  );
}

export function MetricCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="metric-cards-grid" data-loading="metrics" aria-hidden>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="card"><MetricCardSkeleton /></div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div data-loading="table" aria-hidden>
      <Table>
        <TableHeader>
          <TableRow>
            {Array.from({ length: cols }).map((_, index) => (
              <TableHead key={index}><Skeleton className="h-3 w-14" /></TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, row) => (
            <TableRow key={row}>
              {Array.from({ length: cols }).map((_, col) => (
                <TableCell key={col}><Skeleton className="h-4 w-full max-w-[7.5rem]" /></TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function GridSkeleton({ count = 6, aspect = "4/5" }: { count?: number; aspect?: string }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6" data-loading="grid" aria-hidden>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-border bg-card p-2">
          <Skeleton className="w-full rounded-xl" style={{ aspectRatio: aspect }} />
          <Skeleton className="mt-3 h-4 w-3/4" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({ height = 240 }: { height?: number }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card" style={{ height }} data-loading="chart" aria-hidden>
      <svg viewBox="0 0 320 120" className="h-full w-full text-primary/35" preserveAspectRatio="none" aria-hidden>
        <polyline fill="none" stroke="currentColor" strokeWidth="2.5" points="0,96 36,78 72,84 108,52 144,60 180,34 216,42 252,24 288,30 320,18" />
        <polyline fill="none" stroke="hsl(30 95% 55% / 0.7)" strokeWidth="2" points="0,108 48,96 96,100 144,82 192,88 240,70 320,64" />
      </svg>
      <div className="adv-shimmer pointer-events-none absolute inset-0 opacity-70" />
    </div>
  );
}

export function CanvasStageSkeleton() {
  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-[hsl(var(--studio-bg,var(--background)))]" data-loading="canvas" aria-hidden>
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="adv-shimmer aspect-[4/5] w-[min(280px,72%)] rounded-xl border border-border" />
      </div>
      <div className="flex h-14 items-center justify-center gap-2 border-t border-border px-4">
        {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-8 w-8 rounded-lg" />)}
      </div>
    </div>
  );
}

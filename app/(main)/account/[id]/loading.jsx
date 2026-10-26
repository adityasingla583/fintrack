export default function AccountLoading() {
  return (
    <div className="space-y-8 px-4 sm:px-6 max-w-7xl mx-auto pb-12 animate-pulse">
      {/* Account Hero Skeleton */}
      <div className="h-28 rounded-2xl bg-muted/40 border border-border/40 p-6 flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted/60 rounded-md" />
          <div className="h-4 w-28 bg-muted/40 rounded-md" />
        </div>
        <div className="space-y-2 text-right">
          <div className="h-4 w-24 bg-muted/40 rounded-md ml-auto" />
          <div className="h-7 w-32 bg-muted/60 rounded-md ml-auto" />
        </div>
      </div>

      {/* Chart Skeleton */}
      <div className="h-80 rounded-xl bg-muted/40 border border-border/40" />

      {/* Table Skeleton */}
      <div className="space-y-3">
        <div className="h-10 rounded-lg bg-muted/40 border border-border/40" />
        <div className="h-64 rounded-xl bg-muted/30 border border-border/40" />
      </div>
    </div>
  );
}

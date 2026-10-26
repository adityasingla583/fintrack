import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="space-y-8 pb-10 animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="h-44 rounded-2xl bg-muted/40 border border-border/40" />

      {/* Overview Cards Skeleton */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="h-72 rounded-xl bg-muted/40 border border-border/40" />
        <div className="h-72 rounded-xl bg-muted/40 border border-border/40" />
      </div>

      {/* Accounts Grid Skeleton */}
      <div className="space-y-4">
        <div className="h-6 w-36 bg-muted/50 rounded-md" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="h-40 rounded-xl bg-muted/40 border border-border/40" />
          <div className="h-40 rounded-xl bg-muted/40 border border-border/40" />
          <div className="h-40 rounded-xl bg-muted/40 border border-border/40" />
        </div>
      </div>
    </div>
  );
}

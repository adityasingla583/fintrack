export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
        </div>
      </div>
      <p className="text-sm font-medium text-muted-foreground animate-pulse">
        Loading FinTrack...
      </p>
    </div>
  );
}

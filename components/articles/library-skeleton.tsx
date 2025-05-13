export function LibrarySkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="animate-pulse overflow-hidden rounded-lg border bg-card">
          {/* Image skeleton */}
          <div className="h-48 w-full bg-muted"></div>
          
          <div className="p-4 space-y-4">
            {/* Title skeleton */}
            <div className="h-6 w-3/4 rounded-md bg-muted"></div>
            
            {/* Excerpt skeleton */}
            <div className="space-y-2">
              <div className="h-4 w-full rounded-md bg-muted"></div>
              <div className="h-4 w-11/12 rounded-md bg-muted"></div>
            </div>
            
            {/* Metadata skeleton */}
            <div className="flex justify-between mt-4">
              <div className="h-4 w-20 rounded-md bg-muted"></div>
              <div className="h-4 w-16 rounded-md bg-muted"></div>
            </div>
            
            {/* Progress bar skeleton */}
            <div className="h-1 w-full rounded-full bg-muted mt-2"></div>
          </div>
        </div>
      ))}
    </div>
  );
} 
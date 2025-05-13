export function ArticleSkeleton() {
  return (
    <div className="container max-w-4xl py-10 animate-pulse">
      {/* Title skeleton */}
      <div className="mb-2 h-10 w-3/4 rounded-md bg-muted"></div>
      
      {/* Metadata skeleton */}
      <div className="mb-8 flex gap-2">
        <div className="h-4 w-20 rounded-md bg-muted"></div>
        <div className="h-4 w-4 rounded-full bg-muted"></div>
        <div className="h-4 w-24 rounded-md bg-muted"></div>
        <div className="h-4 w-4 rounded-full bg-muted"></div>
        <div className="h-4 w-16 rounded-md bg-muted"></div>
      </div>
      
      {/* Image skeleton */}
      <div className="mb-8 h-64 w-full rounded-lg bg-muted"></div>
      
      {/* Content paragraphs skeleton */}
      <div className="space-y-4">
        <div className="h-4 w-full rounded-md bg-muted"></div>
        <div className="h-4 w-full rounded-md bg-muted"></div>
        <div className="h-4 w-11/12 rounded-md bg-muted"></div>
        <div className="h-4 w-full rounded-md bg-muted"></div>
        <div className="h-4 w-4/5 rounded-md bg-muted"></div>
      </div>
      
      <div className="mt-6 space-y-4">
        <div className="h-4 w-full rounded-md bg-muted"></div>
        <div className="h-4 w-full rounded-md bg-muted"></div>
        <div className="h-4 w-10/12 rounded-md bg-muted"></div>
      </div>
      
      <div className="mt-6 space-y-4">
        <div className="h-4 w-full rounded-md bg-muted"></div>
        <div className="h-4 w-9/12 rounded-md bg-muted"></div>
        <div className="h-4 w-full rounded-md bg-muted"></div>
        <div className="h-4 w-11/12 rounded-md bg-muted"></div>
      </div>
    </div>
  );
} 
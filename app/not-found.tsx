import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container flex flex-col items-center justify-center py-20 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
        404 - Page Not Found
      </h1>
      <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
        Sorry, the page you are looking for does not exist or has been moved.
      </p>
      <div className="mt-8">
        <Button size="lg" asChild>
          <Link href="/">Go Home</Link>
        </Button>
      </div>
      <div className="mt-12 border rounded-lg p-6 max-w-xl w-full mx-auto bg-muted/20">
        <h2 className="text-xl font-semibold mb-2">Debug Info</h2>
        <p className="text-sm text-muted-foreground mb-4">
          This information might help diagnose routing issues:
        </p>
        <pre className="text-left text-sm bg-background p-4 rounded overflow-auto">
          {`Path: ${typeof window !== 'undefined' ? window.location.pathname : 'Server-rendered'}\n`}
          {`URL: ${typeof window !== 'undefined' ? window.location.href : 'Server-rendered'}\n`}
          {`UserAgent: ${typeof window !== 'undefined' ? window.navigator.userAgent : 'Server-rendered'}\n`}
          {`Timestamp: ${new Date().toISOString()}`}
        </pre>
      </div>
    </div>
  );
} 
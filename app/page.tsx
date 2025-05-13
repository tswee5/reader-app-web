import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="container flex flex-col items-center justify-center py-20 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
        Your personal reading companion
      </h1>
      <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
        Save articles, highlight important passages, take notes, and organize your reading with tags.
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <Button size="lg" asChild>
          <Link href="/signup">Get Started</Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/login">Sign In</Link>
        </Button>
      </div>
      <div className="mt-20 grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="flex flex-col items-center">
          <div className="mb-4 rounded-full bg-primary/10 p-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 text-primary"
            >
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold">Save Articles</h2>
          <p className="mt-2 text-center text-muted-foreground">
            Save articles from around the web for reading later, online or offline.
          </p>
        </div>
        <div className="flex flex-col items-center">
          <div className="mb-4 rounded-full bg-primary/10 p-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 text-primary"
            >
              <path d="m3 17 2 2 4-4" />
              <path d="m3 7 2 2 4-4" />
              <path d="M13 6h8" />
              <path d="M13 12h8" />
              <path d="M13 18h8" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold">Organize</h2>
          <p className="mt-2 text-center text-muted-foreground">
            Organize your reading with tags, highlights, and notes.
          </p>
        </div>
        <div className="flex flex-col items-center">
          <div className="mb-4 rounded-full bg-primary/10 p-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 text-primary"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold">AI Assistance</h2>
          <p className="mt-2 text-center text-muted-foreground">
            Get AI-powered summaries, explanations, and insights for your articles.
          </p>
        </div>
      </div>
    </div>
  );
}

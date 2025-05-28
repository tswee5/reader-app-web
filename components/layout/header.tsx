"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSupabase } from "@/components/providers/supabase-provider";
import { usePanelContext } from "@/components/providers/panel-provider";
import { UserMenu } from "@/components/layout/user-menu";

export function Header() {
  const { user } = useSupabase();
  const { showNotesPanel, showAIPanel, notesPanelWidth, aiPanelWidth } = usePanelContext();

  // Calculate the total width of open panels
  const totalPanelWidth = (showNotesPanel ? notesPanelWidth : 0) + (showAIPanel ? aiPanelWidth : 0);

  return (
    <header className="border-b">
      <div 
        className="container flex h-16 items-center justify-between transition-all duration-300"
        style={{
          marginRight: totalPanelWidth > 0 ? `${totalPanelWidth}px` : '0px'
        }}
      >
        <Link href="/" className="font-bold text-xl">
          Reader App
        </Link>
        <nav className="flex items-center gap-4">
          {user ? (
            <>
              <Button variant="ghost" asChild>
                <Link href="/library">My Library</Link>
              </Button>
              <UserMenu user={user} />
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
} 
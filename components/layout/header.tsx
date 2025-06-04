"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSupabase } from "@/components/providers/supabase-provider";
import { usePanelContext } from "@/components/providers/panel-provider";
import { UserMenu } from "@/components/layout/user-menu";

export function Header() {
  const { user } = useSupabase();
  const { showNotesPanel, showAIPanel, notesPanelWidth, aiPanelWidth } = usePanelContext();

  // Calculate the width of the open panel (only one can be open at a time)
  const panelWidth = showNotesPanel ? notesPanelWidth : showAIPanel ? aiPanelWidth : 0;

  // Simple calculation: maintain 2px margin from panel's left edge
  const buttonOffset = panelWidth > 0 ? panelWidth - 2 : 0;

  // Debug logging
  console.log('Header Debug:', {
    showNotesPanel,
    showAIPanel,
    notesPanelWidth,
    aiPanelWidth,
    panelWidth,
    buttonOffset
  });

  return (
    <header className="border-b bg-background">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="dashboard-header">
          Reader App
        </Link>
        <nav 
          className="flex items-center gap-4 transition-all duration-300"
          style={{
            marginRight: buttonOffset > 0 ? `${buttonOffset}px` : '0px',
          }}
        >
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
"use client";

import React, { createContext, useContext, ReactNode } from "react";

interface DemoSupabaseContextType {
  supabase: any;
  user: any;
}

const DemoSupabaseContext = createContext<DemoSupabaseContextType | undefined>(undefined);

interface DemoSupabaseProviderProps {
  children: ReactNode;
  demoUser: any;
  onCreateHighlight: (content: string, startPos: number, endPos: number, color: string) => Promise<any>;
}

export function DemoSupabaseProvider({ 
  children, 
  demoUser,
  onCreateHighlight 
}: DemoSupabaseProviderProps) {
  // Mock Supabase client for demo
  const mockSupabase = {
    from: (table: string) => ({
      insert: (data: any) => ({
        select: () => ({
          single: async () => {
            if (table === 'highlights') {
              // Call the demo highlight creation function
              return onCreateHighlight(
                data.content,
                data.text_position_start,
                data.text_position_end,
                data.color
              );
            }
            return { data: null, error: new Error("Demo mode - database not available") };
          }
        })
      })
    })
  };

  const value: DemoSupabaseContextType = {
    supabase: mockSupabase,
    user: demoUser,
  };

  return (
    <DemoSupabaseContext.Provider value={value}>
      {children}
    </DemoSupabaseContext.Provider>
  );
}

export function useDemoSupabase() {
  const context = useContext(DemoSupabaseContext);
  if (context === undefined) {
    throw new Error("useDemoSupabase must be used within a DemoSupabaseProvider");
  }
  return context;
} 
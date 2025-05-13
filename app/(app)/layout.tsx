import { SupabaseProvider } from "@/components/providers/supabase-provider";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SupabaseProvider>
      {children}
    </SupabaseProvider>
  );
} 
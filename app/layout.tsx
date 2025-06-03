import type { Metadata } from "next";
import { inter, literata, merriweather, sourceSerif } from "./fonts";
import "./globals.css";
import "./styles.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { SupabaseProvider } from "@/components/providers/supabase-provider";
import { PanelProvider } from "@/components/providers/panel-provider";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Reader App",
  description: "A modern web application for tracking, engaging with, and learning from your reading content.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html 
      lang="en" 
      suppressHydrationWarning
      className={`${inter.variable} ${literata.variable} ${merriweather.variable} ${sourceSerif.variable}`}
    >
      <body className={`${inter.className} bg-background`}>
        <SupabaseProvider>
          <PanelProvider>
            <div className="flex min-h-screen flex-col bg-background">
              <Header />
              <main className="flex-1 bg-background">{children}</main>
              <Footer />
            </div>
            <Toaster />
          </PanelProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}

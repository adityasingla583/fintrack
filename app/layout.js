import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Header from "@/components/header";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { PostReloadToast } from "@/components/post-reload-toast";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata = {
  title: "FinTrack — Smart Personal Finance & Wealth Management",
  description: "Modern, AI-powered financial tracker for intelligent budgeting, real-time analytics, and automated reporting.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning className={jakarta.variable}>
        <body className="min-h-screen flex flex-col bg-background font-sans antialiased selection:bg-primary/20 selection:text-primary">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {/* Header */}
            <Header />

            {/* Main Content: pt-16 gives balanced breathing room below fixed header */}
            <main className="flex-1 pt-16 pb-12">
              {children}
              <Toaster richColors position="top-right" />
              <PostReloadToast />
            </main>

            {/* Sticky/Bottom-Pushed Footer */}
            <footer className="mt-auto border-t border-border/50 bg-muted/20 py-8 backdrop-blur-sm">
              <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-md bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    F
                  </div>
                  <span className="font-semibold text-foreground text-sm tracking-tight">
                    FinTrack
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  © {new Date().getFullYear()} FinTrack. All rights reserved. Intelligent wealth management.
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Privacy</span>
                  <span>•</span>
                  <span>Terms</span>
                  <span>•</span>
                  <span>Security</span>
                </div>
              </div>
            </footer>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

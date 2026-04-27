import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Marshal LMS",
  description: "Next-Generation Learning Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen font-sans selection:bg-primary/20 selection:text-primary relative`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground focus:shadow-lg"
          >
            Skip to main content
          </a>
          <div className="fixed inset-0 pointer-events-none -z-50 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary))_0%,transparent_48%)] opacity-[0.08]" />
          <div className="fixed inset-0 pointer-events-none -z-50 bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:22px_22px] opacity-30" />

          {children}
          
          <Toaster closeButton position="bottom-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}

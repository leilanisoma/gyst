import type { Metadata, Viewport } from "next";
import { Fredoka, Geist_Mono, Playfair_Display, Quicksand } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";
import { DayPeriodProvider } from "@/components/theme/day-period-provider";

// Cozy-game aesthetic pass (Phase 9D, 2026-07-20): a rounded display font
// for headings/titles, a rounded but still-legible one for body/UI text —
// replaces Geist Sans, which read too SaaS-neutral for the room art.
const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
});

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
});

// Night's moodier heading font (2026-07-20) — swapped in for `.font-heading`
// only at night via a `[data-day-period="night"]` rule in globals.css;
// Fredoka stays the heading font for dawn/day/dusk.
const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "gyst",
  description: "A private, single-user command center.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "gyst",
  },
};

export const viewport: Viewport = {
  themeColor: "#b0563a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-day-period="day"
      className={`${fredoka.variable} ${quicksand.variable} ${playfairDisplay.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <DayPeriodProvider />
        {children}
        <Toaster />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}

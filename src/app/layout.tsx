export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { Figtree, Playfair_Display } from "next/font/google";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

export const metadata: Metadata = {
  title: "RIACT — Study Tracking",
  description: "Record, Insight, Analyze, Coach, Track your study sessions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${figtree.variable} ${playfair.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">{children}</body>
    </html>
  );
}

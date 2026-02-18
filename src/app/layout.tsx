import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Changed to Inter for a cleaner look, or keep Geist if preferred. 
// Let's stick to Geist as it was default, but the user asked for "minimal & clean". Geist is fine.
// Actually, let's keep the existing font setup to avoid errors if I don't install Inter, 
// though next/font/google allows importing it easily. I will stick to what was there (Geist).
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "My Developer Blog",
  description: "A blog about development and learning.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50`}
        suppressHydrationWarning
      >
        <Header />
        <main className="container mx-auto px-4 max-w-2xl mb-16">
          {children}
        </main>
      </body>
    </html>
  );
}

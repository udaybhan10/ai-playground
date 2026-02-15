import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Playground",
  description: "Local AI Playground inspired by Sarvam AI",
};

import { Sidebar } from "@/components/ui/Sidebar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex h-screen bg-gray-950 text-gray-100`}
      >
        <Sidebar />
        <main className="flex-1 overflow-y-auto w-full">
          <div className="container mx-auto p-6 md:p-12">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}

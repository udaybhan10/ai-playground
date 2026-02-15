"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/ui/Sidebar";
import { VoiceModeOverlay } from "@/components/VoiceModeOverlay";
import { useState, useEffect } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [voiceModeOpen, setVoiceModeOpen] = useState(false);
  const [voiceSessionId, setVoiceSessionId] = useState<number | null>(null);

  useEffect(() => {
    const handleToggle = (event: any) => {
      const sessionId = event.detail?.sessionId || null;
      setVoiceSessionId(sessionId);
      setVoiceModeOpen(prev => !prev);
    };
    window.addEventListener('toggleVoiceMode', handleToggle);
    return () => window.removeEventListener('toggleVoiceMode', handleToggle);
  }, []);

  return (
    <html lang="en">
      <head>
        <title>AI Playground</title>
        <meta name="description" content="Local AI Playground inspired by Sarvam AI" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex h-screen bg-gray-950 text-gray-100`}
      >
        <Sidebar />
        <main className="flex-1 overflow-y-auto w-full">
          <div className="container mx-auto p-6 md:p-12">
            {children}
          </div>
        </main>
        <VoiceModeOverlay
          isOpen={voiceModeOpen}
          onClose={() => setVoiceModeOpen(false)}
          initialSessionId={voiceSessionId}
        />
      </body>
    </html>
  );
}

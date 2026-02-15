"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Eye,
  Mic,
  MessageSquare,
  Languages,
  Speaker,
  Menu,
  X,
  Sparkles
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ChatSession } from "@/types/chat";
import { useRouter, useSearchParams } from "next/navigation";
import { Trash2 } from "lucide-react";

const sidebarItems = [
  { name: "Chat", href: "/chat", icon: MessageSquare },
  { name: "Vision", href: "/vision", icon: Eye },
  { name: "TTS", href: "/tts", icon: Speaker },
  { name: "STT", href: "/stt", icon: Mic },
  { name: "Translate", href: "/translate", icon: Languages },
  { name: "Voice", href: "/voice", icon: Mic },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSessionId = searchParams.get("session_id") ? parseInt(searchParams.get("session_id")!) : null;

  const [isOpen, setIsOpen] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  useEffect(() => {
    fetchSessions();
  }, [pathname, searchParams]);

  const fetchSessions = async () => {
    let url = "http://localhost:8000/api/chat/sessions";
    if (pathname.startsWith('/vision')) url = "http://localhost:8000/api/vision/history";
    else if (pathname.startsWith('/tts')) url = "http://localhost:8000/api/tts/history";
    else if (pathname.startsWith('/stt')) url = "http://localhost:8000/api/stt/history";
    else if (pathname.startsWith('/translate')) url = "http://localhost:8000/api/translate/history";
    else if (pathname.startsWith('/voice')) url = "http://localhost:8000/api/voice/sessions";

    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        // Normalize data to session format if needed, or handle in render
        // For simplicity, we assume backend returns list of objects with id.
        // We might need to map 'text' or 'summary' to 'title' for display.
        const formattedData = data.map((item: any) => ({
          id: item.id,
          title: item.title || item.prompt || item.text || item.source_text || item.transcript || item.user_text || "Untitled",
          created_at: item.created_at
        }));
        setSessions(formattedData);
      } else {
        setSessions([]);
      }
    } catch (error) {
      console.error("Failed to fetch history:", error);
      setSessions([]);
    }
  };

  const handleDeleteSession = async (id: number) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    let url = `http://localhost:8000/api/chat/sessions/${id}`;
    if (pathname.startsWith('/vision')) url = `http://localhost:8000/api/vision/history/${id}`;
    else if (pathname.startsWith('/tts')) url = `http://localhost:8000/api/tts/history/${id}`;
    else if (pathname.startsWith('/stt')) url = `http://localhost:8000/api/stt/history/${id}`;
    else if (pathname.startsWith('/translate')) url = `http://localhost:8000/api/translate/history/${id}`;
    else if (pathname.startsWith('/voice')) url = `http://localhost:8000/api/voice/sessions/${id}`;

    try {
      await fetch(url, { method: "DELETE" });
      setSessions(prev => prev.filter(s => s.id !== id));

      // Clear query param if deleted item was selected
      if (currentSessionId === id) {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("session_id");
        router.push(`${pathname}?${params.toString()}`);
      }
    } catch (error) {
      console.error("Failed to delete item:", error);
    }
  };

  return (
    <>
      {/* Mobile Menu Button - Floating Glass */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2.5 bg-black/50 backdrop-blur-md text-white rounded-xl border border-white/10 shadow-lg"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Menu"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar Container */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-72 transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1)",
          "bg-black/80 backdrop-blur-xl border-r border-white/10 shadow-2xl",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "md:relative md:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full p-6 relative overflow-hidden">
          {/* Decorative background glow */}
          <div className="absolute top-0 left-0 w-full h-64 bg-primary/20 blur-[100px] -z-10 rounded-full pointer-events-none" />

          {/* Logo Section */}
          {/* Logo Section */}
          <Link href="/" className="mb-10 mt-2 flex items-center space-x-3 group cursor-pointer transition-transform hover:scale-105 duration-200">
            <div className="p-2 bg-gradient-to-tr from-primary to-purple-600 rounded-lg shadow-lg shadow-primary/30 group-hover:shadow-primary/50 transition-shadow duration-300">
              <Sparkles className="text-white w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 group-hover:from-white group-hover:to-white transition-all duration-300">
              AI Playground
            </h1>
          </Link>

          <nav className="space-y-2 mb-8">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="relative group block"
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-xl border border-white/5"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                  <span
                    className={cn(
                      "relative flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-300",
                      isActive
                        ? "text-white font-medium shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <Icon size={20} className={cn("transition-colors", isActive ? "text-primary" : "text-gray-500 group-hover:text-gray-300")} />
                    <span>{item.name}</span>

                    {/* Active Indicator Dot */}
                    {isActive && (
                      <span className="absolute right-4 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_currentColor]" />
                    )}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* History Section */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            <div className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex justify-between items-center">
              <span>
                {pathname.startsWith('/chat') || pathname === '/' ? 'Recent Chats' :
                  pathname.startsWith('/vision') ? 'Vision History' :
                    pathname.startsWith('/tts') ? 'TTS History' :
                      pathname.startsWith('/voice') ? 'Voice Chats' : 'History'}
              </span>
              {(pathname.startsWith('/chat') || pathname === '/') && (
                <button
                  onClick={() => router.push('/chat')}
                  className="text-primary hover:text-white transition-colors"
                  title="New Chat"
                >
                  <Sparkles size={12} />
                </button>
              )}
              {pathname.startsWith('/voice') && (
                <button
                  onClick={() => {
                    const event = new CustomEvent('toggleVoiceMode', { detail: { sessionId: null } });
                    window.dispatchEvent(event);
                  }}
                  className="text-orange-500 hover:text-orange-400 transition-colors"
                  title="Start New Voice Chat"
                >
                  <Mic size={12} />
                </button>
              )}
            </div>

            {sessions.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-600 text-sm">
                {pathname.startsWith('/chat') || pathname === '/' ? 'No recent chats' : 'No history found'}
              </div>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  className={cn(
                    "group relative flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all",
                    currentSessionId === session.id
                      ? pathname.startsWith('/voice')
                        ? "bg-gradient-to-r from-orange-500/20 to-red-500/20 text-white border border-orange-500/30"
                        : "bg-white/10 text-white"
                      : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                  )}
                  onClick={() => {
                    if (pathname.startsWith('/vision')) router.push(`/vision?session_id=${session.id}`);
                    else if (pathname.startsWith('/tts')) router.push(`/tts?session_id=${session.id}`);
                    else if (pathname.startsWith('/stt')) router.push(`/stt?session_id=${session.id}`);
                    else if (pathname.startsWith('/translate')) router.push(`/translate?session_id=${session.id}`);
                    else if (pathname.startsWith('/voice')) router.push(`/voice?session_id=${session.id}`);
                    else router.push(`/chat?session_id=${session.id}`);
                  }}
                >
                  <div className="flex items-center space-x-2 truncate max-w-[180px]">
                    {pathname.startsWith('/voice') ? (
                      <Mic size={14} className={currentSessionId === session.id ? "text-orange-500" : "text-gray-600"} />
                    ) : (
                      <MessageSquare size={14} className={currentSessionId === session.id ? "text-primary" : "text-gray-600"} />
                    )}
                    <span className="truncate text-sm">{session.title}</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSession(session.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="mt-auto pt-6 border-t border-white/5">
            <div className="flex items-center space-x-3 text-xs text-gray-500 p-2 rounded-lg bg-white/5 border border-white/5">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span>Systems Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-30 md:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

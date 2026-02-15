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
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const sidebarItems = [
  { name: "Chat", href: "/chat", icon: MessageSquare },
  { name: "Vision", href: "/vision", icon: Eye },
  { name: "TTS", href: "/tts", icon: Speaker },
  { name: "STT", href: "/stt", icon: Mic },
  { name: "Translate", href: "/translate", icon: Languages },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

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

          <nav className="flex-1 space-y-2">
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

import { ArrowRight, Sparkles, MessageSquare, Eye, Volume2, Mic, Languages } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-12 text-center relative overflow-hidden">

      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 blur-[120px] rounded-full point-events-none -z-10" />

      <div className="space-y-6 max-w-3xl relative z-10">
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-sm text-gray-300 mb-4 animate-[fade-in_1s_ease-out]">
          <Sparkles size={14} className="text-yellow-400" />
          <span>AI Playground v2.0</span>
        </div>

        <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight">
          <span className="bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 bg-clip-text text-transparent drop-shadow-lg">
            Cosmic Intelligence
          </span>
        </h1>

        <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Experience the future of local AI. Integrated tools for Vision, Speech, and Language in a stunning glass interface.
        </p>

        <div className="flex items-center justify-center space-x-4 pt-4">
          <Link href="/chat" className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl font-bold text-white shadow-lg hover:shadow-blue-500/25 hover:scale-105 transition-all flex items-center space-x-2 group">
            <span>Start Chatting</span>
            <ArrowRight className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <a href="https://github.com/udaybhan10/ai-playground.git" target="_blank" rel="noopener noreferrer" className="px-8 py-4 bg-white/5 border border-white/10 rounded-xl font-bold text-gray-300 hover:bg-white/10 hover:text-white transition-all">
            View on GitHub
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl mt-16 px-4">
        {[
          {
            title: "Smart Chat",
            desc: "Interact with advanced local LLMs like Llama 3.2",
            href: "/chat",
            icon: <MessageSquare className="text-blue-400" />,
            color: "group-hover:text-blue-400",
            bg: "group-hover:border-blue-500/50"
          },
          {
            title: "Computer Vision",
            desc: "Analyze and understand images locally",
            href: "/vision",
            icon: <Eye className="text-purple-400" />,
            color: "group-hover:text-purple-400",
            bg: "group-hover:border-purple-500/50"
          },
          {
            title: "Text to Speech",
            desc: "Generate lifelike speech using Kokoro",
            href: "/tts",
            icon: <Volume2 className="text-emerald-400" />,
            color: "group-hover:text-emerald-400",
            bg: "group-hover:border-emerald-500/50"
          },
          {
            title: "Speech to Text",
            desc: "Transcribe audio with high accuracy",
            href: "/stt",
            icon: <Mic className="text-orange-400" />,
            color: "group-hover:text-orange-400",
            bg: "group-hover:border-orange-500/50"
          },
          {
            title: "Translation",
            desc: "Break language barriers instantly",
            href: "/translate",
            icon: <Languages className="text-pink-400" />,
            color: "group-hover:text-pink-400",
            bg: "group-hover:border-pink-500/50"
          },
        ].map((item, i) => (
          <Link
            key={item.href}
            href={item.href}
            className={`
                glass-card p-6 border border-white/5 hover:border-white/20 transition-all duration-300 group
                flex flex-col items-start text-left space-y-4 hover:-translate-y-1 hover:shadow-xl
                relative overflow-hidden
            `}
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-10 transition-opacity" />

            <div className="p-3 bg-gray-900/50 rounded-lg border border-white/5 group-hover:scale-110 transition-transform duration-300">
              {item.icon}
            </div>

            <div>
              <h3 className={`text-xl font-bold mb-1 text-gray-100 transition-colors ${item.color}`}>
                {item.title}
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                {item.desc}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { Send, User, Bot, Loader2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Message {
    role: "user" | "assistant";
    content: string;
}

interface ChatInterfaceProps {
    initialModel?: string;
}

export function ChatInterface({ initialModel = "llama3.2" }: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [model, setModel] = useState(initialModel);
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Fetch available models
        fetch("http://localhost:8000/api/models")
            .then((res) => res.json())
            .then((data) => {
                if (data && data.models) {
                    const modelNames = data.models.map((m: any) => m.model);
                    setAvailableModels(modelNames);
                    if (modelNames.length > 0 && !modelNames.includes(model)) {
                        setModel(modelNames[0]);
                    }
                }
            })
            .catch((err) => console.error("Failed to fetch models:", err));
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { role: "user", content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            // Prepare context from previous messages
            const contextMessages = [...messages, userMessage].map(m => ({
                role: m.role,
                content: m.content
            }));

            const response = await fetch("http://localhost:8000/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: model,
                    messages: contextMessages,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to get response");
            }

            const data = await response.json();
            const aiMessage: Message = { role: "assistant", content: data.message.content };
            setMessages((prev) => [...prev, aiMessage]);
        } catch (error) {
            console.error("Chat error:", error);
            const errorMessage: Message = { role: "assistant", content: "Sorry, I encountered an error. Please make sure the backend is running and Ollama is installed." };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] relative">

            {/* Main Chat Container */}
            <div className="flex-1 glass-card flex flex-col overflow-hidden relative">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />

                {/* Header */}
                <div className="p-4 border-b border-white/5 bg-white/5 backdrop-blur-md flex justify-between items-center z-10">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary/20 rounded-lg">
                            <Bot className="text-primary w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-white">Ollama Chat</h2>
                            <p className="text-xs text-gray-400">Local AI Assistant</p>
                        </div>
                    </div>

                    <div className="relative">
                        <select
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            className="bg-gray-900/50 text-white border border-white/10 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 appearance-none pr-8 cursor-pointer hover:bg-gray-800/50 transition-colors"
                        >
                            {availableModels.length > 0 ? (
                                availableModels.map((m, idx) => (
                                    <option key={`${m}-${idx}`} value={m} className="bg-gray-900">{m}</option>
                                ))
                            ) : (
                                <option value={initialModel} className="bg-gray-900">{initialModel} (Default)</option>
                            )}
                        </select>
                        <div className="absolute top-1/2 right-2 transform -translate-y-1/2 pointer-events-none text-gray-400">
                            <Sparkles size={12} />
                        </div>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                    {messages.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center justify-center h-full text-center space-y-6"
                        >
                            <div className="w-24 h-24 bg-gradient-to-tr from-primary/20 to-purple-500/20 rounded-full flex items-center justify-center mb-4 ring-1 ring-white/10 shadow-[0_0_50px_rgba(99,102,241,0.2)]">
                                <Bot size={48} className="text-primary/80" />
                            </div>
                            <div className="space-y-2 max-w-md">
                                <h3 className="text-2xl font-bold text-white">How can I help you today?</h3>
                                <p className="text-gray-400">I'm your local AI assistant running on Ollama. I can help with coding, analysis, writing, and more.</p>
                            </div>
                        </motion.div>
                    ) : (
                        messages.map((msg, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.3 }}
                                className={`flex items-start ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={cn(
                                        "flex max-w-[85%] rounded-2xl p-5 shadow-lg backdrop-blur-sm border",
                                        msg.role === "user"
                                            ? "bg-gradient-to-br from-primary to-blue-600 text-white border-primary/20 rounded-tr-sm"
                                            : "bg-gray-800/80 text-gray-100 border-white/5 rounded-tl-sm"
                                    )}
                                >
                                    {msg.role !== 'user' && (
                                        <div className="mr-4 mt-1 flex-shrink-0 p-1 bg-white/5 rounded-lg">
                                            <Bot size={16} className="text-primary" />
                                        </div>
                                    )}
                                    <div className="prose prose-invert prose-sm max-w-none leading-relaxed">
                                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                                    </div>
                                    {msg.role === 'user' && (
                                        <div className="ml-4 mt-1 flex-shrink-0">
                                            <User size={18} className="text-white/80" />
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))
                    )}
                    {isLoading && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex justify-start"
                        >
                            <div className="bg-gray-800/50 border border-white/5 rounded-2xl rounded-tl-none p-4 flex items-center space-x-3 backdrop-blur-sm">
                                <Bot size={18} className="text-primary animate-pulse" />
                                <div className="flex space-x-1">
                                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-gray-900/50 backdrop-blur-md border-t border-white/5">
                    <form onSubmit={handleSubmit} className="flex space-x-3 relative">
                        <div className="relative flex-1 group">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Type your message..."
                                className="w-full bg-gray-900/50 text-white border border-gray-700/50 rounded-xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all placeholder:text-gray-500 shadow-inner"
                                disabled={isLoading}
                            />
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none -z-10 blur-md" />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className={cn(
                                "p-3.5 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg",
                                isLoading || !input.trim()
                                    ? "bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700"
                                    : "bg-gradient-to-br from-primary to-blue-600 text-white hover:scale-105 hover:shadow-primary/25 border border-white/10"
                            )}
                        >
                            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

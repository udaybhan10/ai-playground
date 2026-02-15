"use client";

import { useState, useEffect, useRef } from "react";
import { Send, User, Bot, Loader2, Sparkles, Paperclip, X, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Message {
    role: "user" | "assistant";
    content: string;
}

import { useRouter, useSearchParams } from "next/navigation";

interface ChatInterfaceProps {
    initialModel?: string;
}

export function ChatInterface({ initialModel = "llama3.2" }: ChatInterfaceProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const sessionIdParam = searchParams.get("session_id");
    const sessionId = sessionIdParam ? parseInt(sessionIdParam) : null;

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [model, setModel] = useState(initialModel);
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // RAG state
    const [uploadedDoc, setUploadedDoc] = useState<{ id: string, name: string } | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch history when sessionId changes
    useEffect(() => {
        if (sessionId) {
            fetch(`http://localhost:8000/api/chat/sessions/${sessionId}`)
                .then(res => {
                    if (res.ok) return res.json();
                    throw new Error("Failed to fetch session");
                })
                .then(data => {
                    setMessages(data.messages);
                })
                .catch(err => {
                    console.error(err);
                    router.push("/chat"); // Redirect if session not found
                });
        } else {
            setMessages([]);
        }
    }, [sessionId]);

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

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.pdf') && !file.name.endsWith('.txt') && !file.name.endsWith('.md')) {
            alert('Only PDF, TXT, and MD files are supported');
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', file.name);

        try {
            const res = await fetch('http://localhost:8000/api/rag/upload', {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                setUploadedDoc({ id: data.doc_id, name: data.filename });
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `✅ Document "${data.filename}" uploaded successfully! You can now ask questions about it.`
                }]);
            } else {
                throw new Error('Upload failed');
            }
        } catch (err) {
            console.error('Upload error:', err);
            alert('Failed to upload document');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { role: "user", content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            // Use RAG endpoint if document is uploaded
            if (uploadedDoc) {
                setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

                const response = await fetch("http://localhost:8000/api/rag/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        message: input,
                        doc_id: uploadedDoc.id,
                        model: model
                    })
                });

                const data = await response.json();
                setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1].content = data.message;
                    return updated;
                });
                setIsLoading(false);
                return;
            }

            // Prepare context from previous messages
            const contextMessages = [...messages, userMessage].map(m => ({
                role: m.role,
                content: m.content
            }));

            // Initial empty assistant message
            setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

            const response = await fetch("http://localhost:8000/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: model,
                    messages: contextMessages,
                    session_id: sessionId
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to get response");
            }

            if (!response.body) {
                throw new Error("ReadableStream not yet supported in this browser.");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedContent = "";
            let isFirstChunk = true;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });

                // Check for session_id in the first chunk if we are in a new chat
                if (isFirstChunk && !sessionId) {
                    try {
                        const lines = chunk.split("\n");
                        // The backend sends {"session_id": ...}\n<content>
                        if (lines.length > 0 && lines[0].trim().startsWith("{")) {
                            const parsed = JSON.parse(lines[0]);
                            if (parsed.session_id) {
                                router.push(`/chat?session_id=${parsed.session_id}`, { scroll: false });

                                // Reset accumulated content to exclude the JSON line
                                accumulatedContent = "";
                                // Add remaining lines (actual content)
                                const remaining = lines.slice(1).join("\n");
                                accumulatedContent += remaining;
                                isFirstChunk = false;

                                setMessages((prev) => {
                                    const newMessages = [...prev];
                                    const lastMessage = newMessages[newMessages.length - 1];
                                    if (lastMessage.role === "assistant") {
                                        lastMessage.content = accumulatedContent;
                                    }
                                    return newMessages;
                                });
                                continue;
                            }
                        }
                    } catch (e) {
                        // ignore
                    }
                }

                if (isFirstChunk) {
                    accumulatedContent += chunk;
                    isFirstChunk = false;
                } else {
                    accumulatedContent += chunk;
                }

                setMessages((prev) => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage.role === "assistant") {
                        lastMessage.content = accumulatedContent;
                    }
                    return newMessages;
                });
            }
        } catch (error) {
            console.error("Chat error:", error);
            const errorMessage: Message = { role: "assistant", content: "Sorry, I encountered an error. Please make sure the backend is running and Ollama is installed." };
            // Replace the last empty assistant message with error if it exists, or add new
            setMessages((prev) => {
                const newMessages = [...prev];
                if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === "assistant" && newMessages[newMessages.length - 1].content === "") {
                    newMessages[newMessages.length - 1] = errorMessage;
                    return newMessages;
                }
                return [...prev, errorMessage];
            });
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
                    {/* Uploaded Document Indicator */}
                    {uploadedDoc && (
                        <div className="mb-3 flex items-center justify-between px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-lg">
                            <div className="flex items-center space-x-2">
                                <FileText size={16} className="text-green-400" />
                                <span className="text-sm text-green-300">{uploadedDoc.name}</span>
                            </div>
                            <button
                                onClick={() => setUploadedDoc(null)}
                                className="p-1 hover:bg-red-500/20 rounded transition-colors"
                            >
                                <X size={14} className="text-red-400" />
                            </button>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex space-x-3 relative">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className={cn(
                                "p-3.5 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg border",
                                isUploading
                                    ? "bg-gray-800 text-gray-500 cursor-not-allowed border-gray-700"
                                    : "bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border-gray-700 hover:border-primary/50"
                            )}
                            title="Upload Document (PDF, TXT, MD)"
                        >
                            {isUploading ? <Loader2 size={20} className="animate-spin" /> : <Paperclip size={20} />}
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.txt,.md"
                            onChange={handleFileUpload}
                            className="hidden"
                        />

                        <div className="relative flex-1 group">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={uploadedDoc ? "Ask about the document..." : "Type your message..."}
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

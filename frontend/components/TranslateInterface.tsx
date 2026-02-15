"use client";

import { useState, useEffect } from "react";
import { Languages, ArrowRight, Loader2, Copy, Check, Sparkles, Globe } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function TranslateInterface() {
    const [text, setText] = useState("");
    const [targetLang, setTargetLang] = useState("Spanish");
    const [translation, setTranslation] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [model, setModel] = useState("llama3.2-vision:latest");
    const [copied, setCopied] = useState(false);
    const [availableModels, setAvailableModels] = useState<string[]>([]);

    useEffect(() => {
        // Fetch available models
        fetch("http://localhost:8000/api/models")
            .then((res) => res.json())
            .then((data) => {
                if (data && data.models) {
                    const modelNames = data.models.map((m: any) => m.model);
                    setAvailableModels(modelNames);
                    if (modelNames.length > 0) {
                        setModel(modelNames[0]);
                    }
                }
            })
            .catch((err) => console.error("Failed to fetch models:", err));
    }, []);
    // Common languages for demo
    const languages = [
        "Spanish", "French", "German", "Italian", "Portuguese",
        "Russian", "Japanese", "Chinese", "Hindi", "Arabic"
    ];

    const handleTranslate = async () => {
        if (!text.trim() || isLoading) return;

        setIsLoading(true);
        setTranslation("");

        try {
            const response = await fetch("http://localhost:8000/api/translate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    text: text,
                    target_lang: targetLang,
                    model: model
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || "Translation failed");
            }

            const data = await response.json();
            // Ollama response structure
            if (data.message && data.message.content) {
                setTranslation(data.message.content);
            } else {
                setTranslation("No translation received.");
            }

        } catch (error: any) {
            console.error("Translation error:", error);
            setTranslation(`Error: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(translation);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-[calc(100vh-120px)] relative">
            {/* Background elements */}
            <div className="absolute top-1/2 left-0 w-full h-full bg-gradient-to-r from-blue-500/5 to-purple-500/5 -z-10 pointer-events-none" />
            <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-blue-500/10 blur-[100px] rounded-full point-events-none -z-10" />

            {/* Scale-in animation for container */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col space-y-4"
            >
                <div className="glass-card p-4 rounded-b-none border-b-0 flex justify-between items-center bg-gray-900/40">
                    <div className="flex items-center space-x-2">
                        <div className="p-1.5 bg-gray-700/50 rounded-lg">
                            <Languages size={16} className="text-gray-300" />
                        </div>
                        <span className="text-gray-300 font-medium text-sm">Original Text</span>
                    </div>

                    <div className="relative">
                        <select
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            className="bg-gray-800/50 text-gray-300 text-xs border border-gray-700/50 rounded-lg pl-3 pr-7 py-1.5 outline-none appearance-none hover:bg-gray-800 transition-colors"
                        >
                            {availableModels.length > 0 ? (
                                availableModels.map((m) => (
                                    <option key={m} value={m} className="bg-gray-900">{m}</option>
                                ))
                            ) : (
                                <option value="llama3.2-vision:latest" className="bg-gray-900">Default</option>
                            )}
                        </select>
                        <div className="absolute top-1/2 right-2 transform -translate-y-1/2 pointer-events-none text-gray-500">
                            <span className="text-[10px]">▼</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 relative group">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="w-full h-full bg-gray-900/50 text-white p-6 rounded-2xl rounded-t-none resize-none border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-lg placeholder:text-gray-600 transition-all shadow-inner"
                        placeholder="Enter text to translate..."
                    />
                    {/* Hover glow effect */}
                    <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl rounded-t-none" />
                </div>
            </motion.div>

            {/* Action Button (Desktop: absolute center, Mobile: relative in flow) */}
            <div className="hidden md:flex absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                <button
                    onClick={handleTranslate}
                    disabled={isLoading || !text.trim()}
                    className={cn(
                        "p-4 rounded-full shadow-2xl transition-all duration-300 border border-white/10 backdrop-blur-md group",
                        isLoading || !text.trim()
                            ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                            : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:scale-110 hover:shadow-blue-500/40"
                    )}
                >
                    {isLoading ? <Loader2 className="animate-spin" /> : <ArrowRight className="group-hover:translate-x-1 transition-transform" />}
                </button>
            </div>

            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex flex-col space-y-4"
            >
                <div className="glass-card p-4 rounded-b-none border-b-0 flex justify-between items-center bg-gray-900/40">
                    <div className="flex items-center space-x-3">
                        <span className="text-gray-400 font-medium text-sm">Translate to:</span>
                        <div className="relative">
                            <select
                                value={targetLang}
                                onChange={(e) => setTargetLang(e.target.value)}
                                className="bg-blue-500/10 text-blue-200 border border-blue-500/20 rounded-lg pl-3 pr-8 py-1.5 outline-none font-medium appearance-none hover:bg-blue-500/20 transition-colors text-sm"
                            >
                                {languages.map(lang => (
                                    <option key={lang} value={lang} className="bg-gray-800 text-white">{lang}</option>
                                ))}
                            </select>
                            <div className="absolute top-1/2 right-3 transform -translate-y-1/2 pointer-events-none text-blue-300/50">
                                <span className="text-[10px]">▼</span>
                            </div>
                        </div>
                    </div>

                    {translation && (
                        <button
                            onClick={copyToClipboard}
                            className={cn(
                                "p-1.5 rounded-lg transition-colors",
                                copied ? "bg-green-500/20 text-green-400" : "hover:bg-white/10 text-gray-400 hover:text-white"
                            )}
                        >
                            {copied ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                    )}
                </div>

                <div className={cn(
                    "flex-1 bg-gray-900/50 p-6 rounded-2xl rounded-t-none border border-gray-700/50 overflow-y-auto relative transition-colors duration-300",
                    translation ? "bg-gradient-to-br from-blue-900/20 to-purple-900/20" : ""
                )}>
                    <AnimatePresence mode="wait">
                        {isLoading ? (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center h-full space-y-4 text-gray-500"
                            >
                                <div className="relative">
                                    <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse" />
                                    <Loader2 size={32} className="animate-spin text-blue-500 relative z-10" />
                                </div>
                                <p className="animate-pulse">Translating text...</p>
                            </motion.div>
                        ) : translation ? (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="prose prose-invert max-w-none text-xl leading-relaxed text-blue-100"
                            >
                                <ReactMarkdown>{translation}</ReactMarkdown>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center h-full text-gray-600 text-center italic space-y-4"
                            >
                                <div className="p-4 bg-gray-800/50 rounded-full">
                                    <Globe size={32} className="text-gray-700" />
                                </div>
                                <p>Select a language and translate to realize the magic</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Mobile Button */}
                <button
                    onClick={handleTranslate}
                    disabled={isLoading || !text.trim()}
                    className="md:hidden w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? "Translating..." : "Translate"}
                </button>
            </motion.div>
        </div >
    );
}

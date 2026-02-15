"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, Image as ImageIcon, Loader2, Send, Sparkles, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface VisionInterfaceProps {
    initialModel?: string;
}

export function VisionInterface({ initialModel = "llama3.2-vision" }: VisionInterfaceProps) {
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [prompt, setPrompt] = useState("Describe this image");
    const [response, setResponse] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [model, setModel] = useState(initialModel);
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Fetch available models
        fetch("http://localhost:8000/api/models")
            .then((res) => res.json())
            .then((data) => {
                if (data && data.models) {
                    const modelNames = data.models.map((m: any) => m.model);
                    setAvailableModels(modelNames);
                }
            })
            .catch((err) => console.error("Failed to fetch models:", err));
    }, []);


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedImage(file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            setResponse(""); // Clear previous response
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (file.type.startsWith("image/")) {
                setSelectedImage(file);
                const url = URL.createObjectURL(file);
                setPreviewUrl(url);
                setResponse("");
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedImage || !prompt.trim() || isLoading) return;

        setIsLoading(true);
        setResponse("");

        try {
            const formData = new FormData();
            formData.append("file", selectedImage);
            formData.append("prompt", prompt);
            formData.append("model", model);

            const res = await fetch("http://localhost:8000/api/vision", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.detail || "Failed to analyze image");
            }

            const data = await res.json();
            if (data.message && data.message.content) {
                setResponse(data.message.content);
            } else {
                setResponse("No description received.");
            }

        } catch (error: any) {
            console.error("Vision error:", error);
            setResponse(`Error: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-[calc(100vh-120px)] relative">
            {/* Background Decor */}
            <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none -z-10" />

            {/* Left Column: Image Upload & Preview */}
            <div className="flex flex-col space-y-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                        "flex-1 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-8 text-center transition-all duration-300 relative overflow-hidden group cursor-pointer",
                        previewUrl
                            ? "border-primary/50 bg-gray-900/50"
                            : "border-gray-700 hover:border-primary/50 bg-gray-900/30 hover:bg-gray-900/50"
                    )}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => !previewUrl && fileInputRef.current?.click()}
                >
                    {/* Hover Glow */}
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                    />

                    <AnimatePresence mode="wait">
                        {previewUrl ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="relative w-full h-full flex items-center justify-center p-2"
                            >
                                <img
                                    src={previewUrl}
                                    alt="Preview"
                                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl relative z-10"
                                />
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedImage(null);
                                        setPreviewUrl(null);
                                        setResponse("");
                                    }}
                                    className="absolute top-4 right-4 z-20 bg-red-500/80 hover:bg-red-600 text-white p-2 rounded-full backdrop-blur-sm transition-all shadow-lg hover:scale-110"
                                    title="Remove Image"
                                >
                                    <X size={16} />
                                </button>
                                {/* Background glow for image */}
                                <div className="absolute inset-0 bg-primary/10 blur-xl rounded-full scale-90 -z-0" />
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="space-y-6 relative z-10"
                            >
                                <div className="w-20 h-20 mx-auto bg-gray-800/50 rounded-full flex items-center justify-center border border-white/5 shadow-inner group-hover:scale-110 transition-transform duration-300">
                                    <Upload size={32} className="text-gray-400 group-hover:text-primary transition-colors duration-300" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-medium text-white group-hover:text-primary transition-colors">Upload Image</h3>
                                    <p className="text-sm text-gray-400 max-w-xs mx-auto">Drag & drop your image here, or click to browse files</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card p-5"
                >
                    <label className="block text-sm font-medium text-gray-400 mb-3 ml-1 flex items-center space-x-2">
                        <Sparkles size={14} className="text-primary" />
                        <span>Vision Model</span>
                    </label>
                    <div className="relative">
                        <select
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            className="w-full bg-gray-900/50 text-white border border-gray-700/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none transition-all"
                        >
                            {availableModels.length > 0 ? (
                                availableModels.map((m) => (
                                    <option key={m} value={m} className="bg-gray-900">{m}</option>
                                ))
                            ) : (
                                <option value="llama3.2-vision" className="bg-gray-900">llama3.2-vision (Default)</option>
                            )}
                            {!availableModels.includes("llava") && <option value="llava" className="bg-gray-900">llava</option>}
                            {!availableModels.includes("moondream") && <option value="moondream" className="bg-gray-900">moondream</option>}
                        </select>
                        <div className="absolute top-1/2 right-4 transform -translate-y-1/2 pointer-events-none text-gray-500">
                            <span className="text-xs">▼</span>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Right Column: Prompt & Response */}
            <div className="glass-card flex flex-col overflow-hidden relative">
                <div className="p-4 border-b border-white/5 bg-white/5 backdrop-blur-xl flex items-center space-x-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                        <ImageIcon className="text-purple-400 w-5 h-5" />
                    </div>
                    <h2 className="font-semibold text-lg text-white">Analysis Results</h2>
                </div>

                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                    <AnimatePresence mode="wait">
                        {response ? (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="prose prose-invert max-w-none prose-p:text-gray-300 prose-headings:text-white prose-strong:text-white leading-relaxed"
                            >
                                <ReactMarkdown>{response}</ReactMarkdown>
                            </motion.div>
                        ) : isLoading ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center h-full text-gray-500 space-y-6"
                            >
                                <div className="relative">
                                    <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full animate-pulse" />
                                    <Loader2 size={48} className="animate-spin text-purple-500 relative z-10" />
                                </div>
                                <p className="animate-pulse">Analyzing image details...</p>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center h-full text-gray-500 italic space-y-4"
                            >
                                <Sparkles size={48} className="text-gray-700/50" />
                                <p>Upload an image and ask a question to begin.</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="p-4 bg-white/5 border-t border-white/5 backdrop-blur-md">
                    <form onSubmit={handleSubmit} className="flex space-x-3">
                        <input
                            type="text"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Ask something about the image..."
                            className="flex-1 bg-gray-900/50 text-white border border-gray-700/50 rounded-xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all placeholder:text-gray-600"
                            disabled={isLoading || !selectedImage}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !selectedImage || !prompt.trim()}
                            className={cn(
                                "p-3.5 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg",
                                isLoading || !selectedImage || !prompt.trim()
                                    ? "bg-gray-800 text-gray-600 cursor-not-allowed border border-gray-700/50"
                                    : "bg-gradient-to-br from-purple-600 to-blue-600 text-white hover:scale-105 hover:shadow-purple-500/25 border border-white/10"
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

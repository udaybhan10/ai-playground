"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Mic, Play, Download, Loader2, Volume2, Square, Sparkles, Wand2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function TTSInterface() {
    const [text, setText] = useState("Hello, this is a local text to speech demo using Kokoro.");
    const [voices, setVoices] = useState<string[]>([]);
    const [selectedVoice, setSelectedVoice] = useState("af_sarah");
    const [speed, setSpeed] = useState(1.0);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const searchParams = useSearchParams();
    const sessionId = searchParams.get('session_id');

    useEffect(() => {
        if (sessionId) {
            fetch(`http://localhost:8000/api/tts/history/${sessionId}`)
                .then(res => res.json())
                .then(data => {
                    if (data) {
                        setText(data.text);
                        setSelectedVoice(data.voice || "af_sarah");
                        // Construct full URL for audio
                        setAudioUrl(data.audio_path.startsWith("http") ? data.audio_path : `http://localhost:8000${data.audio_path}`);
                    }
                })
                .catch(err => console.error("Failed to load history:", err));
        }
    }, [sessionId]);

    useEffect(() => {
        // Fetch available voices
        fetch("http://localhost:8000/api/tts/voices")
            .then((res) => res.json())
            .then((data) => {
                if (data && data.voices) {
                    setVoices(data.voices);
                    if (data.voices.length > 0 && !data.voices.includes(selectedVoice)) {
                        setSelectedVoice(data.voices[0]);
                    }
                }
            })
            .catch((err) => console.error("Failed to fetch voices:", err));
    }, []);

    const handleGenerate = async () => {
        if (!text.trim() || isLoading) return;

        setIsLoading(true);
        setAudioUrl(null);

        try {
            const response = await fetch("http://localhost:8000/api/tts", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    text: text,
                    voice: selectedVoice,
                    speed: speed,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || "Failed to generate audio");
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setAudioUrl(url);
        } catch (error: any) {
            console.error("TTS error:", error);
            alert(`Error: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const togglePlay = () => {
        if (!audioRef.current || !audioUrl) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-[calc(100vh-120px)] relative">
            {/* Background elements */}
            <div className="absolute top-0 right-1/4 w-80 h-80 bg-green-500/10 blur-[100px] rounded-full pointer-events-none -z-10" />
            <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none -z-10" />

            {/* Left Column: Input and Controls */}
            <div className="flex flex-col space-y-6">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex-1 glass-card p-6 flex flex-col relative overflow-hidden"
                >
                    <div className="flex items-center justify-between mb-4">
                        <label className="block text-sm font-medium text-gray-400 flex items-center space-x-2">
                            <Wand2 size={16} className="text-emerald-400" />
                            <span>Input Text</span>
                        </label>
                        <span className="text-xs text-gray-500">{text.length} chars</span>
                    </div>
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="flex-1 w-full bg-gray-900/50 text-white p-4 rounded-xl resize-none border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder:text-gray-600 transition-all"
                        placeholder="Enter text to convert to speech..."
                    />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card p-6 space-y-6"
                >
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-400">Voice Persona</label>
                            <div className="relative">
                                <select
                                    value={selectedVoice}
                                    onChange={(e) => setSelectedVoice(e.target.value)}
                                    className="w-full bg-gray-900/50 text-white border border-gray-700/50 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none"
                                >
                                    {voices.map((v) => (
                                        <option key={v} value={v} className="bg-gray-900">{v}</option>
                                    ))}
                                </select>
                                <div className="absolute top-1/2 right-3 transform -translate-y-1/2 pointer-events-none text-gray-500">
                                    <span className="text-xs">▼</span>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-400 flex justify-between">
                                <span>Speed</span>
                                <span className="text-emerald-400">{speed}x</span>
                            </label>
                            <input
                                type="range"
                                min="0.5"
                                max="2.0"
                                step="0.1"
                                value={speed}
                                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={isLoading || !text.trim()}
                        className={cn(
                            "w-full py-4 rounded-xl flex items-center justify-center space-x-3 font-bold transition-all duration-300 shadow-lg group relative overflow-hidden",
                            isLoading || !text.trim()
                                ? "bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700/50"
                                : "bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:shadow-emerald-500/30 border border-white/10 hover:scale-[1.02]"
                        )}
                    >
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />

                        {isLoading ? (
                            <>
                                <Loader2 className="animate-spin" />
                                <span>Synthesizing...</span>
                            </>
                        ) : (
                            <>
                                <Volume2 className="group-hover:animate-pulse" />
                                <span>Generate Speech</span>
                            </>
                        )}
                    </button>
                </motion.div>
            </div>

            {/* Right Column: Audio Output */}
            <div className="glass-card flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                    <div className="w-64 h-64 border-4 border-emerald-500 rounded-full animate-[ping_3s_linear_infinite]" />
                    <div className="absolute w-48 h-48 border-4 border-green-500 rounded-full animate-[ping_3s_linear_infinite_0.5s]" />
                </div>

                <AnimatePresence mode="wait">
                    {audioUrl ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative z-10 w-full max-w-md space-y-10"
                        >
                            <div className="relative">
                                {/* Glow behind play button */}
                                <div className={cn(
                                    "absolute inset-0 bg-emerald-500/30 blur-3xl rounded-full transition-opacity duration-500",
                                    isPlaying ? "opacity-100" : "opacity-0"
                                )} />

                                <button
                                    onClick={togglePlay}
                                    className="relative bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-full inline-flex items-center justify-center shadow-2xl ring-1 ring-white/10 group hover:scale-110 transition-transform duration-300"
                                >
                                    {isPlaying ? (
                                        <Square size={48} className="text-emerald-400 fill-current" />
                                    ) : (
                                        <Play size={48} className="text-emerald-400 fill-current ml-2" />
                                    )}
                                </button>
                            </div>

                            <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/5 w-full shadow-inner">
                                <audio
                                    ref={audioRef}
                                    src={audioUrl}
                                    controls
                                    className="w-full opacity-80 hover:opacity-100 transition-opacity"
                                    onPlay={() => setIsPlaying(true)}
                                    onPause={() => setIsPlaying(false)}
                                    onEnded={() => setIsPlaying(false)}
                                />
                            </div>

                            <a
                                href={audioUrl}
                                download="speech.wav"
                                className="inline-flex items-center space-x-2 text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-500/10 px-4 py-2 rounded-lg hover:bg-emerald-500/20"
                            >
                                <Download size={18} />
                                <span className="font-medium">Download Audio</span>
                            </a>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="relative z-10 text-gray-500 space-y-6"
                        >
                            <div className="w-24 h-24 mx-auto bg-gray-800/50 rounded-full flex items-center justify-center border border-white/5 shadow-inner">
                                <Sparkles size={48} className="text-emerald-500/50" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-semibold text-white">Ready to Synthesize</h3>
                                <p className="text-sm text-gray-400 max-w-xs mx-auto">Enter your text and select a voice to generate high-quality speech.</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

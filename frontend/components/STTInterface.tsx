"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Mic, Square, Upload, FileAudio, Loader2, Copy, Check, Waves, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function STTInterface() {
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null); // Added for playback
    const [transcription, setTranscription] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [metadata, setMetadata] = useState<{ language?: string, probability?: number } | null>(null);
    const [copied, setCopied] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const searchParams = useSearchParams();
    const sessionId = searchParams.get('session_id');

    useEffect(() => {
        if (sessionId) {
            fetch(`http://localhost:8000/api/stt/history/${sessionId}`)
                .then(res => res.json())
                .then(data => {
                    if (data) {
                        setTranscription(data.transcript);
                        setMetadata({
                            language: data.language,
                            probability: data.language_probability
                        });
                        setAudioUrl(data.audio_path.startsWith("http") ? data.audio_path : `http://localhost:8000${data.audio_path}`);
                        setAudioBlob(null);
                    }
                })
                .catch(err => console.error("Failed to load history:", err));
        } else {
            setTranscription("");
            setAudioUrl(null);
            setMetadata(null);
        }
    }, [sessionId]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: "audio/wav" });
                setAudioBlob(blob);
                handleTranscribe(blob);
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setTranscription("");
            setMetadata(null);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Could not access microphone. Please check permissions.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            // Stop all tracks
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAudioBlob(file);
            handleTranscribe(file);
        }
    };

    const handleTranscribe = async (audio: Blob) => {
        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append("file", audio, "recording.wav");

            const response = await fetch("http://localhost:8000/api/stt", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || "Transcription failed");
            }

            const data = await response.json();
            setTranscription(data.text);
            setMetadata({
                language: data.language,
                probability: data.language_probability
            });

        } catch (error: any) {
            console.error("STT error:", error);
            setTranscription(`Error: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(transcription);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-[calc(100vh-120px)] relative">
            {/* Background elements */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-red-500/10 blur-[100px] rounded-full pointer-events-none -z-10" />

            {/* Left Column: Recording Controls */}
            <div className="flex flex-col space-y-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex-1 glass-card flex flex-col items-center justify-center p-8 text-center space-y-10 relative overflow-hidden"
                >
                    {/* Visualizer animation background */}
                    <div className={cn(
                        "absolute inset-0 flex items-center justify-center transition-opacity duration-1000 pointer-events-none",
                        isRecording ? "opacity-100" : "opacity-0"
                    )}>
                        <div className="w-96 h-96 rounded-full bg-orange-500/10 blur-3xl animate-pulse" />
                        <div className="absolute w-[500px] h-[500px] border border-orange-500/20 rounded-full animate-[ping_3s_linear_infinite]" />
                        <div className="absolute w-[400px] h-[400px] border border-orange-500/20 rounded-full animate-[ping_3s_linear_infinite_1s]" />
                    </div>

                    <div className="relative z-10 space-y-8">
                        <div
                            onClick={isRecording ? stopRecording : startRecording}
                            className="relative group cursor-pointer"
                        >
                            <div className={cn(
                                "absolute inset-0 bg-orange-500 blur-2xl rounded-full transition-all duration-300",
                                isRecording ? "opacity-40 scale-125" : "opacity-0 group-hover:opacity-20"
                            )} />

                            <motion.div
                                animate={isRecording ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className={cn(
                                    "relative w-40 h-40 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl border-4",
                                    isRecording
                                        ? "bg-gradient-to-br from-orange-600 to-red-600 border-orange-400/50 shadow-orange-500/30"
                                        : "bg-gray-800 border-gray-700 group-hover:border-orange-500/50 group-hover:shadow-orange-500/20"
                                )}
                            >
                                {isRecording ? (
                                    <Square size={48} className="text-white fill-current" />
                                ) : (
                                    <Mic size={48} className="text-gray-300 group-hover:text-orange-400 transition-colors" />
                                )}
                            </motion.div>
                        </div>

                        <div className="space-y-2">
                            <h3 className={cn(
                                "text-3xl font-bold transition-colors duration-300",
                                isRecording ? "text-orange-500" : "text-white"
                            )}>
                                {isRecording ? "Listening..." : "Tap to Speak"}
                            </h3>
                            <p className="text-gray-400">
                                {isRecording ? "Click to stop and transcribe" : "Or upload an audio file below"}
                            </p>
                        </div>
                    </div>

                    <AnimatePresence>
                        {!isRecording && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="relative z-10 pt-4"
                            >
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center space-x-3 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium text-gray-300 transition-all border border-white/5 hover:border-white/10"
                                >
                                    <Upload size={18} />
                                    <span>Upload Audio File</span>
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    accept="audio/*"
                                    className="hidden"
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Metadata / Status card */}
                <AnimatePresence>
                    {metadata && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-card p-5 flex justify-between items-center text-sm"
                        >
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-orange-500/20 rounded-lg">
                                    <Waves size={16} className="text-orange-400" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-gray-500 text-xs">Detected Language</span>
                                    <span className="font-semibold text-white uppercase tracking-wider">{metadata.language || "Unknown"}</span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-green-500/20 rounded-lg">
                                    <Sparkles size={16} className="text-green-400" />
                                </div>
                                <div className="flex flex-col text-right">
                                    <span className="text-gray-500 text-xs">Confidence</span>
                                    <span className="font-semibold text-green-400">{Math.round((metadata.probability || 0) * 100)}%</span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>


                {/* Audio Player for History */}
                <AnimatePresence>
                    {audioUrl && !isRecording && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-card p-5"
                        >
                            <div className="flex items-center space-x-3 mb-3">
                                <div className="p-2 bg-orange-500/20 rounded-lg">
                                    <FileAudio size={16} className="text-orange-400" />
                                </div>
                                <span className="text-sm font-medium text-gray-300">Original Recording</span>
                            </div>
                            <audio src={audioUrl} controls className="w-full h-8 opacity-80 hover:opacity-100 transition-opacity" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Right Column: Transcription Output */}
            <div className="glass-card flex flex-col overflow-hidden relative">
                <div className="p-4 border-b border-white/5 bg-white/5 backdrop-blur-xl flex justify-between items-center z-10">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-orange-500/20 rounded-lg">
                            <FileAudio className="text-orange-400 w-5 h-5" />
                        </div>
                        <h2 className="font-semibold text-lg text-white">Transcription</h2>
                    </div>
                    {transcription && (
                        <button
                            onClick={copyToClipboard}
                            className={cn(
                                "p-2 rounded-lg transition-all duration-300",
                                copied ? "bg-green-500/20 text-green-400" : "hover:bg-white/10 text-gray-400 hover:text-white"
                            )}
                            title="Copy text"
                        >
                            {copied ? <Check size={18} /> : <Copy size={18} />}
                        </button>
                    )}
                </div>

                <div className="flex-1 p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                    <AnimatePresence mode="wait">
                        {isLoading ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center h-full text-gray-500 space-y-6"
                            >
                                <div className="relative">
                                    <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full animate-pulse" />
                                    <Loader2 size={48} className="animate-spin text-orange-500 relative z-10" />
                                </div>
                                <p className="animate-pulse">Transcribing audio...</p>
                            </motion.div>
                        ) : transcription ? (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="prose prose-invert max-w-none text-gray-200 whitespace-pre-wrap leading-relaxed text-lg"
                            >
                                {transcription}
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center h-full text-gray-600 italic space-y-4"
                            >
                                <Waves size={48} className="text-gray-700/50" />
                                <p>Record microphone input or upload an audio file to view transcription.</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div >
    );
}

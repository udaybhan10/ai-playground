"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, X, Volume2, Loader2, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface VoiceModeOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    voice?: string;
    model?: string;
    initialSessionId?: number | null;
}

type VoiceState = "idle" | "listening" | "processing" | "speaking";

export function VoiceModeOverlay({
    isOpen,
    onClose,
    voice = "af_sarah",
    model = "llama3.2-vision:latest",
    initialSessionId = null
}: VoiceModeOverlayProps) {
    const [state, setState] = useState<VoiceState>("idle");
    const [sessionId, setSessionId] = useState<number | null>(null);
    const sessionIdRef = useRef<number | null>(null);  // Ref to avoid stale closure
    const [userText, setUserText] = useState("");
    const [aiText, setAiText] = useState("");
    const [isRecording, setIsRecording] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const startListening = async () => {
        try {
            setState("listening");
            setIsRecording(true);

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(chunksRef.current, { type: "audio/wav" });
                stream.getTracks().forEach(track => track.stop());

                // Send to backend
                await processVoice(audioBlob);
            };

            mediaRecorder.start();
        } catch (err) {
            console.error("Mic access error:", err);
            setState("idle");
            alert("Could not access microphone");
        }
    };

    const stopListening = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const processVoice = async (audioBlob: Blob) => {
        setState("processing");

        const formData = new FormData();
        formData.append("audio_file", audioBlob, "recording.wav");
        formData.append("voice", voice);
        formData.append("model", model);
        formData.append("speed", "1.0");
        console.log("[VoiceMode] Current sessionId before API call:", sessionIdRef.current);
        if (sessionIdRef.current) {
            formData.append("session_id", sessionIdRef.current.toString());
            console.log("[VoiceMode] Sending session_id:", sessionIdRef.current);
        } else {
            console.log("[VoiceMode] No sessionId - creating new session");
        }

        try {
            // Create new abort controller for this request
            abortControllerRef.current = new AbortController();

            const response = await fetch("http://localhost:8000/api/voice/chat", {
                method: "POST",
                body: formData,
                signal: abortControllerRef.current.signal
            });

            if (!response.ok) {
                throw new Error("Voice processing failed");
            }

            const data = await response.json();
            console.log("[VoiceMode] Response received:", { session_id: data.session_id, user_text: data.user_text });

            // Store session ID for subsequent requests - update both state and ref
            if (!sessionIdRef.current) {
                console.log("[VoiceMode] Setting new sessionId:", data.session_id);
                setSessionId(data.session_id);
                sessionIdRef.current = data.session_id;  // Update ref immediately
            } else {
                console.log("[VoiceMode] Keeping existing sessionId:", sessionIdRef.current);
            }
            setUserText(data.user_text);
            setAiText(data.ai_text);

            // Play AI response
            setState("speaking");
            const audio = new Audio(`http://localhost:8000${data.audio_url}`);
            audioRef.current = audio;

            audio.onended = () => {
                setState("idle");
                // Auto-restart for continuous conversation
                setTimeout(() => {
                    if (isOpen) {
                        startListening();
                    }
                }, 500);
            };

            audio.play();
        } catch (err: any) {
            console.error("Voice processing error:", err);
            // Don't show error if request was aborted by user
            if (err.name !== 'AbortError') {
                setState("idle");
                alert("Voice processing failed. Please try again.");
            }
        }
    };

    const handleClose = () => {
        // Stop any ongoing processes
        stopListening();

        // Cancel any ongoing API request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }

        // Stop and cleanup audio playback
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }

        // Reset state and ref
        setState("idle");
        setSessionId(null);
        sessionIdRef.current = null;  // Reset ref too
        setUserText("");
        setAiText("");
        onClose();
    };

    // Initialize session ID from prop when overlay opens
    useEffect(() => {
        console.log("[VoiceMode] Overlay opened:", { isOpen, initialSessionId, currentSessionId: sessionId });
        if (isOpen) {
            if (initialSessionId) {
                console.log("[VoiceMode] Initializing with sessionId:", initialSessionId);
                setSessionId(initialSessionId);
                sessionIdRef.current = initialSessionId;  // Update ref too
            }
            if (state === "idle") {
                startListening();
            }
        }
    }, [isOpen, initialSessionId]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center"
            >
                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-8 right-8 p-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-full transition-all border border-red-500/50"
                >
                    <X size={24} />
                </button>

                {/* Main Content */}
                <div className="flex flex-col items-center space-y-12 max-w-2xl w-full px-8">
                    {/* Visualizer */}
                    <div className="relative">
                        <motion.div
                            animate={
                                state === "listening"
                                    ? { scale: [1, 1.2, 1] }
                                    : state === "speaking"
                                        ? { scale: [1, 1.1, 1] }
                                        : { scale: 1 }
                            }
                            transition={{ repeat: state === "listening" || state === "speaking" ? Infinity : 0, duration: 2 }}
                            className={cn(
                                "w-64 h-64 rounded-full flex items-center justify-center border-4 shadow-2xl",
                                state === "listening" && "bg-gradient-to-br from-orange-600 to-red-600 border-orange-400/50",
                                state === "processing" && "bg-gradient-to-br from-blue-600 to-purple-600 border-blue-400/50",
                                state === "speaking" && "bg-gradient-to-br from-green-600 to-emerald-600 border-green-400/50",
                                state === "idle" && "bg-gray-800 border-gray-700"
                            )}
                        >
                            {state === "listening" && <Mic size={80} className="text-white" />}
                            {state === "processing" && <Loader2 size={80} className="text-white animate-spin" />}
                            {state === "speaking" && <Volume2 size={80} className="text-white" />}
                            {state === "idle" && <MessageCircle size={80} className="text-gray-400" />}
                        </motion.div>

                        {/* Glow effect */}
                        <div className={cn(
                            "absolute inset-0 rounded-full blur-3xl -z-10",
                            state === "listening" && "bg-orange-500/40",
                            state === "processing" && "bg-blue-500/40",
                            state === "speaking" && "bg-green-500/40"
                        )} />
                    </div>

                    {/* Status Text */}
                    <div className="text-center space-y-2">
                        <h2 className="text-4xl font-bold text-white">
                            {state === "listening" && "Listening..."}
                            {state === "processing" && "Thinking..."}
                            {state === "speaking" && "Speaking..."}
                            {state === "idle" && "Voice Mode"}
                        </h2>
                        <p className="text-gray-400">
                            {state === "listening" && "Speak now, I'm listening"}
                            {state === "processing" && "Processing your request"}
                            {state === "speaking" && "Playing response"}
                            {state === "idle" && "Ready to chat"}
                        </p>
                    </div>

                    {/* Controls */}
                    {state === "listening" && (
                        <button
                            onClick={stopListening}
                            className="px-8 py-4 bg-red-500 hover:bg-red-600 text-white rounded-full font-semibold transition-all shadow-lg hover:shadow-red-500/50"
                        >
                            Stop & Send
                        </button>
                    )}

                    {/* Transcript Display */}
                    <div className="w-full space-y-4 max-h-64 overflow-y-auto">
                        {userText && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg"
                            >
                                <p className="text-sm text-gray-400 mb-1">You said:</p>
                                <p className="text-white">{userText}</p>
                            </motion.div>
                        )}
                        {aiText && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg"
                            >
                                <p className="text-sm text-gray-400 mb-1">AI response:</p>
                                <p className="text-white">{aiText}</p>
                            </motion.div>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

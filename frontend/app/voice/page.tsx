"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Play, Pause, Mic, User, Bot } from "lucide-react";

interface VoiceMessage {
    id: number;
    user_audio_path: string;
    user_text: string;
    ai_text: string;
    ai_audio_path: string;
    language: string;
    language_probability: number;
    created_at: string;
}

interface VoiceSession {
    id: number;
    title: string;
    created_at: string;
    messages: VoiceMessage[];
}

export default function VoicePage() {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get("session_id");

    const [session, setSession] = useState<VoiceSession | null>(null);
    const [isPlayingUser, setIsPlayingUser] = useState<number | null>(null);
    const [isPlayingAI, setIsPlayingAI] = useState<number | null>(null);
    const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (sessionId) {
            fetch(`http://localhost:8000/api/voice/sessions/${sessionId}`)
                .then(res => res.json())
                .then(data => setSession(data))
                .catch(err => console.error("Failed to load session:", err));
        }
    }, [sessionId]);

    const playAudio = (audioPath: string, id: number, isUser: boolean) => {
        // Stop current audio if playing
        if (currentAudio) {
            currentAudio.pause();
            setIsPlayingUser(null);
            setIsPlayingAI(null);
        }

        const audio = new Audio(`http://localhost:8000${audioPath}`);
        audio.onended = () => {
            if (isUser) setIsPlayingUser(null);
            else setIsPlayingAI(null);
            setCurrentAudio(null);
        };
        audio.play();
        setCurrentAudio(audio);

        if (isUser) setIsPlayingUser(id);
        else setIsPlayingAI(id);
    };

    const stopAudio = () => {
        if (currentAudio) {
            currentAudio.pause();
            setCurrentAudio(null);
            setIsPlayingUser(null);
            setIsPlayingAI(null);
        }
    };

    const handleResumeVoiceChat = () => {
        // Dispatch event to open voice mode overlay with session ID
        const event = new CustomEvent('toggleVoiceMode', {
            detail: { sessionId: sessionId ? parseInt(sessionId) : null }
        });
        window.dispatchEvent(event);
    };

    if (!sessionId) {
        return (
            <div className="h-full">
                <h1 className="text-3xl font-bold mb-6">Voice Chat</h1>
                <div className="glass-card p-12 text-center">
                    <div className="w-24 h-24 bg-gradient-to-tr from-orange-500/20 to-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Mic size={48} className="text-orange-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-300 mb-2">No Conversation Selected</h3>
                    <p className="text-gray-500 mb-6">Select a conversation from the sidebar to view history</p>
                    <button
                        onClick={handleResumeVoiceChat}
                        className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg transition-all flex items-center space-x-2 mx-auto"
                    >
                        <Mic size={20} />
                        <span>Start New Voice Chat</span>
                    </button>
                </div>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="h-full flex items-center justify-center">
                <p className="text-gray-400">Loading session...</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <h1 className="text-3xl font-bold mb-6">{session.title}</h1>

            {/* Chat-style conversation history */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-6">
                {(!session.messages || session.messages.length === 0) ? (
                    <div className="glass-card p-12 text-center">
                        <p className="text-gray-400">No messages yet. Start a voice chat to add messages to this session.</p>
                    </div>
                ) : (
                    session.messages.map((message) => (
                        <div key={message.id} className="space-y-4">
                            {/* User Message */}
                            <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0 p-2 bg-blue-500/20 rounded-lg">
                                    <User size={20} className="text-blue-400" />
                                </div>
                                <div className="flex-1 glass-card p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-semibold text-blue-400">You</span>
                                        <button
                                            onClick={() => {
                                                if (isPlayingUser === message.id) {
                                                    stopAudio();
                                                } else {
                                                    playAudio(message.user_audio_path, message.id, true);
                                                }
                                            }}
                                            className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                                        >
                                            {isPlayingUser === message.id ? (
                                                <Pause size={16} />
                                            ) : (
                                                <Play size={16} />
                                            )}
                                        </button>
                                    </div>
                                    <p className="text-gray-200">{message.user_text}</p>
                                    <p className="text-xs text-gray-500 mt-2">
                                        {message.language} ({Math.round(message.language_probability * 100)}% confidence)
                                    </p>
                                </div>
                            </div>

                            {/* AI Response */}
                            <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0 p-2 bg-green-500/20 rounded-lg">
                                    <Bot size={20} className="text-green-400" />
                                </div>
                                <div className="flex-1 glass-card p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-semibold text-green-400">AI Assistant</span>
                                        <button
                                            onClick={() => {
                                                if (isPlayingAI === message.id) {
                                                    stopAudio();
                                                } else {
                                                    playAudio(message.ai_audio_path, message.id, false);
                                                }
                                            }}
                                            className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                                        >
                                            {isPlayingAI === message.id ? (
                                                <Pause size={16} />
                                            ) : (
                                                <Play size={16} />
                                            )}
                                        </button>
                                    </div>
                                    <p className="text-gray-200">{message.ai_text}</p>
                                    <p className="text-xs text-gray-500 mt-2">
                                        {new Date(message.created_at).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Resume Voice Chat Button */}
            <div className="border-t border-white/10 pt-4">
                <button
                    onClick={handleResumeVoiceChat}
                    className="w-full px-6 py-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl transition-all flex items-center justify-center space-x-3 font-semibold text-lg"
                >
                    <Mic size={24} />
                    <span>Resume Voice Chat</span>
                </button>
            </div>
        </div>
    );
}

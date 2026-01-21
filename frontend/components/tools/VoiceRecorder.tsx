"use client";

import { useState, useRef } from "react";

export default function VoiceRecorder() {
    const [isRecording, setIsRecording] = useState(false);
    const [audioURL, setAudioURL] = useState<string | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);

            mediaRecorderRef.current.ondataavailable = (e) => {
                chunksRef.current.push(e.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: "audio/webm" });
                const url = URL.createObjectURL(blob);
                setAudioURL(url);
                chunksRef.current = [];
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setRecordingTime(0);

            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.error("Error accessing microphone:", err);
            // alert("Could not access microphone."); // Removed for lint
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex flex-col items-center justify-center p-8 gap-6 h-full">
            <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 ${isRecording ? "bg-red-500/10 shadow-[0_0_30px_rgba(239,68,68,0.5)]" : "bg-muted"}`}>
                <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${isRecording ? "bg-red-500 animate-pulse" : "bg-muted-foreground/30"}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-white">
                        <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
                        <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
                    </svg>
                </div>
            </div>

            <div className="text-3xl font-mono font-bold text-primary">
                {formatTime(recordingTime)}
            </div>

            <div className="flex gap-4">
                {!isRecording ? (
                    <button
                        onClick={startRecording}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-full font-bold shadow-lg transition-all transform hover:scale-105"
                    >
                        Start Recording
                    </button>
                ) : (
                    <button
                        onClick={stopRecording}
                        className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-full font-bold shadow-lg transition-all transform hover:scale-105"
                    >
                        Stop Recording
                    </button>
                )}
            </div>

            {audioURL && (
                <div className="w-full max-w-md bg-card p-4 rounded-xl border border-border mt-4 animate-in fade-in slide-in-from-bottom-4 shadow-sm">
                    <h3 className="font-bold text-foreground mb-2">Recording Ready</h3>
                    <audio controls src={audioURL} className="w-full mb-4" />
                    <a
                        href={audioURL}
                        download={`recording-${new Date().toISOString()}.webm`}
                        className="flex items-center justify-center w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-bold hover:bg-primary/90 transition-colors"
                    >
                        Download Recording
                    </a>
                </div>
            )}
        </div>
    );
}

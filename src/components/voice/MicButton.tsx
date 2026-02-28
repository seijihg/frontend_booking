"use client";

import { useRef, useCallback } from "react";
import { Mic, Square } from "lucide-react";
import { useVoiceBookingStore } from "@/stores/voiceBookingStore";

interface MicButtonProps {
  onRecordingComplete: (blob: Blob) => void;
  disabled: boolean;
}

export default function MicButton({ onRecordingComplete, disabled }: MicButtonProps) {
  const { isRecording, setIsRecording, setError } = useVoiceBookingStore();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const handleToggle = useCallback(async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        chunksRef.current = [];
        stopStream();
        setIsRecording(false);
        if (blob.size > 0) {
          onRecordingComplete(blob);
        }
      };

      recorder.start();
      setIsRecording(true);
      setError(null);
    } catch (err) {
      stopStream();
      setIsRecording(false);
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setError("Microphone access is required for voice booking.");
      } else {
        setError("Could not access microphone. Please try again.");
      }
    }
  }, [isRecording, onRecordingComplete, setIsRecording, setError, stopStream]);

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={disabled}
      className={`relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-colors ${
        disabled
          ? "bg-gray-200 cursor-not-allowed"
          : isRecording
          ? "bg-red-600 hover:bg-red-700"
          : "bg-indigo-600 hover:bg-indigo-700"
      }`}
      aria-label={isRecording ? "Stop recording" : "Start recording"}
    >
      {isRecording && (
        <span className="absolute inset-0 animate-ping rounded-full bg-red-600 opacity-40" />
      )}
      {isRecording ? (
        <Square className="h-3.5 w-3.5 text-white" />
      ) : (
        <Mic className="h-3.5 w-3.5 text-white" />
      )}
    </button>
  );
}

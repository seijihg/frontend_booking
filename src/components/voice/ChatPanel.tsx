"use client";

import { useRef, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { Mic, Loader2 } from "lucide-react";
import { DisplayMessage } from "@/types/voice";
import ChatMessage from "./ChatMessage";

interface ChatPanelProps {
  messages: DisplayMessage[];
  isTranscribing: boolean;
  isChatting: boolean;
}

export default function ChatPanel({
  messages,
  isTranscribing,
  isChatting,
}: ChatPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTranscribing, isChatting]);

  if (messages.length === 0 && !isTranscribing && !isChatting) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-400">
        <Mic className="h-8 w-8 mb-2" />
        <p className="text-xs text-center">Tap the mic to start booking</p>
      </div>
    );
  }

  return (
    <div className="max-h-64 overflow-y-auto space-y-2 py-2">
      <AnimatePresence initial={false}>
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
      </AnimatePresence>

      {isTranscribing && (
        <div className="flex items-center gap-2 text-gray-400 text-xs px-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Transcribing...</span>
        </div>
      )}

      {isChatting && (
        <div className="flex items-center gap-2 text-gray-400 text-xs px-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Thinking...</span>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}

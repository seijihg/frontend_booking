import { ChatRequest, ChatResponse, TranscribeResponse } from "@/types/voice";

// Client-side function to transcribe audio via Whisper
// Routes through Next.js API proxy which adds Authorization header
export const transcribeAudio = async (
  audioBlob: Blob,
  language?: string
): Promise<TranscribeResponse> => {
  const formData = new FormData();
  const ext = audioBlob.type.includes("mp4") ? "mp4" : "webm";
  formData.append("audio", audioBlob, `recording.${ext}`);
  if (language) {
    formData.append("language", language);
  }

  const res = await fetch("/api/voice/transcribe", {
    method: "POST",
    body: formData,
  });

  if (res.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (res.status === 502) {
    throw new Error("Voice service temporarily unavailable. Please try again.");
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const fieldErrors = Object.values(data).flat().join(". ");
    throw new Error(fieldErrors || "Transcription failed. Please try again.");
  }

  return res.json();
};

// Client-side function to send a chat message to the booking assistant
// Routes through Next.js API proxy which adds Authorization header
export const sendChatMessage = async (
  data: ChatRequest
): Promise<ChatResponse> => {
  const res = await fetch("/api/voice/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (res.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (res.status === 502) {
    throw new Error("Voice service temporarily unavailable. Please try again.");
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const message =
      data.error || Object.values(data).flat().join(". ") || "Chat request failed.";
    throw new Error(message);
  }

  return res.json();
};

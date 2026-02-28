import { create } from "zustand";
import { Message, DisplayMessage } from "@/types/voice";

interface VoiceBookingState {
  conversationHistory: Message[];
  messages: DisplayMessage[];
  isRecording: boolean;
  isTranscribing: boolean;
  isChatting: boolean;
  error: string | null;
  addUserMessage: (content: string) => void;
  addAssistantMessage: (content: string) => void;
  setConversationHistory: (history: Message[]) => void;
  setIsRecording: (recording: boolean) => void;
  setIsTranscribing: (transcribing: boolean) => void;
  setIsChatting: (chatting: boolean) => void;
  setError: (error: string | null) => void;
  resetConversation: () => void;
}

export const useVoiceBookingStore = create<VoiceBookingState>((set) => ({
  conversationHistory: [],
  messages: [],
  isRecording: false,
  isTranscribing: false,
  isChatting: false,
  error: null,
  addUserMessage: (content) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: crypto.randomUUID(),
          role: "user",
          content,
          timestamp: new Date(),
        },
      ],
    })),
  addAssistantMessage: (content) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content,
          timestamp: new Date(),
        },
      ],
    })),
  setConversationHistory: (history) => set({ conversationHistory: history }),
  setIsRecording: (recording) => set({ isRecording: recording }),
  setIsTranscribing: (transcribing) => set({ isTranscribing: transcribing }),
  setIsChatting: (chatting) => set({ isChatting: chatting }),
  setError: (error) => set({ error }),
  resetConversation: () =>
    set({
      conversationHistory: [],
      messages: [],
      isRecording: false,
      isTranscribing: false,
      isChatting: false,
      error: null,
    }),
}));

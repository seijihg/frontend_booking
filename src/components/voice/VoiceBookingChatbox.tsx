"use client";

import { useCallback, useState } from "react";
import { useVoiceBookingStore } from "@/stores/voiceBookingStore";
import { useTranscribeAudio, useSendChatMessage } from "@/hooks/useVoiceBooking";
import Alert from "@/components/common/Alert";
import ChatPanel from "./ChatPanel";
import MicButton from "./MicButton";
import ChatInput from "./ChatInput";

export default function VoiceBookingChatbox() {
  const {
    messages,
    isTranscribing,
    isChatting,
    error,
  } = useVoiceBookingStore();

  const [confirmingReset, setConfirmingReset] = useState(false);

  const transcribeMutation = useTranscribeAudio();
  const chatMutation = useSendChatMessage();

  const isBusy = isTranscribing || isChatting;

  const handleError = useCallback(
    (err: unknown) => {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      if (message === "UNAUTHORIZED") {
        useVoiceBookingStore.getState().setError("Session expired. Please refresh the page or log in again.");
        return;
      }
      useVoiceBookingStore.getState().setError(message);
    },
    []
  );

  const sendToChat = useCallback(
    async (text: string) => {
      const store = useVoiceBookingStore.getState();
      store.addUserMessage(text);
      store.setIsChatting(true);
      store.setError(null);

      try {
        const chatRes = await chatMutation.mutateAsync({
          message: text,
          conversation_history: store.conversationHistory,
        });
        const freshStore = useVoiceBookingStore.getState();
        freshStore.addAssistantMessage(chatRes.reply);
        freshStore.setConversationHistory(chatRes.conversation_history);
      } catch (err) {
        handleError(err);
      } finally {
        useVoiceBookingStore.getState().setIsChatting(false);
      }
    },
    [chatMutation, handleError]
  );

  const handleRecordingComplete = useCallback(
    async (blob: Blob) => {
      const store = useVoiceBookingStore.getState();
      store.setIsTranscribing(true);
      store.setError(null);

      try {
        const { text } = await transcribeMutation.mutateAsync({ audioBlob: blob });
        useVoiceBookingStore.getState().setIsTranscribing(false);
        await sendToChat(text);
      } catch (err) {
        useVoiceBookingStore.getState().setIsTranscribing(false);
        handleError(err);
      }
    },
    [transcribeMutation, sendToChat, handleError]
  );

  const handleNewConversation = () => {
    if (messages.length > 0) {
      setConfirmingReset(true);
      return;
    }
    useVoiceBookingStore.getState().resetConversation();
  };

  const handleConfirmReset = () => {
    setConfirmingReset(false);
    useVoiceBookingStore.getState().resetConversation();
  };

  const handleCancelReset = () => {
    setConfirmingReset(false);
  };

  return (
    <div className="border-t border-gray-100 pt-6 mt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Voice Booking</h3>
        <button
          type="button"
          onClick={handleNewConversation}
          className="text-xs text-indigo-600 hover:text-indigo-500"
        >
          New
        </button>
      </div>

      {/* Error */}
      <Alert
        show={!!error}
        type="error"
        message={error || ""}
        onDismiss={() => useVoiceBookingStore.getState().setError(null)}
      />

      {/* Chat messages */}
      <ChatPanel
        messages={messages}
        isTranscribing={isTranscribing}
        isChatting={isChatting}
      />

      {/* Reset confirmation */}
      {confirmingReset && (
        <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
          <p className="mb-2">Start a new conversation?</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleConfirmReset}
              className="rounded-md bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-500"
            >
              Yes
            </button>
            <button
              type="button"
              onClick={handleCancelReset}
              className="rounded-md bg-white px-3 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              No
            </button>
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="mt-2 flex items-center gap-2">
        <MicButton onRecordingComplete={handleRecordingComplete} disabled={isBusy || confirmingReset} />
        <div className="flex-1">
          <ChatInput onSend={sendToChat} disabled={isBusy || confirmingReset} />
        </div>
      </div>
    </div>
  );
}

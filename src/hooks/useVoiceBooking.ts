import { useMutation, useQueryClient } from "@tanstack/react-query";
import { transcribeAudio, sendChatMessage } from "@/api/voiceApiClient";
import { ChatRequest } from "@/types/voice";

export const useTranscribeAudio = () => {
  return useMutation({
    mutationFn: ({ audioBlob, language }: { audioBlob: Blob; language?: string }) =>
      transcribeAudio(audioBlob, language),
  });
};

export const useSendChatMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ChatRequest) => sendChatMessage(data),
    onSuccess: (data) => {
      if (data.appointments && data.appointments.length > 0) {
        queryClient.invalidateQueries({ queryKey: ["appointments"] });
      }
    },
  });
};

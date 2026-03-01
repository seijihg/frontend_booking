/** Opaque API message — store and pass back unchanged to the backend */
export interface Message {
  role: "user" | "assistant" | "tool" | "system";
  content: string;
  tool_call_id?: string;
  tool_calls?: object[];
}

/** UI-friendly message for rendering in the chat panel */
export interface DisplayMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

/** Response from POST /voice/transcribe/ */
export interface TranscribeResponse {
  text: string;
}

/** Request body for POST /voice/chat/ */
export interface ChatRequest {
  message: string;
  conversation_history: Message[];
}

/** Response from POST /voice/chat/ */
export interface ChatResponse {
  reply: string;
  conversation_history: Message[];
  /** Present only when one or more appointments were created during this turn */
  appointments?: BookingData[];
}

/** Appointment object returned by the backend when a booking is created */
export interface BookingData {
  id: number;
  salon: number;
  user: number;
  customer: number;
  appointment_time: string;
  end_time: string;
  column_id: number;
  comment: string;
  task_id: string;
  created: string;
  modified: string;
}

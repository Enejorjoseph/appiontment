import type { ChatMessage } from "./ai/booking-agent";
import { getSupabase, throwIfError } from "./supabase";

export interface StoredChatMessage extends ChatMessage {
  id: number;
  createdAt: string;
}

interface ChatMessageRow {
  id: number;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export async function getChatHistory(patientId: number): Promise<StoredChatMessage[]> {
  const { data, error } = await getSupabase().rpc("get_chat_history", {
    p_patient_user_id: patientId,
  });
  throwIfError(error, "Could not load chat history");

  const rows = (data ?? []) as ChatMessageRow[];
  return rows.map((row) => ({
    id: Number(row.id),
    role: row.role,
    content: row.content,
    createdAt: row.created_at,
  }));
}

export async function saveChatMessage(patientId: number, message: ChatMessage): Promise<void> {
  const { error } = await getSupabase().rpc("save_chat_message", {
    p_patient_user_id: patientId,
    p_role: message.role,
    p_content: message.content,
  });
  throwIfError(error, "Could not save chat message");
}

export async function clearChatHistory(patientId: number): Promise<void> {
  const { error } = await getSupabase().rpc("clear_chat_history", {
    p_patient_user_id: patientId,
  });
  throwIfError(error, "Could not clear chat history");
}

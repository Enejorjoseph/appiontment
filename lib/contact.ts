import { getSupabase, throwIfError } from "./supabase";
import { nowIso } from "./datetime";
import type { ContactInput } from "./validation";

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
}

interface ContactRow {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
}

export async function createContactMessage(input: ContactInput): Promise<number> {
  const { data, error } = await getSupabase()
    .from("contact_messages")
    .insert({
      name: input.name,
      email: input.email,
      subject: input.subject,
      message: input.message,
      created_at: nowIso(),
    })
    .select("id")
    .single();
  throwIfError(error, "Could not save your message");
  return Number((data as { id: number }).id);
}

export async function listContactMessages(limit = 50): Promise<ContactMessage[]> {
  const { data, error } = await getSupabase()
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  throwIfError(error, "Could not load messages");
  return (data as ContactRow[]).map((row) => ({
    id: Number(row.id),
    name: row.name,
    email: row.email,
    subject: row.subject,
    message: row.message,
    createdAt: row.created_at,
  }));
}

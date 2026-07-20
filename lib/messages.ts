import type { SupabaseClient } from "@supabase/supabase-js";
import type { Message } from "./types";

export async function getMessages(
  supabase: SupabaseClient,
  boardIds: string[],
): Promise<Message[]> {
  if (boardIds.length === 0) return [];

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .in("board_id", boardIds)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function createMessage(
  supabase: SupabaseClient,
  userId: string,
  boardId: string,
  content: string,
): Promise<Message> {
  const { data, error } = await supabase
    .from("messages")
    .insert({ board_id: boardId, user_id: userId, content })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function deleteMessage(
  supabase: SupabaseClient,
  messageId: string,
): Promise<void> {
  const { error } = await supabase
    .from("messages")
    .delete()
    .eq("id", messageId);

  if (error) throw error;
}

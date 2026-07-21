import type { SupabaseClient } from "@supabase/supabase-js";
import type { Message } from "./types";
import { deleteAttachment } from "./attachments";

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
  params: {
    content?: string | null;
    file?: { path: string; name: string; size: number; type: string };
  },
): Promise<Message> {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      board_id: boardId,
      user_id: userId,
      content: params.content || null,
      file_path: params.file?.path ?? null,
      file_name: params.file?.name ?? null,
      file_size: params.file?.size ?? null,
      file_type: params.file?.type ?? null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function deleteMessage(
  supabase: SupabaseClient,
  message: Message,
): Promise<void> {
  if (message.file_path) {
    await deleteAttachment(supabase, message.file_path);
  }

  const { error } = await supabase
    .from("messages")
    .delete()
    .eq("id", message.id);

  if (error) throw error;
}

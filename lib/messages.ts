import type { SupabaseClient } from "@supabase/supabase-js";
import type { Message } from "./types";
import { deleteAttachment } from "./attachments";
import { sanitizeNoteHtml } from "./editor";

/** Quantas entradas trazer por página. Carregar um quadro inteiro de uma
 * vez (todas as mensagens de todos os quadros, como antes) não escala —
 * cada troca de quadro busca só o que precisa. */
export const MESSAGES_PAGE_SIZE = 60;

export type MessagesPage = { messages: Message[]; hasMore: boolean };

/** Mensagens mais recentes de um único quadro, em ordem cronológica. */
export async function getMessagesForBoard(
  supabase: SupabaseClient,
  boardId: string,
  limit = MESSAGES_PAGE_SIZE,
): Promise<MessagesPage> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("board_id", boardId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  const messages = (data ?? []).reverse();
  return { messages, hasMore: messages.length === limit };
}

/** Página seguinte (mais antiga) de um quadro, a partir da entrada mais
 * antiga já carregada. */
export async function getOlderMessages(
  supabase: SupabaseClient,
  boardId: string,
  beforeCreatedAt: string,
  limit = MESSAGES_PAGE_SIZE,
): Promise<MessagesPage> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("board_id", boardId)
    .lt("created_at", beforeCreatedAt)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  const messages = (data ?? []).reverse();
  return { messages, hasMore: messages.length === limit };
}

/** Caminhos de anexos de um quadro direto do banco — usado ao apagar um
 * quadro que talvez nunca tenha sido aberto nesta sessão (e portanto não
 * está no cache local de mensagens). */
export async function getBoardAttachmentPaths(
  supabase: SupabaseClient,
  boardId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("file_path")
    .eq("board_id", boardId)
    .not("file_path", "is", null);

  if (error) throw error;
  return (data ?? [])
    .map((row) => row.file_path as string | null)
    .filter((path): path is string => Boolean(path));
}

export async function createMessage(
  supabase: SupabaseClient,
  userId: string,
  boardId: string,
  params: {
    content?: string | null;
    contentHtml?: string | null;
    file?: { path: string; name: string; size: number; type: string };
  },
): Promise<Message> {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      board_id: boardId,
      user_id: userId,
      content: params.content || null,
      content_html: sanitizeNoteHtml(params.contentHtml || null),
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

export async function updateMessage(
  supabase: SupabaseClient,
  messageId: string,
  params: { content: string | null; contentHtml: string | null },
): Promise<Message> {
  const { data, error } = await supabase
    .from("messages")
    .update({
      content: params.content || null,
      content_html: sanitizeNoteHtml(params.contentHtml || null),
      updated_at: new Date().toISOString(),
    })
    .eq("id", messageId)
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

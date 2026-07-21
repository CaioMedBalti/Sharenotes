import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "attachments";
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function uploadAttachment(
  supabase: SupabaseClient,
  userId: string,
  file: File,
): Promise<string> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${userId}/${crypto.randomUUID()}-${safeName}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file);
  if (error) throw error;

  return path;
}

export async function getAttachmentDownloadUrl(
  supabase: SupabaseClient,
  path: string,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 60);

  if (error) throw error;
  return data.signedUrl;
}

export async function deleteAttachment(
  supabase: SupabaseClient,
  path: string,
): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw error;
}

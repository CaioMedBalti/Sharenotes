import type { SupabaseClient } from "@supabase/supabase-js";
import type { Board } from "./types";

const DEFAULT_BOARD_NAMES = ["Trabalho", "Pessoal", "Links"];

export async function getBoards(supabase: SupabaseClient): Promise<Board[]> {
  const { data, error } = await supabase
    .from("boards")
    .select("*")
    .order("position", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function seedDefaultBoards(
  supabase: SupabaseClient,
  userId: string,
): Promise<Board[]> {
  const rows = DEFAULT_BOARD_NAMES.map((name, position) => ({
    name,
    position,
    user_id: userId,
  }));

  const { data, error } = await supabase
    .from("boards")
    .insert(rows)
    .select("*");

  if (error) throw error;
  return data ?? [];
}

export async function createBoard(
  supabase: SupabaseClient,
  userId: string,
  name: string,
  position: number,
): Promise<Board> {
  const { data, error } = await supabase
    .from("boards")
    .insert({ name, position, user_id: userId })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

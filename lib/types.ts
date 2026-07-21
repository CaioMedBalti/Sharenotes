export type Board = {
  id: string;
  user_id: string;
  name: string;
  position: number;
  created_at: string;
};

export type Message = {
  id: string;
  board_id: string;
  user_id: string;
  content: string | null;
  file_path: string | null;
  file_name: string | null;
  file_size: number | null;
  file_type: string | null;
  created_at: string;
};

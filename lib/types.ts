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
  content: string;
  created_at: string;
};

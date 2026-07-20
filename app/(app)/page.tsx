import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBoards, seedDefaultBoards } from "@/lib/boards";
import { getMessages } from "@/lib/messages";
import { BoardView } from "@/components/BoardView";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let boards = await getBoards(supabase);
  if (boards.length === 0) {
    boards = await seedDefaultBoards(supabase, user.id);
  }

  const messages = await getMessages(
    supabase,
    boards.map((board) => board.id),
  );

  return (
    <BoardView
      initialBoards={boards}
      initialMessages={messages}
      userId={user.id}
    />
  );
}

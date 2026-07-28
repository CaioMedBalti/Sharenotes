import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getBoards, seedDefaultBoards } from "@/lib/boards";
import { getMessagesForBoard } from "@/lib/messages";
import { BOARD_COOKIE, SIDEBAR_COOKIE } from "@/lib/prefs";
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

  const cookieStore = await cookies();
  const savedBoardId = cookieStore.get(BOARD_COOKIE)?.value;
  const initialBoardId =
    boards.find((board) => board.id === savedBoardId)?.id ??
    boards[0]?.id ??
    null;

  const initialPage = initialBoardId
    ? await getMessagesForBoard(supabase, initialBoardId)
    : { messages: [], hasMore: false };

  const initialSidebarCollapsed =
    cookieStore.get(SIDEBAR_COOKIE)?.value === "1";

  return (
    <BoardView
      initialBoards={boards}
      initialBoardId={initialBoardId}
      initialMessages={initialPage.messages}
      initialHasMore={initialPage.hasMore}
      initialSidebarCollapsed={initialSidebarCollapsed}
      userId={user.id}
      userEmail={user.email ?? ""}
    />
  );
}

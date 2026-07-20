import type { Board } from "@/lib/types";
import { NewBoardForm } from "./NewBoardForm";

export function BoardTabs({
  boards,
  activeBoardId,
  onSelect,
  onAddBoard,
}: {
  boards: Board[];
  activeBoardId: string | null;
  onSelect: (id: string) => void;
  onAddBoard: (name: string) => Promise<void>;
}) {
  return (
    <nav className="flex shrink-0 gap-1 overflow-x-auto border-b border-black/10 bg-neutral-50/60 p-2 dark:border-white/10 dark:bg-neutral-900/40 md:w-56 md:flex-col md:overflow-visible md:border-r md:border-b-0">
      {boards.map((board) => (
        <button
          key={board.id}
          onClick={() => onSelect(board.id)}
          className={`shrink-0 rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
            board.id === activeBoardId
              ? "bg-amber-500 text-white"
              : "text-neutral-600 hover:bg-black/5 dark:text-neutral-300 dark:hover:bg-white/10"
          }`}
        >
          {board.name}
        </button>
      ))}
      <NewBoardForm onAdd={onAddBoard} />
    </nav>
  );
}

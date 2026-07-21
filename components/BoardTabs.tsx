"use client";

import { useState, type KeyboardEvent } from "react";
import type { Board } from "@/lib/types";
import { NewBoardForm } from "./NewBoardForm";

export function BoardTabs({
  boards,
  activeBoardId,
  onSelect,
  onAddBoard,
  onRenameBoard,
  onDeleteBoard,
}: {
  boards: Board[];
  activeBoardId: string | null;
  onSelect: (id: string) => void;
  onAddBoard: (name: string) => Promise<void>;
  onRenameBoard: (id: string, name: string) => Promise<void>;
  onDeleteBoard: (id: string) => Promise<void>;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  function startEditing(board: Board) {
    setEditingId(board.id);
    setEditValue(board.name);
  }

  async function commitEdit() {
    const trimmed = editValue.trim();
    const id = editingId;
    setEditingId(null);
    if (id && trimmed) {
      await onRenameBoard(id, trimmed);
    }
  }

  function handleEditKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      commitEdit();
    }
    if (e.key === "Escape") {
      setEditingId(null);
    }
  }

  function handleDeleteClick(boardId: string) {
    if (confirmingId === boardId) {
      setConfirmingId(null);
      onDeleteBoard(boardId);
      return;
    }
    setConfirmingId(boardId);
    setTimeout(() => {
      setConfirmingId((prev) => (prev === boardId ? null : prev));
    }, 3000);
  }

  return (
    <nav className="flex shrink-0 gap-1 overflow-x-auto border-b border-black/10 bg-neutral-50/60 p-2 dark:border-white/10 dark:bg-neutral-900/40 md:w-56 md:flex-col md:overflow-visible md:border-r md:border-b-0">
      {boards.map((board) => (
        <div key={board.id} className="group flex shrink-0 items-center gap-0.5">
          {editingId === board.id ? (
            <input
              autoFocus
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={handleEditKeyDown}
              className="w-full min-w-0 rounded-lg border border-amber-500 bg-white px-3 py-2 text-sm text-neutral-900 outline-none dark:bg-neutral-800 dark:text-neutral-100"
            />
          ) : (
            <>
              <button
                onClick={() => onSelect(board.id)}
                className={`min-w-0 flex-1 truncate rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                  board.id === activeBoardId
                    ? "bg-amber-500 text-white"
                    : "text-neutral-600 hover:bg-black/5 dark:text-neutral-300 dark:hover:bg-white/10"
                }`}
              >
                {board.name}
              </button>
              <div className="flex shrink-0 gap-0.5 opacity-100 transition md:opacity-0 md:group-hover:opacity-100">
                <button
                  onClick={() => startEditing(board)}
                  title="Renomear quadro"
                  className="rounded-md px-1.5 py-1.5 text-xs text-neutral-400 hover:bg-black/5 dark:hover:bg-white/10"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDeleteClick(board.id)}
                  title="Excluir quadro"
                  className={`rounded-md px-1.5 py-1.5 text-xs transition ${
                    confirmingId === board.id
                      ? "bg-red-500 text-white"
                      : "text-neutral-400 hover:bg-black/5 dark:hover:bg-white/10"
                  }`}
                >
                  {confirmingId === board.id ? "?" : "🗑️"}
                </button>
              </div>
            </>
          )}
        </div>
      ))}
      <NewBoardForm onAdd={onAddBoard} />
    </nav>
  );
}

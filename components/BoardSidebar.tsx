"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { Board } from "@/lib/types";
import { NewBoardForm } from "./NewBoardForm";

export function BoardSidebar({
  boards,
  activeBoardId,
  onSelect,
  onAddBoard,
  onRenameBoard,
  onDeleteBoard,
  mobileOpen,
  desktopCollapsed,
  onCloseMobile,
  staleBoardIds,
}: {
  boards: Board[];
  activeBoardId: string | null;
  onSelect: (id: string) => void;
  onAddBoard: (name: string) => Promise<void>;
  onRenameBoard: (id: string, name: string) => Promise<void>;
  onDeleteBoard: (id: string) => Promise<void>;
  mobileOpen: boolean;
  desktopCollapsed: boolean;
  onCloseMobile: () => void;
  staleBoardIds?: Set<string>;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!mobileOpen) return;

    document.body.style.overflow = "hidden";
    const firstButton = navRef.current?.querySelector<HTMLElement>("button");
    firstButton?.focus();

    function handleEscape(e: globalThis.KeyboardEvent) {
      if (e.key === "Escape") onCloseMobile();
    }
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleEscape);
    };
  }, [mobileOpen, onCloseMobile]);

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

  function handleSelect(boardId: string) {
    onSelect(boardId);
    onCloseMobile();
  }

  return (
    <>
      {mobileOpen && (
        <button
          aria-label="Fechar menu de quadros"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px] md:hidden"
        />
      )}
      <nav
        ref={navRef}
        aria-label="Quadros"
        className={`fixed inset-y-0 left-0 z-50 flex w-72 shrink-0 flex-col gap-1 overflow-y-auto border-r border-hairline bg-paper-surface p-2 transition-transform duration-200 ease-out ${
          mobileOpen ? "translate-x-0 shadow-xl" : "-translate-x-full"
        } md:static md:z-auto md:translate-x-0 md:shadow-none md:transition-[width,padding,border-color] ${
          desktopCollapsed
            ? "md:w-0 md:overflow-hidden md:border-r-0 md:p-0"
            : "md:w-64"
        }`}
      >
        {boards.map((board) => (
          <div
            key={board.id}
            className="group flex shrink-0 items-center gap-2 md:gap-0.5"
          >
            {editingId === board.id ? (
              <input
                autoFocus
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={handleEditKeyDown}
                className="h-11 w-full min-w-0 rounded-lg border border-accent bg-paper-surface px-3 text-sm text-ink outline-none md:h-9"
              />
            ) : (
              <>
                <button
                  onClick={() => handleSelect(board.id)}
                  className={`flex h-11 min-w-0 flex-1 flex-col items-start justify-center truncate rounded-lg px-3 text-left text-sm font-medium transition md:h-9 md:justify-center ${
                    board.id === activeBoardId
                      ? "bg-accent text-accent-contrast"
                      : "text-ink-muted hover:bg-hairline"
                  }`}
                >
                  <span className="truncate">{board.name}</span>
                  {staleBoardIds?.has(board.id) && (
                    <span
                      className={`text-[10px] font-normal ${board.id === activeBoardId ? "text-accent-contrast/70" : "text-ink-faint"}`}
                    >
                      parado há um tempo
                    </span>
                  )}
                </button>
                <div className="flex shrink-0 gap-2 opacity-100 transition md:gap-0.5 md:opacity-0 md:group-hover:opacity-100">
                  <button
                    onClick={() => startEditing(board)}
                    title="Renomear quadro"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-base text-ink-faint hover:bg-hairline md:h-7 md:w-7 md:text-xs"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDeleteClick(board.id)}
                    title="Excluir quadro"
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-base transition md:h-7 md:w-7 md:text-xs ${
                      confirmingId === board.id
                        ? "bg-red-500 text-white"
                        : "text-ink-faint hover:bg-hairline"
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
    </>
  );
}

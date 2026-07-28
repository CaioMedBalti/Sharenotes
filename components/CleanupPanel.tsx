"use client";

import { useState } from "react";
import type { BoardActivity } from "@/lib/boards";
import type { Board } from "@/lib/types";

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function CleanupPanel({
  boards,
  activity,
  onClose,
  onDeleteBoards,
}: {
  boards: Board[];
  activity: BoardActivity[];
  onClose: () => void;
  onDeleteBoards: (boardIds: string[]) => Promise<void>;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const activityByBoard = new Map(activity.map((a) => [a.board_id, a]));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleDelete() {
    if (selected.size === 0) return;
    setDeleting(true);
    try {
      await onDeleteBoards([...selected]);
      onClose();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl border border-hairline bg-paper-surface p-5 shadow-xl">
        <h2 className="text-base font-semibold text-ink">Quadros parados</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Sem atividade há mais de 60 dias. Selecione os que quer apagar — os
          anexos também são removidos.
        </p>
        <div className="mt-4 max-h-64 space-y-1 overflow-y-auto">
          {boards.map((board) => {
            const info = activityByBoard.get(board.id);
            return (
              <label
                key={board.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-hairline"
              >
                <input
                  type="checkbox"
                  checked={selected.has(board.id)}
                  onChange={() => toggle(board.id)}
                  className="h-4 w-4 accent-accent"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink">{board.name}</p>
                  <p className="text-xs text-ink-faint">
                    {info?.message_count ?? 0} entrada(s) — última em{" "}
                    {formatDate(info?.last_activity_at)}
                  </p>
                </div>
              </label>
            );
          })}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-ink-muted hover:bg-hairline"
          >
            Cancelar
          </button>
          <button
            onClick={handleDelete}
            disabled={selected.size === 0 || deleting}
            className="rounded-lg bg-red-500 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {deleting
              ? "Apagando…"
              : selected.size
                ? `Apagar (${selected.size})`
                : "Apagar"}
          </button>
        </div>
      </div>
    </div>
  );
}

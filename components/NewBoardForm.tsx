"use client";

import { useState, type FormEvent } from "react";

export function NewBoardForm({
  onAdd,
}: {
  onAdd: (name: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      await onAdd(trimmed);
      setName("");
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="shrink-0 rounded-lg px-3 py-2 text-left text-sm font-medium text-neutral-400 transition hover:bg-black/5 hover:text-neutral-600 dark:hover:bg-white/10 dark:hover:text-neutral-300"
      >
        + Novo quadro
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex shrink-0 gap-1 p-1">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => !name && setOpen(false)}
        placeholder="Nome do quadro"
        className="w-full min-w-0 rounded-lg border border-black/10 bg-white px-2 py-1 text-sm text-neutral-900 outline-none focus:border-amber-500 dark:border-white/10 dark:bg-neutral-800 dark:text-neutral-100"
      />
      <button
        type="submit"
        disabled={busy}
        className="shrink-0 rounded-lg bg-amber-500 px-2 py-1 text-sm font-medium text-white disabled:opacity-60"
      >
        OK
      </button>
    </form>
  );
}

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
        className="flex h-11 shrink-0 items-center rounded-lg px-3 text-left text-sm font-medium text-ink-faint transition hover:bg-hairline hover:text-ink-muted md:h-9"
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
        className="w-full min-w-0 rounded-lg border border-hairline bg-paper-surface px-2 py-1 text-sm text-ink outline-none focus:border-accent"
      />
      <button
        type="submit"
        disabled={busy}
        className="shrink-0 rounded-lg bg-accent px-2 py-1 text-sm font-medium text-accent-contrast disabled:opacity-60"
      >
        OK
      </button>
    </form>
  );
}

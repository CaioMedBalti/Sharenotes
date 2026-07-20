"use client";

import { useState } from "react";
import type { Message } from "@/lib/types";

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MessageItem({
  message,
  onDelete,
}: {
  message: Message;
  onDelete: (id: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleDeleteClick() {
    if (confirmingDelete) {
      onDelete(message.id);
      return;
    }
    setConfirmingDelete(true);
    setTimeout(() => setConfirmingDelete(false), 3000);
  }

  return (
    <div className="group max-w-2xl rounded-2xl border border-black/10 bg-white px-4 py-3 shadow-sm dark:border-white/10 dark:bg-neutral-900">
      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-neutral-800 dark:text-neutral-100">
        {message.content}
      </p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="text-xs text-neutral-400">
          {formatTime(message.created_at)}
        </span>
        <div className="flex gap-2 opacity-100 transition md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100">
          <button
            onClick={handleCopy}
            className="rounded-md px-2 py-1 text-xs font-medium text-neutral-500 hover:bg-black/5 dark:text-neutral-400 dark:hover:bg-white/10"
          >
            {copied ? "Copiado!" : "Copiar"}
          </button>
          <button
            onClick={handleDeleteClick}
            className={`rounded-md px-2 py-1 text-xs font-medium transition ${
              confirmingDelete
                ? "bg-red-500 text-white"
                : "text-neutral-500 hover:bg-black/5 dark:text-neutral-400 dark:hover:bg-white/10"
            }`}
          >
            {confirmingDelete ? "Confirmar?" : "Apagar"}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import type { Message } from "@/lib/types";
import { getAttachmentDownloadUrl } from "@/lib/attachments";
import { formatFileSize } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";

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
  onDelete: (message: Message) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const supabase = useMemo(() => createClient(), []);

  async function handleCopy() {
    if (!message.content) return;
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleDownload() {
    if (!message.file_path || !message.file_name) return;
    setDownloading(true);
    try {
      const url = await getAttachmentDownloadUrl(supabase, message.file_path);
      const a = document.createElement("a");
      a.href = url;
      a.download = message.file_name;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      setDownloading(false);
    }
  }

  function handleDeleteClick() {
    if (confirmingDelete) {
      onDelete(message);
      return;
    }
    setConfirmingDelete(true);
    setTimeout(() => setConfirmingDelete(false), 3000);
  }

  return (
    <div className="group max-w-2xl rounded-2xl border border-black/10 bg-white px-4 py-3 shadow-sm dark:border-white/10 dark:bg-neutral-900">
      {message.content && (
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-neutral-800 dark:text-neutral-100">
          {message.content}
        </p>
      )}

      {message.file_path && message.file_name && (
        <div
          className={`flex items-center gap-3 rounded-xl border border-black/10 bg-neutral-50 px-3 py-2 dark:border-white/10 dark:bg-neutral-800 ${message.content ? "mt-2" : ""}`}
        >
          <span className="text-xl">📎</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-neutral-800 dark:text-neutral-100">
              {message.file_name}
            </p>
            {message.file_size != null && (
              <p className="text-xs text-neutral-400">
                {formatFileSize(message.file_size)}
              </p>
            )}
          </div>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="shrink-0 rounded-md bg-amber-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-amber-600 disabled:opacity-60"
          >
            {downloading ? "..." : "Baixar"}
          </button>
        </div>
      )}

      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="text-xs text-neutral-400">
          {formatTime(message.created_at)}
        </span>
        <div className="flex gap-2 opacity-100 transition md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100">
          {message.content && (
            <button
              onClick={handleCopy}
              className="rounded-md px-2 py-1 text-xs font-medium text-neutral-500 hover:bg-black/5 dark:text-neutral-400 dark:hover:bg-white/10"
            >
              {copied ? "Copiado!" : "Copiar"}
            </button>
          )}
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

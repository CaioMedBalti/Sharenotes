"use client";

import { useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { MAX_FILE_SIZE } from "@/lib/attachments";
import { formatFileSize } from "@/lib/format";

export function NewMessageForm({
  onSend,
  disabled,
}: {
  onSend: (params: { content: string; file?: File }) => Promise<void>;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function submit() {
    const trimmed = value.trim();
    if (!trimmed && !file) return;

    const fileToSend = file ?? undefined;
    setValue("");
    setFile(null);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    await onSend({ content: trimmed, file: fileToSend });
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function handleInput() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    e.target.value = "";
    if (!selected) return;

    if (selected.size > MAX_FILE_SIZE) {
      setError(`Arquivo muito grande (máx. ${formatFileSize(MAX_FILE_SIZE)}).`);
      return;
    }

    setError(null);
    setFile(selected);
  }

  return (
    <div className="shrink-0 border-t border-black/10 p-3 dark:border-white/10">
      {file && (
        <div className="mb-2 flex items-center justify-between gap-2 rounded-lg border border-black/10 bg-neutral-50 px-3 py-1.5 text-xs dark:border-white/10 dark:bg-neutral-800">
          <span className="truncate text-neutral-600 dark:text-neutral-300">
            📎 {file.name} ({formatFileSize(file.size)})
          </span>
          <button
            onClick={() => setFile(null)}
            className="shrink-0 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
          >
            Remover
          </button>
        </div>
      )}
      {error && <p className="mb-2 text-xs text-red-500">{error}</p>}
      <div className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          title="Anexar arquivo"
          className="shrink-0 rounded-xl border border-black/10 px-3 py-2 text-sm text-neutral-500 transition hover:bg-black/5 disabled:opacity-40 dark:border-white/10 dark:text-neutral-400 dark:hover:bg-white/10"
        >
          📎
        </button>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            handleInput();
          }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={1}
          placeholder="Escreva, cole ou anexe um arquivo... (Enter envia, Shift+Enter quebra linha)"
          className="max-h-[200px] flex-1 resize-none rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-amber-500 disabled:opacity-60 dark:border-white/10 dark:bg-neutral-800 dark:text-neutral-100"
        />
        <button
          onClick={submit}
          disabled={disabled || (!value.trim() && !file)}
          className="shrink-0 rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}

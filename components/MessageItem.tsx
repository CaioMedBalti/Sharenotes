"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { EditorContent } from "@tiptap/react";
import type { Message } from "@/lib/types";
import { getAttachmentDownloadUrl } from "@/lib/attachments";
import { formatFileSize } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { updateMessage } from "@/lib/messages";
import {
  EMPTY_HTML,
  getPlainText,
  plainTextToHtml,
  useNoteEditor,
} from "@/lib/editor";
import { useAutosave } from "@/lib/useAutosave";

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const EDIT_EDITOR_CLASS =
  "min-h-[1.5em] text-base leading-relaxed text-ink outline-none md:text-sm";

function MessageItemImpl({
  message,
  onDelete,
  onUpdate,
}: {
  message: Message;
  onDelete: (message: Message) => void;
  onUpdate: (message: Message) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [editing, setEditing] = useState(false);

  const supabase = useMemo(() => createClient(), []);
  const isTextEditable = Boolean(message.content || message.content_html);

  const { status, schedule, flush } = useAutosave<{
    content: string;
    contentHtml: string | null;
  }>(async ({ content, contentHtml }) => {
    const updated = await updateMessage(supabase, message.id, {
      content,
      contentHtml,
    });
    onUpdate(updated);
  });

  const editor = useNoteEditor({
    editable: editing,
    className: EDIT_EDITOR_CLASS,
    content:
      message.content_html ?? plainTextToHtml(message.content ?? ""),
    onUpdate: (ed) => {
      if (!editing) return;
      const html = ed.getHTML();
      schedule({
        content: getPlainText(ed),
        contentHtml: html === EMPTY_HTML ? null : html,
      });
    },
  });

  // `editable` no useEditor só vale na criação do editor — o Tiptap ignora
  // mudanças nesse valor via re-render pra não conflitar com controle
  // imperativo, então alternar precisa ser explícito via setEditable().
  useEffect(() => {
    editor?.setEditable(editing);
  }, [editing, editor]);

  function startEditing() {
    if (!isTextEditable) return;
    setEditing(true);
    setTimeout(() => editor?.commands.focus("end"), 0);
  }

  function stopEditing() {
    flush();
    setEditing(false);
    editor?.commands.blur();
  }

  async function handleCopy() {
    if (message.content_html) {
      try {
        const htmlBlob = new Blob([message.content_html], {
          type: "text/html",
        });
        const textBlob = new Blob([message.content ?? ""], {
          type: "text/plain",
        });
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": htmlBlob,
            "text/plain": textBlob,
          }),
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
        return;
      } catch {
        // Navegador sem suporte a ClipboardItem/HTML — cai pro texto puro abaixo.
      }
    }

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
    <div className="group max-w-2xl border-b border-hairline px-1 py-4 first:pt-1">
      {editing ? (
        <EditorContent
          editor={editor}
          className="rich-content"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              stopEditing();
            }
          }}
          onBlur={stopEditing}
        />
      ) : message.content_html ? (
        <div
          onClick={startEditing}
          className="rich-content cursor-text whitespace-pre-wrap break-words text-sm text-ink"
          dangerouslySetInnerHTML={{ __html: message.content_html }}
        />
      ) : (
        message.content && (
          <p
            onClick={startEditing}
            className="cursor-text whitespace-pre-wrap break-words text-sm leading-[1.7] text-ink"
          >
            {message.content}
          </p>
        )
      )}

      {message.file_path && message.file_name && (
        <div
          className={`flex items-center gap-3 rounded-xl border border-hairline bg-paper px-3 py-2 ${message.content || message.content_html ? "mt-3" : ""}`}
        >
          <span className="text-xl">📎</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">
              {message.file_name}
            </p>
            {message.file_size != null && (
              <p className="text-xs text-ink-faint">
                {formatFileSize(message.file_size)}
              </p>
            )}
          </div>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex h-11 shrink-0 items-center justify-center rounded-md bg-accent px-3 text-xs font-medium text-accent-contrast transition hover:bg-accent-strong disabled:opacity-60 md:h-8"
          >
            {downloading ? "..." : "Baixar"}
          </button>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-xs text-ink-faint">
          {formatTime(message.created_at)}
          {editing && (
            <span className="ml-2 text-accent">
              {status === "saving"
                ? "Salvando…"
                : status === "error"
                  ? "Erro ao salvar"
                  : status === "saved"
                    ? "Salvo"
                    : ""}
            </span>
          )}
        </span>
        <div className="flex gap-3 opacity-100 transition md:gap-2 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100">
          {isTextEditable && !editing && (
            <button
              onClick={startEditing}
              className="flex h-11 min-w-11 items-center justify-center rounded-md px-3 text-xs font-medium text-ink-muted hover:bg-hairline md:h-7 md:min-w-0 md:px-2"
            >
              Editar
            </button>
          )}
          {(message.content || message.content_html) && (
            <button
              onClick={handleCopy}
              className="flex h-11 min-w-11 items-center justify-center rounded-md px-3 text-xs font-medium text-ink-muted hover:bg-hairline md:h-7 md:min-w-0 md:px-2"
            >
              {copied ? "Copiado!" : "Copiar"}
            </button>
          )}
          <button
            onClick={handleDeleteClick}
            className={`flex h-11 min-w-11 items-center justify-center rounded-md px-3 text-xs font-medium transition md:h-7 md:min-w-0 md:px-2 ${
              confirmingDelete
                ? "bg-red-500 text-white"
                : "text-ink-muted hover:bg-hairline"
            }`}
          >
            {confirmingDelete ? "Confirmar?" : "Apagar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export const MessageItem = memo(MessageItemImpl);

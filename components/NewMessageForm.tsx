"use client";

import { EditorContent, useEditorState } from "@tiptap/react";
import { useRef, useState, type ChangeEvent } from "react";
import { MAX_FILE_SIZE } from "@/lib/attachments";
import { formatFileSize, getErrorMessage } from "@/lib/format";
import { EMPTY_HTML, getPlainText, useNoteEditor } from "@/lib/editor";
import { clearDraft, loadDraft, saveDraft } from "@/lib/drafts";

const EDITOR_CLASS =
  "max-h-[35vh] min-h-[42px] overflow-y-auto rounded-xl border border-hairline bg-paper-surface px-3 py-2 text-base text-ink outline-none transition focus:border-accent md:text-sm";

export function NewMessageForm({
  boardId,
  onSend,
  disabled,
}: {
  boardId: string;
  onSend: (params: {
    content: string;
    contentHtml: string | null;
    file?: File;
  }) => Promise<void>;
  disabled?: boolean;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const draftTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [initialContent] = useState(() => loadDraft(boardId) ?? undefined);

  const editor = useNoteEditor({
    placeholder: "Escreva, cole ou anexe um arquivo... (Ctrl+Enter salva)",
    className: EDITOR_CLASS,
    content: initialContent,
    onSubmit: submit,
    onUpdate: (ed) => {
      if (draftTimeoutRef.current) clearTimeout(draftTimeoutRef.current);
      draftTimeoutRef.current = setTimeout(() => {
        const html = ed.getHTML();
        if (html === EMPTY_HTML) clearDraft(boardId);
        else saveDraft(boardId, html);
      }, 400);
    },
  });

  async function submit() {
    if (!editor) return;
    const text = getPlainText(editor).trim();
    if (!text && !file) return;

    const html = editor.getHTML();
    const fileToSend = file ?? undefined;
    editor.commands.clearContent();
    editor.commands.focus();
    if (draftTimeoutRef.current) clearTimeout(draftTimeoutRef.current);
    clearDraft(boardId);
    setFile(null);
    setError(null);
    try {
      await onSend({
        content: text,
        contentHtml: html === EMPTY_HTML ? null : html,
        file: fileToSend,
      });
    } catch (err) {
      // Falhou salvar — devolve o texto e o arquivo pro usuário, nada se perde.
      editor.commands.setContent(html);
      saveDraft(boardId, html);
      setFile(fileToSend ?? null);
      console.error("Falha ao salvar mensagem:", err);
      setError(`Não foi possível salvar: ${getErrorMessage(err)}`);
    }
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

  const isEmpty = useEditorState({
    editor,
    selector: ({ editor: ed }) => ed?.isEmpty ?? true,
  });

  const canSend = Boolean(editor && (!isEmpty || file) && !disabled);

  return (
    <div
      className="shrink-0 border-t border-hairline bg-paper p-3"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      {file && (
        <div className="mb-2 flex items-center justify-between gap-2 rounded-lg border border-hairline bg-paper-surface px-3 py-1.5 text-xs">
          <span className="truncate text-ink-muted">
            📎 {file.name} ({formatFileSize(file.size)})
          </span>
          <button
            onClick={() => setFile(null)}
            className="shrink-0 text-ink-faint hover:text-ink-muted"
          >
            Remover
          </button>
        </div>
      )}
      {error && <p className="mb-2 text-xs text-red-500">{error}</p>}
      <div className="flex items-end gap-3 md:gap-2">
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
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-hairline text-base text-ink-muted transition hover:bg-hairline disabled:opacity-40 md:h-8 md:w-8 md:text-sm"
        >
          📎
        </button>
        <EditorContent editor={editor} className="min-w-0 flex-1" />
        <button
          onClick={() => submit()}
          disabled={!canSend}
          title="Ctrl/Cmd+Enter também salva"
          className="flex h-11 shrink-0 items-center justify-center rounded-xl bg-accent px-4 text-sm font-medium text-accent-contrast transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-40 md:h-9"
        >
          Salvar
        </button>
      </div>
    </div>
  );
}

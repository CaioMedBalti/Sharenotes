"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useRef, useState, type ChangeEvent } from "react";
import { MAX_FILE_SIZE } from "@/lib/attachments";
import { formatFileSize } from "@/lib/format";

const EMPTY_HTML = "<p></p>";

function isAllowedLinkUri(
  url: string,
  ctx: { defaultValidate: (url: string) => boolean },
) {
  try {
    const { protocol } = new URL(url, window.location.origin);
    return (
      ["http:", "https:", "mailto:"].includes(protocol) &&
      ctx.defaultValidate(url)
    );
  } catch {
    return false;
  }
}

export function NewMessageForm({
  onSend,
  disabled,
}: {
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

  async function submit(editorInstance: Editor) {
    const text = editorInstance.getText().trim();
    if (!text && !file) return;

    const html = editorInstance.getHTML();
    const fileToSend = file ?? undefined;
    editorInstance.commands.clearContent();
    setFile(null);
    await onSend({
      content: text,
      contentHtml: html === EMPTY_HTML ? null : html,
      file: fileToSend,
    });
  }

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        horizontalRule: false,
        codeBlock: false,
        link: {
          openOnClick: false,
          autolink: true,
          linkOnPaste: true,
          HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" },
          isAllowedUri: isAllowedLinkUri,
        },
      }),
      Placeholder.configure({
        placeholder: "Escreva, cole ou anexe um arquivo...",
      }),
    ],
    editorProps: {
      attributes: {
        class:
          "max-h-40 min-h-[42px] overflow-y-auto rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-amber-500 dark:border-white/10 dark:bg-neutral-800 dark:text-neutral-100 [&_p]:m-0 [&_.is-editor-empty:first-child::before]:pointer-events-none [&_.is-editor-empty:first-child::before]:float-left [&_.is-editor-empty:first-child::before]:h-0 [&_.is-editor-empty:first-child::before]:text-neutral-400 [&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
      },
      handleKeyDown: (_view, event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          if (editor) submit(editor);
          return true;
        }
        return false;
      },
    },
  });

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

  const canSend = Boolean(editor && (!editor.isEmpty || file) && !disabled);

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
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-black/10 text-base text-neutral-500 transition hover:bg-black/5 disabled:opacity-40 md:h-8 md:w-8 md:text-sm dark:border-white/10 dark:text-neutral-400 dark:hover:bg-white/10"
        >
          📎
        </button>
        <EditorContent editor={editor} className="min-w-0 flex-1" />
        <button
          onClick={() => editor && submit(editor)}
          disabled={!canSend}
          className="flex h-11 shrink-0 items-center justify-center rounded-xl bg-amber-500 px-4 text-sm font-medium text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-40 md:h-9"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}

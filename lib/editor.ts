"use client";

import { useEditor, type Editor } from "@tiptap/react";
import { generateHTML, generateJSON } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";

export const EMPTY_HTML = "<p></p>";

export function isAllowedLinkUri(
  url: string,
  ctx: { defaultValidate: (url: string) => boolean },
) {
  try {
    const { protocol } = new URL(
      url,
      typeof window !== "undefined" ? window.location.origin : "http://localhost",
    );
    return (
      ["http:", "https:", "mailto:"].includes(protocol) &&
      ctx.defaultValidate(url)
    );
  } catch {
    return false;
  }
}

export function noteExtensions(placeholder?: string) {
  return [
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
      placeholder: placeholder ?? "Escreva algo...",
    }),
  ];
}

/**
 * Texto puro preservando quebras de linha simples. O padrão do Tiptap junta
 * blocos com "\n\n", o que dobra o espaçamento de um texto colado com
 * vários parágrafos.
 */
export function getPlainText(editor: Editor) {
  return editor.getText({ blockSeparator: "\n" });
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Converte texto puro (entradas antigas, de antes do `content_html`) num
 * HTML que o editor consegue abrir pra edição — um parágrafo por linha.
 */
export function plainTextToHtml(text: string): string {
  if (!text) return EMPTY_HTML;
  return text
    .split("\n")
    .map((line) => `<p>${escapeHtml(line) || "<br>"}</p>`)
    .join("");
}

/**
 * Re-parseia um HTML pelo schema de nota antes de persistir: só sobrevive o
 * que o próprio editor sabe produzir (negrito, itálico, listas, links...).
 * Fecha a porta pro `dangerouslySetInnerHTML` do lado da leitura, mesmo que
 * o HTML chegue de um caminho que não passou pelo ProseMirror.
 */
export function sanitizeNoteHtml(html: string | null): string | null {
  if (!html || html === EMPTY_HTML) return html;
  try {
    const extensions = noteExtensions();
    const json = generateJSON(html, extensions);
    return generateHTML(json, extensions);
  } catch {
    return html;
  }
}

const EDITOR_PROPS_BASE_CLASS =
  "[&_p]:m-0 [&_.is-editor-empty:first-child::before]:pointer-events-none [&_.is-editor-empty:first-child::before]:float-left [&_.is-editor-empty:first-child::before]:h-0 [&_.is-editor-empty:first-child::before]:text-neutral-400 [&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]";

/**
 * Editor Tiptap compartilhado pelo composer e pela edição inline das
 * entradas. Enter sempre quebra linha / cria item de lista (comportamento
 * nativo do ProseMirror) — o commit é Ctrl/Cmd+Enter, chamando `onSubmit`.
 */
export function useNoteEditor({
  placeholder,
  className,
  content,
  editable = true,
  onSubmit,
  onUpdate,
}: {
  placeholder?: string;
  className?: string;
  content?: string;
  editable?: boolean;
  onSubmit?: () => void;
  onUpdate?: (editor: Editor) => void;
}) {
  return useEditor({
    immediatelyRender: false,
    editable,
    content,
    extensions: noteExtensions(placeholder),
    editorProps: {
      attributes: {
        class: `${className ?? ""} ${EDITOR_PROPS_BASE_CLASS}`.trim(),
      },
      handleKeyDown: (_view, event) => {
        if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
          event.preventDefault();
          onSubmit?.();
          return true;
        }
        return false;
      },
    },
    onUpdate: onUpdate ? ({ editor }) => onUpdate(editor) : undefined,
  });
}

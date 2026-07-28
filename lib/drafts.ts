"use client";

// Rascunho do composer, por quadro, guardado localmente. É a garantia de
// "nunca perde o que digitei/colei": mesmo antes de virar uma entrada
// salva no servidor, o texto sobrevive a um recarregamento da página.
const PREFIX = "notas.draft.";

export function loadDraft(boardId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(PREFIX + boardId);
  } catch {
    return null;
  }
}

export function saveDraft(boardId: string, html: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREFIX + boardId, html);
  } catch {
    // localStorage indisponível (modo privado, quota cheia) — perde só o
    // rascunho local, a entrada em si continua indo pro servidor normal.
  }
}

export function clearDraft(boardId: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PREFIX + boardId);
  } catch {
    // ver comentário acima
  }
}

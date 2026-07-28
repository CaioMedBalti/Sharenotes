// Preferências locais do app. Cookie (não localStorage) porque a página
// inicial é um Server Component: ler o cookie no servidor deixa renderizar
// direto no último quadro usado, sem piscar o primeiro quadro no meio.

export const BOARD_COOKIE = "notas_board";
export const SIDEBAR_COOKIE = "notas_sidebar";
const ONE_YEAR = 60 * 60 * 24 * 365;

function setCookie(name: string, value: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
}

export function setActiveBoardCookie(boardId: string) {
  setCookie(BOARD_COOKIE, boardId);
}

export function setSidebarCollapsedCookie(collapsed: boolean) {
  setCookie(SIDEBAR_COOKIE, collapsed ? "1" : "0");
}

// Aviso de "quadros parados": dispensar adia por 30 dias, não silencia pra
// sempre — se ficar mais tempo parado, vale lembrar de novo.
const STALE_NOTICE_KEY = "notas.staleNoticeDismissedUntil";
const DISMISS_DAYS = 30;

export function dismissStaleBoardsNotice() {
  if (typeof window === "undefined") return;
  try {
    const until = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
    window.localStorage.setItem(STALE_NOTICE_KEY, String(until));
  } catch {
    // sem localStorage — o aviso só volta a aparecer nesta sessão
  }
}

export function isStaleBoardsNoticeDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const until = Number(window.localStorage.getItem(STALE_NOTICE_KEY));
    return Number.isFinite(until) && until > Date.now();
  } catch {
    return false;
  }
}

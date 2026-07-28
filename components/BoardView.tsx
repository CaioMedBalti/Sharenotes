"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  createBoard,
  deleteBoard,
  getBoardActivity,
  renameBoard,
  type BoardActivity,
} from "@/lib/boards";
import {
  createMessage,
  deleteMessage,
  getBoardAttachmentPaths,
  getMessagesForBoard,
  getOlderMessages,
} from "@/lib/messages";
import { deleteAttachment, uploadAttachment } from "@/lib/attachments";
import {
  dismissStaleBoardsNotice,
  isStaleBoardsNoticeDismissed,
  setActiveBoardCookie,
  setSidebarCollapsedCookie,
} from "@/lib/prefs";
import type { Board, Message } from "@/lib/types";
import { BoardSidebar } from "./BoardSidebar";
import { CleanupPanel } from "./CleanupPanel";
import { MessageList } from "./MessageList";
import { NewMessageForm } from "./NewMessageForm";
import { SignOutButton } from "./SignOutButton";

const STALE_DAYS = 60;

export function BoardView({
  initialBoards,
  initialBoardId,
  initialMessages,
  initialHasMore,
  initialSidebarCollapsed,
  userId,
  userEmail,
}: {
  initialBoards: Board[];
  initialBoardId: string | null;
  initialMessages: Message[];
  initialHasMore: boolean;
  initialSidebarCollapsed: boolean;
  userId: string;
  userEmail: string;
}) {
  const [boards, setBoards] = useState(initialBoards);
  const [activeBoardId, setActiveBoardId] = useState<string | null>(
    initialBoardId,
  );
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(
    initialSidebarCollapsed,
  );
  const [messagesByBoard, setMessagesByBoard] = useState<
    Record<string, Message[]>
  >(() => (initialBoardId ? { [initialBoardId]: initialMessages } : {}));
  const [hasMoreByBoard, setHasMoreByBoard] = useState<
    Record<string, boolean>
  >(() => (initialBoardId ? { [initialBoardId]: initialHasMore } : {}));
  const [loadingBoardId, setLoadingBoardId] = useState<string | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [sending, setSending] = useState(false);
  const [boardActivity, setBoardActivity] = useState<BoardActivity[]>([]);
  const [noticeDismissed, setNoticeDismissed] = useState(true);
  const [showCleanupPanel, setShowCleanupPanel] = useState(false);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    setNoticeDismissed(isStaleBoardsNoticeDismissed());
    // Depende da view `board_activity` (supabase-migration-notes.sql) — se
    // ainda não foi rodada, falha em silêncio e o aviso simplesmente não
    // aparece, sem quebrar o resto do app.
    getBoardActivity(supabase)
      .then(setBoardActivity)
      .catch(() => {});
  }, [supabase]);

  const staleBoardIds = useMemo(() => {
    const cutoff = Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000;
    const stale = new Set<string>();
    for (const entry of boardActivity) {
      if (new Date(entry.last_activity_at).getTime() < cutoff) {
        stale.add(entry.board_id);
      }
    }
    return stale;
  }, [boardActivity]);

  function handleDismissStaleNotice() {
    dismissStaleBoardsNotice();
    setNoticeDismissed(true);
  }

  async function handleDeleteBoards(boardIds: string[]) {
    for (const boardId of boardIds) {
      await handleDeleteBoard(boardId);
    }
    getBoardActivity(supabase)
      .then(setBoardActivity)
      .catch(() => {});
  }

  const activeBoard = boards.find((board) => board.id === activeBoardId);

  function toggleSidebar() {
    const isDesktop =
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 768px)").matches;
    if (isDesktop) {
      setDesktopSidebarCollapsed((prev) => {
        const next = !prev;
        setSidebarCollapsedCookie(next);
        return next;
      });
    } else {
      setMobileSidebarOpen((prev) => !prev);
    }
  }

  const activeMessages = activeBoardId
    ? (messagesByBoard[activeBoardId] ?? [])
    : [];
  const hasMore = activeBoardId ? (hasMoreByBoard[activeBoardId] ?? false) : false;
  const isLoadingActive = loadingBoardId === activeBoardId;

  const handleSelectBoard = useCallback(
    (boardId: string) => {
      setActiveBoardId(boardId);
      setActiveBoardCookie(boardId);

      if (messagesByBoard[boardId] !== undefined) return;

      setLoadingBoardId(boardId);
      getMessagesForBoard(supabase, boardId)
        .then(({ messages, hasMore: more }) => {
          setMessagesByBoard((prev) => ({ ...prev, [boardId]: messages }));
          setHasMoreByBoard((prev) => ({ ...prev, [boardId]: more }));
        })
        .finally(() => {
          setLoadingBoardId((prev) => (prev === boardId ? null : prev));
        });
    },
    [messagesByBoard, supabase],
  );

  const handleLoadOlder = useCallback(async () => {
    if (!activeBoardId) return;
    const current = messagesByBoard[activeBoardId] ?? [];
    const oldest = current[0];
    if (!oldest) return;

    setLoadingOlder(true);
    try {
      const { messages: older, hasMore: more } = await getOlderMessages(
        supabase,
        activeBoardId,
        oldest.created_at,
      );
      setMessagesByBoard((prev) => ({
        ...prev,
        [activeBoardId]: [...older, ...(prev[activeBoardId] ?? [])],
      }));
      setHasMoreByBoard((prev) => ({ ...prev, [activeBoardId]: more }));
    } finally {
      setLoadingOlder(false);
    }
  }, [activeBoardId, messagesByBoard, supabase]);

  async function handleAddBoard(name: string) {
    const position = boards.length
      ? Math.max(...boards.map((board) => board.position)) + 1
      : 0;
    const board = await createBoard(supabase, userId, name, position);
    setBoards((prev) => [...prev, board]);
    setMessagesByBoard((prev) => ({ ...prev, [board.id]: [] }));
    setHasMoreByBoard((prev) => ({ ...prev, [board.id]: false }));
    setActiveBoardId(board.id);
    setActiveBoardCookie(board.id);
  }

  async function handleSend({
    content,
    contentHtml,
    file,
  }: {
    content: string;
    contentHtml: string | null;
    file?: File;
  }) {
    if (!activeBoardId) return;
    const boardId = activeBoardId;
    setSending(true);
    try {
      let fileMeta:
        | { path: string; name: string; size: number; type: string }
        | undefined;

      if (file) {
        const path = await uploadAttachment(supabase, userId, file);
        fileMeta = {
          path,
          name: file.name,
          size: file.size,
          type: file.type || "application/octet-stream",
        };
      }

      const message = await createMessage(supabase, userId, boardId, {
        content,
        contentHtml,
        file: fileMeta,
      });
      setMessagesByBoard((prev) => ({
        ...prev,
        [boardId]: [...(prev[boardId] ?? []), message],
      }));
    } finally {
      setSending(false);
    }
  }

  // useCallback aqui é o que faz o React.memo do MessageItem valer a pena:
  // sem referência estável, cada entrada ganharia uma prop onDelete/onUpdate
  // nova a cada render do BoardView (ex: autosave de uma outra entrada) e
  // a lista inteira re-renderizaria mesmo sem o conteúdo dela ter mudado.
  const handleDelete = useCallback(
    async (message: Message) => {
      setMessagesByBoard((prev) => ({
        ...prev,
        [message.board_id]: (prev[message.board_id] ?? []).filter(
          (m) => m.id !== message.id,
        ),
      }));
      await deleteMessage(supabase, message);
    },
    [supabase],
  );

  const handleUpdateMessage = useCallback((updated: Message) => {
    setMessagesByBoard((prev) => ({
      ...prev,
      [updated.board_id]: (prev[updated.board_id] ?? []).map((m) =>
        m.id === updated.id ? updated : m,
      ),
    }));
  }, []);

  async function handleRenameBoard(boardId: string, name: string) {
    setBoards((prev) =>
      prev.map((board) => (board.id === boardId ? { ...board, name } : board)),
    );
    await renameBoard(supabase, boardId, name);
  }

  async function handleDeleteBoard(boardId: string) {
    const remainingBoards = boards.filter((board) => board.id !== boardId);

    setBoards(remainingBoards);
    setMessagesByBoard((prev) => {
      const next = { ...prev };
      delete next[boardId];
      return next;
    });
    setHasMoreByBoard((prev) => {
      const next = { ...prev };
      delete next[boardId];
      return next;
    });
    if (activeBoardId === boardId) {
      const nextBoardId = remainingBoards[0]?.id ?? null;
      setActiveBoardId(nextBoardId);
      if (nextBoardId) setActiveBoardCookie(nextBoardId);
    }

    // Busca os anexos direto do banco: o quadro pode nunca ter sido aberto
    // nesta sessão, então o cache local de mensagens pode não ter nada dele.
    const attachmentPaths = await getBoardAttachmentPaths(supabase, boardId);
    await Promise.all(
      attachmentPaths.map((path) => deleteAttachment(supabase, path)),
    );
    await deleteBoard(supabase, boardId);
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-hairline bg-paper px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <button
            onClick={toggleSidebar}
            aria-label="Mostrar/ocultar quadros"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-lg text-ink-muted transition hover:bg-hairline md:h-9 md:w-9"
          >
            ☰
          </button>
          <span className="truncate text-sm font-semibold text-ink">
            {activeBoard?.name ?? "Notas"}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="hidden text-sm text-ink-muted sm:inline">
            {userEmail}
          </span>
          <SignOutButton />
        </div>
      </header>
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <BoardSidebar
          boards={boards}
          activeBoardId={activeBoardId}
          onSelect={handleSelectBoard}
          onAddBoard={handleAddBoard}
          onRenameBoard={handleRenameBoard}
          onDeleteBoard={handleDeleteBoard}
          mobileOpen={mobileSidebarOpen}
          desktopCollapsed={desktopSidebarCollapsed}
          onCloseMobile={() => setMobileSidebarOpen(false)}
          staleBoardIds={staleBoardIds}
        />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {!noticeDismissed && staleBoardIds.size > 0 && (
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-hairline bg-accent-soft px-3 py-2 text-xs text-ink-muted">
              <span>
                {staleBoardIds.size} quadro(s) sem atividade há mais de 60
                dias.
              </span>
              <div className="flex shrink-0 items-center gap-3">
                <button
                  onClick={() => setShowCleanupPanel(true)}
                  className="font-medium text-accent hover:underline"
                >
                  Ver
                </button>
                <button
                  onClick={handleDismissStaleNotice}
                  aria-label="Dispensar aviso"
                  className="text-ink-faint hover:text-ink-muted"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
          {boards.length === 0 || !activeBoardId ? (
            <div className="flex flex-1 items-center justify-center px-4 text-center text-sm text-ink-faint">
              Nenhum quadro ainda. Crie um pelo &quot;+ Novo quadro&quot; ao
              lado.
            </div>
          ) : (
            <>
              <MessageList
                messages={activeMessages}
                onDelete={handleDelete}
                onUpdate={handleUpdateMessage}
                loading={isLoadingActive}
                hasMore={hasMore}
                loadingOlder={loadingOlder}
                onLoadOlder={handleLoadOlder}
              />
              <NewMessageForm
                key={activeBoardId}
                boardId={activeBoardId}
                onSend={handleSend}
                disabled={sending}
              />
            </>
          )}
        </div>
      </div>
      {showCleanupPanel && (
        <CleanupPanel
          boards={boards.filter((board) => staleBoardIds.has(board.id))}
          activity={boardActivity}
          onClose={() => setShowCleanupPanel(false)}
          onDeleteBoards={handleDeleteBoards}
        />
      )}
    </div>
  );
}

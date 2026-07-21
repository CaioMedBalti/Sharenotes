"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createBoard, deleteBoard, renameBoard } from "@/lib/boards";
import { createMessage, deleteMessage } from "@/lib/messages";
import { deleteAttachment, uploadAttachment } from "@/lib/attachments";
import type { Board, Message } from "@/lib/types";
import { BoardTabs } from "./BoardTabs";
import { MessageList } from "./MessageList";
import { NewMessageForm } from "./NewMessageForm";

export function BoardView({
  initialBoards,
  initialMessages,
  userId,
}: {
  initialBoards: Board[];
  initialMessages: Message[];
  userId: string;
}) {
  const [boards, setBoards] = useState(initialBoards);
  const [messages, setMessages] = useState(initialMessages);
  const [activeBoardId, setActiveBoardId] = useState<string | null>(
    initialBoards[0]?.id ?? null,
  );
  const [sending, setSending] = useState(false);

  const supabase = useMemo(() => createClient(), []);

  const activeMessages = useMemo(
    () => messages.filter((message) => message.board_id === activeBoardId),
    [messages, activeBoardId],
  );

  async function handleAddBoard(name: string) {
    const position = boards.length
      ? Math.max(...boards.map((board) => board.position)) + 1
      : 0;
    const board = await createBoard(supabase, userId, name, position);
    setBoards((prev) => [...prev, board]);
    setActiveBoardId(board.id);
  }

  async function handleSend({
    content,
    file,
  }: {
    content: string;
    file?: File;
  }) {
    if (!activeBoardId) return;
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

      const message = await createMessage(supabase, userId, activeBoardId, {
        content,
        file: fileMeta,
      });
      setMessages((prev) => [...prev, message]);
    } finally {
      setSending(false);
    }
  }

  async function handleDelete(message: Message) {
    setMessages((prev) => prev.filter((m) => m.id !== message.id));
    await deleteMessage(supabase, message);
  }

  async function handleRenameBoard(boardId: string, name: string) {
    setBoards((prev) =>
      prev.map((board) => (board.id === boardId ? { ...board, name } : board)),
    );
    await renameBoard(supabase, boardId, name);
  }

  async function handleDeleteBoard(boardId: string) {
    const filesToDelete = messages.filter(
      (message) => message.board_id === boardId && message.file_path,
    );
    const remainingBoards = boards.filter((board) => board.id !== boardId);

    setBoards(remainingBoards);
    setMessages((prev) =>
      prev.filter((message) => message.board_id !== boardId),
    );
    if (activeBoardId === boardId) {
      setActiveBoardId(remainingBoards[0]?.id ?? null);
    }

    await Promise.all(
      filesToDelete.map((message) =>
        deleteAttachment(supabase, message.file_path as string),
      ),
    );
    await deleteBoard(supabase, boardId);
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
      <BoardTabs
        boards={boards}
        activeBoardId={activeBoardId}
        onSelect={setActiveBoardId}
        onAddBoard={handleAddBoard}
        onRenameBoard={handleRenameBoard}
        onDeleteBoard={handleDeleteBoard}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        {boards.length === 0 ? (
          <div className="flex flex-1 items-center justify-center px-4 text-center text-sm text-neutral-400">
            Nenhum quadro ainda. Crie um pelo &quot;+ Novo quadro&quot; ao
            lado.
          </div>
        ) : (
          <>
            <MessageList messages={activeMessages} onDelete={handleDelete} />
            <NewMessageForm
              onSend={handleSend}
              disabled={sending || !activeBoardId}
            />
          </>
        )}
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createBoard } from "@/lib/boards";
import { createMessage, deleteMessage } from "@/lib/messages";
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

  async function handleSend(content: string) {
    if (!activeBoardId) return;
    setSending(true);
    try {
      const message = await createMessage(
        supabase,
        userId,
        activeBoardId,
        content,
      );
      setMessages((prev) => [...prev, message]);
    } finally {
      setSending(false);
    }
  }

  async function handleDelete(messageId: string) {
    setMessages((prev) => prev.filter((message) => message.id !== messageId));
    await deleteMessage(supabase, messageId);
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
      <BoardTabs
        boards={boards}
        activeBoardId={activeBoardId}
        onSelect={setActiveBoardId}
        onAddBoard={handleAddBoard}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <MessageList messages={activeMessages} onDelete={handleDelete} />
        <NewMessageForm
          onSend={handleSend}
          disabled={sending || !activeBoardId}
        />
      </div>
    </div>
  );
}

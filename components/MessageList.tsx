"use client";

import { useEffect, useRef } from "react";
import type { Message } from "@/lib/types";
import { MessageItem } from "./MessageItem";

export function MessageList({
  messages,
  onDelete,
  onUpdate,
  loading,
  hasMore,
  loadingOlder,
  onLoadOlder,
}: {
  messages: Message[];
  onDelete: (message: Message) => void;
  onUpdate: (message: Message) => void;
  loading?: boolean;
  hasMore?: boolean;
  loadingOlder?: boolean;
  onLoadOlder?: () => void;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const boardIdRef = useRef<string | null>(null);
  const currentBoardId = messages[0]?.board_id ?? null;

  useEffect(() => {
    // Só rola pro fim quando o quadro muda ou uma entrada nova chega no
    // fim — não quando "Carregar mais antigas" insere no início.
    bottomRef.current?.scrollIntoView({ block: "end" });
    boardIdRef.current = currentBoardId;
  }, [messages.length, currentBoardId]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 text-center text-sm text-ink-faint">
        Carregando…
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 text-center text-sm text-ink-faint">
        Nenhuma mensagem ainda. Escreva algo abaixo pra começar.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      {hasMore && (
        <div className="flex justify-center pb-2">
          <button
            onClick={onLoadOlder}
            disabled={loadingOlder}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-ink-faint transition hover:bg-hairline disabled:opacity-50"
          >
            {loadingOlder ? "Carregando…" : "Carregar mais antigas"}
          </button>
        </div>
      )}
      {messages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          onDelete={onDelete}
          onUpdate={onUpdate}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

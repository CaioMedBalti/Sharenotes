"use client";

import { useEffect, useRef } from "react";
import type { Message } from "@/lib/types";
import { MessageItem } from "./MessageItem";

export function MessageList({
  messages,
  onDelete,
}: {
  messages: Message[];
  onDelete: (id: string) => void;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 text-center text-sm text-neutral-400">
        Nenhuma mensagem ainda. Escreva algo abaixo pra começar.
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} onDelete={onDelete} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

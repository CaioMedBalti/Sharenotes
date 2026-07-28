"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

/**
 * Debounced autosave: chama `save(value)` `delayMs` depois da última
 * mudança (`schedule`). `flush()` força o save pendente na hora — precisa
 * ser chamado ao trocar de quadro, ao sair do modo de edição e no
 * `beforeunload`, senão a última digitação simplesmente some.
 */
export function useAutosave<T>(
  save: (value: T) => Promise<void>,
  delayMs = 800,
) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<{ value: T } | null>(null);
  const saveRef = useRef(save);
  const mountedRef = useRef(true);
  saveRef.current = save;

  const runSave = useCallback(async (value: T) => {
    pendingRef.current = null;
    if (mountedRef.current) setStatus("saving");
    try {
      await saveRef.current(value);
      if (mountedRef.current) setStatus("saved");
    } catch {
      if (mountedRef.current) setStatus("error");
    }
  }, []);

  const flush = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (pendingRef.current) {
      void runSave(pendingRef.current.value);
    }
  }, [runSave]);

  const schedule = useCallback(
    (value: T) => {
      pendingRef.current = { value };
      if (mountedRef.current) setStatus("idle");
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        void runSave(value);
      }, delayMs);
    },
    [delayMs, runSave],
  );

  useEffect(() => {
    mountedRef.current = true;
    window.addEventListener("beforeunload", flush);
    return () => {
      mountedRef.current = false;
      window.removeEventListener("beforeunload", flush);
      flush();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { status, schedule, flush };
}

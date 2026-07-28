"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError("Email ou senha incorretos.");
      return;
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm rounded-2xl border border-hairline bg-paper-surface p-8"
    >
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Notas
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Entre para acessar seus recados.
        </p>
      </div>

      <div className="mb-4">
        <label
          htmlFor="email"
          className="mb-1 block text-sm font-medium text-ink-muted"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-hairline bg-paper px-3 py-2 text-sm text-ink outline-none transition focus:border-accent"
        />
      </div>

      <div className="mb-5">
        <label
          htmlFor="password"
          className="mb-1 block text-sm font-medium text-ink-muted"
        >
          Senha
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-hairline bg-paper px-3 py-2 text-sm text-ink outline-none transition focus:border-accent"
        />
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-500" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-contrast transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}

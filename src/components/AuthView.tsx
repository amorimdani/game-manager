"use client";

import { useState } from "react";
import { Gamepad2, ArrowRight, Loader2 } from "lucide-react";

export interface UserInfo {
  id: string;
  email: string;
  name: string;
}

interface AuthViewProps {
  onSuccess: (user: UserInfo) => void;
}

export function AuthView({ onSuccess }: AuthViewProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const endpoint =
        mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload =
        mode === "login" ? { email, password } : { name, email, password };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { user?: UserInfo; error?: string };
      if (!res.ok || !data.user) {
        setError(data.error || "Não foi possível autenticar.");
        return;
      }
      onSuccess(data.user);
    } catch {
      setError("Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-[#FAFAFA] dark:bg-[#09090B]">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-8 h-8 rounded-md bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900">
            <Gamepad2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-lg font-semibold tracking-tight block leading-none">
              Ludus
            </span>
            <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
              Game Library
            </span>
          </div>
        </div>

        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111113] rounded-lg p-6">
          <h1 className="text-base font-semibold tracking-tight mb-1">
            {mode === "login" ? "Entrar na biblioteca" : "Criar nova conta"}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5">
            {mode === "login"
              ? "Gerencie seu backlog, favoritos e radar de lançamentos."
              : "Comece a catalogar seus jogos em segundos."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === "register" && (
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full px-3 py-2 text-sm rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent focus:outline-none focus:border-rose-600 transition-colors"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                E-mail
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@exemplo.com"
                className="w-full px-3 py-2 text-sm rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent focus:outline-none focus:border-rose-600 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Senha
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-3 py-2 text-sm rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent focus:outline-none focus:border-rose-600 transition-colors"
              />
            </div>

            {error && (
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{mode === "login" ? "Entrar" : "Criar conta"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
            <span className="text-zinc-500">
              {mode === "login" ? "Não tem conta?" : "Já possui conta?"}
            </span>
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError("");
              }}
              className="font-medium text-rose-600 dark:text-rose-400 hover:underline"
            >
              {mode === "login" ? "Criar conta" : "Fazer login"}
            </button>
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] font-mono text-zinc-500">
          Demo: demo@ludus.app / ludus1234
        </p>
      </div>
    </div>
  );
}

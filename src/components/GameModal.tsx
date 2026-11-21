"use client";

import { useState } from "react";
import { X, Upload, Star, Trash2, Loader2, Image as ImageIcon } from "lucide-react";
import { GAME_STATUSES, GameStatusType } from "@/lib/statuses";

export interface GameItem {
  id: string;
  title: string;
  coverUrl: string | null;
  platform: string | null;
  genre: string | null;
  releaseDate: string | null;
  status: GameStatusType;
  rating: number | null;
  notes: string | null;
  externalId: string | null;
  updatedAt: string;
}

interface GameModalProps {
  game: GameItem | null;
  onClose: () => void;
  onSaved: (game: GameItem, isNew: boolean) => void;
  onDeleted: (id: string) => void;
}

export function GameModal({
  game,
  onClose,
  onSaved,
  onDeleted,
}: GameModalProps) {
  const isNew = !game;
  const [title, setTitle] = useState(game?.title ?? "");
  const [coverUrl, setCoverUrl] = useState(game?.coverUrl ?? "");
  const [platform, setPlatform] = useState(game?.platform ?? "");
  const [genre, setGenre] = useState(game?.genre ?? "");
  const [status, setStatus] = useState<GameStatusType>(
    game?.status ?? "BACKLOG"
  );
  const [rating, setRating] = useState<number | null>(game?.rating ?? null);
  const [notes, setNotes] = useState(game?.notes ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error || "Falha no upload.");
        return;
      }
      setCoverUrl(data.url);
    } catch {
      setError("Erro ao enviar imagem.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError("");
    try {
      const url = isNew ? "/api/games" : `/api/games/${game.id}`;
      const method = isNew ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          coverUrl: coverUrl || null,
          platform: platform || null,
          genre: genre || null,
          status,
          rating,
          notes: notes || null,
        }),
      });
      const data = (await res.json()) as { game?: GameItem; error?: string };
      if (!res.ok || !data.game) {
        setError(data.error || "Erro ao salvar.");
        return;
      }
      onSaved(data.game, isNew);
    } catch {
      setError("Erro de rede.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!game) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/games/${game.id}`, { method: "DELETE" });
      if (res.ok) {
        onDeleted(game.id);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4">
      <div className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto bg-white dark:bg-[#111113] border-t sm:border border-zinc-200 dark:border-zinc-800 rounded-t-xl sm:rounded-lg">
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-3.5 bg-white dark:bg-[#111113] border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-sm font-semibold tracking-tight">
            {isNew ? "Adicionar Jogo" : "Editar Jogo"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {coverUrl ? (
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverUrl}
                alt={title || "Capa"}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="aspect-[16/9] w-full rounded-md border border-dashed border-zinc-300 dark:border-zinc-700 flex flex-col items-center justify-center text-zinc-400 text-xs gap-1.5">
              <ImageIcon className="w-5 h-5" />
              <span>Prévia da capa</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              Nome do Jogo *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Clair Obscur: Expedition 33"
              className="w-full px-3 py-2 text-sm rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent focus:outline-none focus:border-rose-600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
              Estante / Status
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {GAME_STATUSES.map((s) => {
                const active = status === s.value;
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setStatus(s.value)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium transition-colors ${
                      active
                        ? "border-rose-600 bg-rose-600/10 text-rose-600 dark:text-rose-400"
                        : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${s.dotClass}`} />
                    <span className="truncate">{s.shortLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                Plataforma
              </label>
              <input
                type="text"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                placeholder="PC, PS5, Switch"
                className="w-full px-3 py-2 text-sm rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent focus:outline-none focus:border-rose-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                Gênero
              </label>
              <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="RPG, Indie, Ação"
                className="w-full px-3 py-2 text-sm rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent focus:outline-none focus:border-rose-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              Capa (URL ou Upload)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="https://... ou envie uma imagem"
                className="flex-1 px-3 py-2 text-sm rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent focus:outline-none focus:border-rose-600"
              />
              <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-zinc-200 dark:border-zinc-800 text-xs font-medium cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 shrink-0">
                {uploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                <span>Enviar</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              Avaliação
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(rating === n ? null : n)}
                  className="p-1 text-zinc-400 hover:text-amber-500 transition-colors"
                >
                  <Star
                    className={`w-4 h-4 ${
                      rating && n <= rating
                        ? "fill-amber-500 text-amber-500"
                        : ""
                    }`}
                  />
                </button>
              ))}
              {rating && (
                <span className="ml-2 text-xs font-mono text-zinc-500">
                  {rating}/5
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              Notas pessoais
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Impressões, build, onde parou..."
              className="w-full px-3 py-2 text-sm rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent focus:outline-none focus:border-rose-600 resize-none"
            />
          </div>

          {error && (
            <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-zinc-200 dark:border-zinc-800">
            {!isNew ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium text-rose-600 hover:bg-rose-600/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remover</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-md text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving || uploading}
                className="px-4 py-2 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50"
              >
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

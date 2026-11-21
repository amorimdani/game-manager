"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Gamepad2,
  Plus,
  Search,
  Sparkles,
  Library,
  Sun,
  Moon,
  LogOut,
  Star,
  Check,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { AuthView, UserInfo } from "./AuthView";
import { GameItem, GameModal } from "./GameModal";
import { GAME_STATUSES, GameStatusType, STATUS_MAP } from "@/lib/statuses";
import type { UpcomingGameItem } from "@/lib/upcoming";

interface GameManagerAppProps {
  initialUser: UserInfo | null;
  initialGames: GameItem[];
}

export function GameManagerApp({
  initialUser,
  initialGames,
}: GameManagerAppProps) {
  const [user, setUser] = useState<UserInfo | null>(initialUser);
  const [games, setGames] = useState<GameItem[]>(initialGames);
  const [tab, setTab] = useState<"library" | "upcoming">("library");
  const [statusFilter, setStatusFilter] = useState<"ALL" | GameStatusType>("ALL");
  const [search, setSearch] = useState("");
  const [editingGame, setEditingGame] = useState<GameItem | null | undefined>(
    undefined
  );
  const [upcoming, setUpcoming] = useState<UpcomingGameItem[]>([]);
  const [upcomingSource, setUpcomingSource] = useState<string>("");
  const [upcomingSearch, setUpcomingSearch] = useState("");
  const [loadingUpcoming, setLoadingUpcoming] = useState(false);
  const [addingExternalId, setAddingExternalId] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("ludus_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("ludus_theme", "light");
    }
  }

  async function refreshGames() {
    const res = await fetch("/api/games");
    if (res.ok) {
      const data = (await res.json()) as { games: GameItem[] };
      setGames(data.games);
    }
  }

  useEffect(() => {
    if (tab !== "upcoming") return;
    const timer = setTimeout(() => {
      setLoadingUpcoming(true);
      const qParam = upcomingSearch.trim()
        ? `?q=${encodeURIComponent(upcomingSearch.trim())}`
        : "";
      fetch(`/api/upcoming${qParam}`)
        .then((r) => r.json())
        .then((data: { items: UpcomingGameItem[]; source: string }) => {
          setUpcoming(data.items || []);
          setUpcomingSource(data.source || "");
        })
        .catch(() => {})
        .finally(() => setLoadingUpcoming(false));
    }, upcomingSearch.trim() ? 350 : 0);
    return () => clearTimeout(timer);
  }, [tab, upcomingSearch]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setGames([]);
  }

  async function handleAddUpcoming(
    item: UpcomingGameItem,
    targetStatus: GameStatusType
  ) {
    setAddingExternalId(item.externalId);
    try {
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: item.title,
          coverUrl: item.coverUrl,
          platform: item.platform,
          genre: item.genre,
          releaseDate: item.releaseDate,
          externalId: item.externalId,
          status: targetStatus,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { game: GameItem };
        setGames((prev) => [data.game, ...prev]);
      }
    } finally {
      setAddingExternalId(null);
    }
  }

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: games.length };
    for (const s of GAME_STATUSES) counts[s.value] = 0;
    for (const g of games) counts[g.status] = (counts[g.status] || 0) + 1;
    return counts;
  }, [games]);

  const filteredGames = useMemo(() => {
    return games.filter((g) => {
      if (statusFilter !== "ALL" && g.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        return (
          g.title.toLowerCase().includes(q) ||
          (g.platform?.toLowerCase().includes(q) ?? false) ||
          (g.genre?.toLowerCase().includes(q) ?? false)
        );
      }
      return true;
    });
  }, [games, statusFilter, search]);

  const existingExternalIds = useMemo(() => {
    return new Set(games.map((g) => g.externalId).filter(Boolean));
  }, [games]);

  if (!user) {
    return (
      <AuthView
        onSuccess={(u) => {
          setUser(u);
          refreshGames();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col pb-20 sm:pb-8">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-[#FAFAFA]/95 dark:bg-[#09090B]/95 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setTab("library")}
              className="flex items-center gap-2 text-left"
            >
              <div className="w-7 h-7 rounded-md bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900">
                <Gamepad2 className="w-4 h-4" />
              </div>
              <span className="font-semibold tracking-tight text-sm">
                Game Manager
              </span>
            </button>

            <nav className="hidden sm:flex items-center gap-1">
              <button
                type="button"
                onClick={() => setTab("library")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  tab === "library"
                    ? "bg-zinc-200/80 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                Biblioteca
              </button>
              <button
                type="button"
                onClick={() => setTab("upcoming")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  tab === "upcoming"
                    ? "bg-zinc-200/80 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                Próximos Lançamentos
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEditingGame(null)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-rose-600 text-white text-xs font-medium hover:bg-rose-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar</span>
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Alternar tema"
              className="p-2 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors"
            >
              {isDark ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              title={`Sair (${user.email})`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-6">
        {tab === "library" ? (
          <div className="space-y-5">
            {/* Heading + Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-lg font-semibold tracking-tight">
                  Sua Estante
                </h1>
                <p className="text-xs text-zinc-500 font-mono">
                  {games.length}{" "}
                  {games.length === 1 ? "jogo catalogado" : "jogos catalogados"}
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar título, plataforma..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111113] focus:outline-none focus:border-rose-600"
                />
              </div>
            </div>

            {/* Status Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <button
                type="button"
                onClick={() => setStatusFilter("ALL")}
                className={`shrink-0 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                  statusFilter === "ALL"
                    ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-transparent"
                    : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700"
                }`}
              >
                Todos ({statusCounts.ALL})
              </button>

              {GAME_STATUSES.map((s) => {
                const active = statusFilter === s.value;
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setStatusFilter(s.value)}
                    className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                      active
                        ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-transparent"
                        : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${s.dotClass}`} />
                    <span>{s.shortLabel}</span>
                    <span className="font-mono text-[10px] opacity-70">
                      {statusCounts[s.value] || 0}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Cover Grid */}
            {filteredGames.length === 0 ? (
              <div className="border border-dashed border-zinc-300 dark:border-zinc-800 rounded-lg py-16 px-4 text-center">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Nenhum jogo nesta estante
                </p>
                <p className="text-xs text-zinc-500 mb-4">
                  Adicione um jogo manualmente ou explore os próximos lançamentos.
                </p>
                <button
                  type="button"
                  onClick={() => setEditingGame(null)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-rose-600 text-white text-xs font-medium hover:bg-rose-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar jogo</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {filteredGames.map((g) => {
                  const meta = STATUS_MAP[g.status];
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setEditingGame(g)}
                      className="group text-left border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111113] rounded-lg overflow-hidden hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors flex flex-col"
                    >
                      <div className="relative aspect-[16/10] w-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
                        {g.coverUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={g.coverUrl}
                            alt={g.title}
                            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-400">
                            <Gamepad2 className="w-6 h-6" />
                          </div>
                        )}
                      </div>

                      <div className="p-3 flex-1 flex flex-col justify-between gap-2">
                        <div>
                          <h3 className="text-xs sm:text-sm font-medium leading-snug line-clamp-1">
                            {g.title}
                          </h3>
                          <p className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5">
                            {[g.platform, g.genre].filter(Boolean).join(" · ") ||
                              "Sem plataforma"}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${meta.dotClass}`}
                            />
                            {meta.shortLabel}
                          </span>
                          {g.rating && (
                            <span className="inline-flex items-center gap-0.5 text-[11px] font-mono text-amber-500">
                              <Star className="w-3 h-3 fill-amber-500" />
                              {g.rating}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-lg font-semibold tracking-tight">
                  Explorar &amp; Lançamentos
                </h1>
                <p className="text-xs text-zinc-500 font-mono">
                  {upcoming.length} jogos ·{" "}
                  {upcomingSource === "steam-search"
                    ? "Busca na Steam"
                    : "Em breve, populares & épicos"}
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={upcomingSearch}
                  onChange={(e) => setUpcomingSearch(e.target.value)}
                  placeholder="Pesquisar qualquer jogo..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111113] focus:outline-none focus:border-rose-600"
                />
              </div>
            </div>

            {loadingUpcoming ? (
              <div className="py-16 flex items-center justify-center text-zinc-500 gap-2 text-xs">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Carregando lançamentos...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {upcoming.map((item) => {
                  const inLibrary = existingExternalIds.has(item.externalId);
                  const isBusy = addingExternalId === item.externalId;
                  return (
                    <div
                      key={item.externalId}
                      className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111113] rounded-lg overflow-hidden flex flex-col"
                    >
                      <div className="relative aspect-[16/9] w-full bg-zinc-100 dark:bg-zinc-900">
                        {item.coverUrl && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={item.coverUrl}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="p-3.5 flex-1 flex flex-col justify-between gap-3">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-sm font-medium leading-snug line-clamp-1">
                              {item.title}
                            </h3>
                            {item.storeUrl && (
                              <a
                                href={item.storeUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 shrink-0"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-500 mt-0.5">
                            {item.platform} · {item.releaseDate}
                          </p>
                        </div>

                        {inLibrary ? (
                          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            <Check className="w-3.5 h-3.5" />
                            <span>Na sua estante</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleAddUpcoming(item, "BACKLOG")}
                              className="flex-1 py-1.5 px-2.5 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50"
                            >
                              + Backlog
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleAddUpcoming(item, "RADAR")}
                              className="py-1.5 px-2.5 rounded-md border border-zinc-200 dark:border-zinc-800 text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50"
                            >
                              + Radar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-[#FAFAFA]/95 dark:bg-[#09090B]/95 backdrop-blur-sm border-t border-zinc-200 dark:border-zinc-800">
        <div className="grid grid-cols-3 h-14">
          <button
            type="button"
            onClick={() => setTab("library")}
            className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
              tab === "library"
                ? "text-rose-600 dark:text-rose-400"
                : "text-zinc-500"
            }`}
          >
            <Library className="w-4 h-4" />
            <span>Estante</span>
          </button>

          <button
            type="button"
            onClick={() => setEditingGame(null)}
            className="flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-zinc-900 dark:text-zinc-100"
          >
            <div className="w-7 h-7 rounded-md bg-rose-600 text-white flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTab("upcoming")}
            className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
              tab === "upcoming"
                ? "text-rose-600 dark:text-rose-400"
                : "text-zinc-500"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Radar</span>
          </button>
        </div>
      </nav>

      {/* Add / Edit Modal */}
      {editingGame !== undefined && (
        <GameModal
          game={editingGame}
          onClose={() => setEditingGame(undefined)}
          onSaved={(saved, isNew) => {
            if (isNew) {
              setGames((prev) => [saved, ...prev]);
            } else {
              setGames((prev) =>
                prev.map((item) => (item.id === saved.id ? saved : item))
              );
            }
            setEditingGame(undefined);
          }}
          onDeleted={(id) => {
            setGames((prev) => prev.filter((item) => item.id !== id));
            setEditingGame(undefined);
          }}
        />
      )}
    </div>
  );
}

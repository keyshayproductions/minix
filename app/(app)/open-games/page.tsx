"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type Lobby = {
  id: string;
  status: string;
  max_players: number;
  current_players: number;
  created_at: string;
  game: { id: string; title: string; thumbnail: string | null; category: string | null } | null;
  host: { username: string; avatar: string | null } | null;
};

const statusColor = (s: string) => {
  if (s === "waiting") return { bg: "rgba(34,197,94,0.15)", text: "#22c55e" };
  if (s === "starting") return { bg: "rgba(245,158,11,0.15)", text: "#f59e0b" };
  return { bg: "rgba(124,58,237,0.15)", text: "var(--accent-2)" };
};

function SkeletonLobby() {
  return (
    <div className="p-4 rounded-2xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      <div className="flex gap-3">
        <div className="skeleton w-16 h-16 rounded-xl flex-shrink-0" />
        <div className="flex-1 flex flex-col gap-2">
          <div className="skeleton h-4 w-1/2" />
          <div className="skeleton h-3 w-1/3" />
          <div className="skeleton h-3 w-1/4" />
        </div>
      </div>
    </div>
  );
}

export default function OpenGamesPage() {
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("multiplayer_lobbies")
        .select("id, status, max_players, current_players, created_at, game:games(id, title, thumbnail, category), host:users!host_id(username, avatar)")
        .in("status", ["waiting", "starting"])
        .order("created_at", { ascending: false });
      setLobbies((data as unknown as Lobby[]) ?? []);
      setLoading(false);
    }
    load();

    // Realtime updates
    const supabase = createClient();
    const channel = supabase
      .channel("lobbies")
      .on("postgres_changes", { event: "*", schema: "public", table: "multiplayer_lobbies" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function joinLobby(lobbyId: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const lobby = lobbies.find((l) => l.id === lobbyId);
    if (!lobby) return;
    await supabase
      .from("multiplayer_lobbies")
      .update({ current_players: lobby.current_players + 1 })
      .eq("id", lobbyId);
  }

  return (
    <div className="pt-safe animate-fade-in">
      <div className="sticky top-0 z-40 glass px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black">Open Games</h1>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {lobbies.length} active {lobbies.length === 1 ? "lobby" : "lobbies"}
            </p>
          </div>
          <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: "var(--success)" }} />
        </div>
      </div>

      <div className="px-4 pt-4 flex flex-col gap-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonLobby key={i} />)
        ) : lobbies.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-3xl mb-3">🎮</p>
            <p className="font-bold mb-1">No open games</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Check back soon or create your own</p>
          </div>
        ) : (
          lobbies.map((lobby) => {
            const sc = statusColor(lobby.status);
            return (
              <div key={lobby.id} className="p-4 rounded-2xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div className="flex gap-3">
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-xl flex-shrink-0 overflow-hidden"
                    style={{ background: "var(--surface-2)" }}>
                    {lobby.game?.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={lobby.game.thumbnail} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth="1.5">
                          <rect x="2" y="3" width="20" height="14" rx="2" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-sm truncate">{lobby.game?.title ?? "Unknown Game"}</p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                          Host: {lobby.host?.username}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold capitalize flex-shrink-0"
                        style={{ background: sc.bg, color: sc.text }}>
                        {lobby.status.replace("_", " ")}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      {/* Player count */}
                      <div className="flex items-center gap-1.5">
                        <div className="flex -space-x-1">
                          {Array.from({ length: Math.min(lobby.current_players, 4) }).map((_, i) => (
                            <div key={i} className="w-5 h-5 rounded-full border"
                              style={{ background: "var(--accent)", borderColor: "var(--surface)" }} />
                          ))}
                        </div>
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {lobby.current_players}/{lobby.max_players}
                        </span>
                      </div>

                      <button
                        onClick={() => joinLobby(lobby.id)}
                        disabled={lobby.current_players >= lobby.max_players}
                        className="px-4 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 disabled:opacity-40"
                        style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))", color: "#fff" }}
                      >
                        {lobby.current_players >= lobby.max_players ? "Full" : "Join"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

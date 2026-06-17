"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import GameCard, { type Game } from "@/components/cards/GameCard";
import Link from "next/link";

const TABS = ["Recommended", "Trending", "New", "Multiplayer"];

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--surface)" }}>
      <div className="skeleton w-full aspect-video" />
      <div className="p-3 flex flex-col gap-2">
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-3 w-1/2" />
      </div>
    </div>
  );
}

export default function HomePage() {
  const [tab, setTab] = useState("Recommended");
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGames() {
      setLoading(true);
      const supabase = createClient();

      if (tab === "Recommended") {
        const { data: allGames } = await supabase
          .from("games")
          .select("id, title, description, thumbnail, category, total_plays, total_likes, average_rating, game_type, creator:users(username, avatar, verified_creator)")
          .eq("status", "published")
          .eq("visibility", "public")
          .limit(30);

        const games = (allGames as unknown as Game[]) ?? [];

        try {
          const res = await fetch("/api/ai/recommendations", { method: "POST" });
          if (res.ok) {
            const { ids } = await res.json();
            if (Array.isArray(ids) && ids.length > 0) {
              const ordered = ids
                .map((id: string) => games.find((g) => g.id === id))
                .filter(Boolean) as Game[];
              const rest = games.filter((g) => !ids.includes(g.id));
              setGames([...ordered, ...rest]);
              setLoading(false);
              return;
            }
          }
        } catch {
          // fall through to default sort
        }
        setGames([...games].sort((a, b) => (b.average_rating ?? 0) - (a.average_rating ?? 0)));
        setLoading(false);
        return;
      }

      let query = supabase
        .from("games")
        .select("id, title, description, thumbnail, category, total_plays, total_likes, average_rating, game_type, creator:users(username, avatar, verified_creator)")
        .eq("status", "published")
        .eq("visibility", "public")
        .limit(20);

      if (tab === "Trending") query = query.order("total_plays", { ascending: false });
      else if (tab === "New") query = query.order("created_at", { ascending: false });
      else if (tab === "Multiplayer") query = query.in("game_type", ["multiplayer", "both"]);

      const { data } = await query;
      setGames((data as unknown as Game[]) ?? []);
      setLoading(false);
    }
    fetchGames();
  }, [tab]);

  return (
    <div className="pt-safe">
      {/* Header */}
      <div className="sticky top-0 z-40 glass px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <img src="/logo-black.png" alt="MiniX" className="h-10 w-auto" />
          <Link href="/notifications">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--surface-2)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
              </svg>
            </div>
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all active:scale-95"
              style={{
                background: tab === t ? "linear-gradient(135deg, var(--accent), var(--accent-2))" : "var(--surface-2)",
                color: tab === t ? "#fff" : "var(--text-muted)",
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div className="px-4 pt-4 grid grid-cols-1 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : games.length === 0
          ? (
            <div className="text-center py-20">
              <p className="text-lg font-bold mb-2">No games yet</p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Be the first to create one!</p>
            </div>
          )
          : games.map((g) => <GameCard key={g.id} game={g} />)
        }
      </div>
    </div>
  );
}

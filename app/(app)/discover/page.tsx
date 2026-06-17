"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import GameCard, { type Game } from "@/components/cards/GameCard";

const FILTERS = ["All", "Trending", "Most Played", "Newest", "Top Rated", "Multiplayer", "Single Player"];
const CATEGORIES = ["Action", "Puzzle", "Racing", "Adventure", "Platformer", "Arcade", "Strategy", "Other"];

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

export default function DiscoverPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [category, setCategory] = useState<string | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGames = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    let query = supabase
      .from("games")
      .select("id, title, description, thumbnail, category, total_plays, total_likes, average_rating, game_type, creator:users(username, avatar, verified_creator)")
      .eq("status", "published")
      .eq("visibility", "public")
      .limit(30);

    if (search) query = query.ilike("title", `%${search}%`);
    if (category) query = query.eq("category", category);
    if (filter === "Trending" || filter === "Most Played") query = query.order("total_plays", { ascending: false });
    else if (filter === "Newest") query = query.order("created_at", { ascending: false });
    else if (filter === "Top Rated") query = query.order("average_rating", { ascending: false });
    else if (filter === "Multiplayer") query = query.in("game_type", ["multiplayer", "both"]);
    else if (filter === "Single Player") query = query.eq("game_type", "single_player");
    else query = query.order("total_plays", { ascending: false });

    const { data } = await query;
    setGames((data as unknown as Game[]) ?? []);
    setLoading(false);
  }, [search, filter, category]);

  useEffect(() => {
    const t = setTimeout(fetchGames, 300);
    return () => clearTimeout(t);
  }, [fetchGames]);

  return (
    <div className="pt-safe">
      {/* Header */}
      <div className="sticky top-0 z-40 glass px-4 pt-4 pb-3">
        <h1 className="text-xl font-black mb-3">Discover</h1>

        {/* Search */}
        <div className="relative mb-3">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search games, creators..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95"
              style={{
                background: filter === f ? "var(--accent)" : "var(--surface-2)",
                color: filter === f ? "#fff" : "var(--text-muted)",
              }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="px-4 pt-4">
        <div className="flex gap-2 overflow-x-auto mb-4">
          <button onClick={() => setCategory(null)}
            className="px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
            style={{ background: !category ? "var(--accent-2)" : "var(--surface-2)", color: !category ? "#fff" : "var(--text-muted)" }}>
            All
          </button>
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCategory(c === category ? null : c)}
              className="px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
              style={{ background: category === c ? "var(--accent-2)" : "var(--surface-2)", color: category === c ? "#fff" : "var(--text-muted)" }}>
              {c}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : games.length === 0
            ? (
              <div className="text-center py-20">
                <p className="text-lg font-bold mb-2">No results</p>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>Try a different search or filter</p>
              </div>
            )
            : games.map((g) => <GameCard key={g.id} game={g} />)
          }
        </div>
      </div>
    </div>
  );
}

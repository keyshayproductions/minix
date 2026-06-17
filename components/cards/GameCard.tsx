"use client";

import Link from "next/link";

export type Game = {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  category: string | null;
  total_plays: number;
  total_likes: number;
  average_rating: number;
  game_type: string;
  creator: {
    username: string;
    avatar: string | null;
    verified_creator: boolean;
  } | null;
};

export default function GameCard({ game }: { game: Game }) {
  return (
    <Link href={`/games/${game.id}`} className="block animate-fade-in">
      <div
        className="rounded-2xl overflow-hidden transition-all active:scale-95"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        {/* Thumbnail */}
        <div className="relative w-full aspect-video bg-gradient-to-br overflow-hidden"
          style={{ background: "linear-gradient(135deg, var(--surface-2), var(--surface-3))" }}>
          {game.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={game.thumbnail} alt={game.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth="1.5">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <path d="M8 21h8M12 17v4" />
              </svg>
            </div>
          )}
          {/* Game type badge */}
          {game.game_type === "multiplayer" || game.game_type === "both" ? (
            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold"
              style={{ background: "var(--accent)", color: "#fff" }}>
              MULTI
            </span>
          ) : null}
        </div>

        {/* Info */}
        <div className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm truncate">{game.title}</h3>
              <div className="flex items-center gap-1 mt-0.5">
                {game.creator?.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={game.creator.avatar} alt="" className="w-4 h-4 rounded-full object-cover" />
                ) : (
                  <div className="w-4 h-4 rounded-full" style={{ background: "var(--accent)" }} />
                )}
                <span className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                  {game.creator?.username ?? "Unknown"}
                </span>
                {game.creator?.verified_creator && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--accent-2)">
                    <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                )}
              </div>
            </div>

            {/* Play button */}
            <button
              className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-90"
              style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))", color: "#fff" }}
              onClick={(e) => e.preventDefault()}
            >
              Play
            </button>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 mt-2">
            <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
              {game.total_plays.toLocaleString()}
            </span>
            <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg>
              {game.total_likes.toLocaleString()}
            </span>
            {game.average_rating > 0 && (
              <span className="flex items-center gap-1 text-xs" style={{ color: "var(--warning)" }}>
                ★ {game.average_rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

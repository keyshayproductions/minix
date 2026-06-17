"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type Game = {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  category: string | null;
  tags: string[] | null;
  total_plays: number;
  total_likes: number;
  average_rating: number;
  game_type: string;
  status: string;
  created_at: string;
  creator: { id: string; username: string; avatar: string | null; verified_creator: boolean } | null;
};

type Comment = {
  id: string;
  content: string;
  created_at: string;
  user: { username: string; avatar: string | null } | null;
};

export default function GamePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [game, setGame] = useState<Game | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [liked, setLiked] = useState(false);
  const [following, setFollowing] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [tab, setTab] = useState("About");
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);

      const [{ data: g }, { data: c }] = await Promise.all([
        supabase
          .from("games")
          .select("*, creator:users(id, username, avatar, verified_creator)")
          .eq("id", id)
          .single(),
        supabase
          .from("comments")
          .select("id, content, created_at, user:users(username, avatar)")
          .eq("game_id", id)
          .is("parent_comment_id", null)
          .order("created_at", { ascending: false })
          .limit(30),
      ]);

      setGame(g as unknown as Game);
      setComments((c as unknown as Comment[]) ?? []);

      if (user && g) {
        const [{ data: like }, { data: follow }] = await Promise.all([
          supabase.from("likes").select("id").eq("user_id", user.id).eq("game_id", id).maybeSingle(),
          supabase.from("followers").select("id").eq("follower_id", user.id).eq("following_id", (g as any).creator_id).maybeSingle(),
        ]);
        setLiked(!!like);
        setFollowing(!!follow);
      }

      // Increment plays
      if (g) await supabase.from("games").update({ total_plays: (g as any).total_plays + 1 }).eq("id", id);
      setLoading(false);
    }
    load();
  }, [id]);

  async function toggleLike() {
    if (!currentUserId) return;
    const supabase = createClient();
    if (liked) {
      await supabase.from("likes").delete().eq("user_id", currentUserId).eq("game_id", id);
      setGame((g) => g ? { ...g, total_likes: g.total_likes - 1 } : g);
    } else {
      await supabase.from("likes").insert({ user_id: currentUserId, game_id: id });
      setGame((g) => g ? { ...g, total_likes: g.total_likes + 1 } : g);
    }
    setLiked(!liked);
  }

  async function toggleFollow() {
    if (!currentUserId || !game?.creator) return;
    const supabase = createClient();
    if (following) {
      await supabase.from("followers").delete().eq("follower_id", currentUserId).eq("following_id", (game as any).creator_id);
    } else {
      await supabase.from("followers").insert({ follower_id: currentUserId, following_id: (game as any).creator_id });
    }
    setFollowing(!following);
  }

  async function postComment() {
    if (!currentUserId || !commentText.trim()) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("comments")
      .insert({ game_id: id, user_id: currentUserId, content: commentText.trim() })
      .select("id, content, created_at, user:users(username, avatar)")
      .single();
    if (data) setComments([data as unknown as Comment, ...comments]);
    setCommentText("");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!game) return <div className="p-8 text-center">Game not found</div>;

  return (
    <div className="pt-safe animate-fade-in">
      {/* Back */}
      <div className="px-4 pt-4 pb-2">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>
      </div>

      {/* Thumbnail */}
      <div className="w-full aspect-video relative" style={{ background: "var(--surface-2)" }}>
        {game.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={game.thumbnail} alt={game.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth="1.5">
              <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
            </svg>
          </div>
        )}
        {/* Play overlay */}
        <button className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center animate-pulse-glow"
            style={{ background: "rgba(124,58,237,0.9)" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </button>
      </div>

      {/* Title + actions */}
      <div className="px-4 pt-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1">
            <h1 className="text-xl font-black">{game.title}</h1>
            {game.category && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}>
                {game.category}
              </span>
            )}
          </div>
          <button
            onClick={toggleLike}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all active:scale-90"
            style={{ background: liked ? "rgba(239,68,68,0.15)" : "var(--surface-2)", color: liked ? "#ef4444" : "var(--text-muted)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
            </svg>
            <span className="text-sm font-semibold">{game.total_likes}</span>
          </button>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 mb-4">
          <span className="flex items-center gap-1 text-sm" style={{ color: "var(--text-muted)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
            {game.total_plays.toLocaleString()} plays
          </span>
          {game.average_rating > 0 && (
            <span className="flex items-center gap-1 text-sm" style={{ color: "var(--warning)" }}>
              ★ {game.average_rating.toFixed(1)}
            </span>
          )}
          <span className="text-xs px-2 py-0.5 rounded-full capitalize"
            style={{ background: game.game_type === "single_player" ? "var(--surface-2)" : "rgba(124,58,237,0.2)", color: game.game_type === "single_player" ? "var(--text-muted)" : "var(--accent-2)" }}>
            {game.game_type.replace("_", " ")}
          </span>
        </div>

        {/* Creator */}
        {game.creator && (
          <div className="flex items-center justify-between p-3 rounded-xl mb-4" style={{ background: "var(--surface)" }}>
            <div className="flex items-center gap-2.5">
              {game.creator.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={game.creator.avatar} alt="" className="w-10 h-10 rounded-xl object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold"
                  style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>
                  {game.creator.username[0].toUpperCase()}
                </div>
              )}
              <div>
                <div className="flex items-center gap-1">
                  <p className="font-semibold text-sm">{game.creator.username}</p>
                  {game.creator.verified_creator && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--accent-2)">
                      <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  )}
                </div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Creator</p>
              </div>
            </div>
            <button
              onClick={toggleFollow}
              className="px-4 py-1.5 rounded-full text-sm font-bold transition-all active:scale-95"
              style={{
                background: following ? "var(--surface-2)" : "linear-gradient(135deg, var(--accent), var(--accent-2))",
                color: following ? "var(--text-muted)" : "#fff",
                border: following ? "1px solid var(--border)" : "none",
              }}
            >
              {following ? "Following" : "Follow"}
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b mb-4" style={{ borderColor: "var(--border)" }}>
          {["About", "Comments"].map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className="px-4 py-2 text-sm font-semibold border-b-2 transition-all"
              style={{ borderColor: tab === t ? "var(--accent-2)" : "transparent", color: tab === t ? "var(--accent-2)" : "var(--text-muted)" }}>
              {t}
            </button>
          ))}
        </div>

        {tab === "About" ? (
          <div className="pb-8">
            {game.description && <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--text-muted)" }}>{game.description}</p>}
            {game.tags && game.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {game.tags.map((tag) => (
                  <span key={tag} className="px-3 py-1 rounded-full text-xs" style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}>
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="pb-8">
            {/* Comment input */}
            {currentUserId && (
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  onKeyDown={(e) => e.key === "Enter" && postComment()}
                  className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
                />
                <button onClick={postComment} disabled={!commentText.trim()}
                  className="px-3 py-2 rounded-xl text-sm font-bold disabled:opacity-40"
                  style={{ background: "var(--accent)", color: "#fff" }}>
                  Post
                </button>
              </div>
            )}

            {comments.length === 0 ? (
              <p className="text-center py-8 text-sm" style={{ color: "var(--text-muted)" }}>No comments yet</p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="flex gap-3 py-3 border-b" style={{ borderColor: "var(--border)" }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: "var(--surface-2)" }}>
                    {c.user?.username[0].toUpperCase() ?? "?"}
                  </div>
                  <div>
                    <p className="text-xs font-semibold mb-0.5">{c.user?.username}</p>
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>{c.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

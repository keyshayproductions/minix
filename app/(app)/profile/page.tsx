"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import GameCard, { type Game } from "@/components/cards/GameCard";

type Profile = {
  id: string;
  username: string;
  avatar: string | null;
  bio: string | null;
  verified_creator: boolean;
  role: string;
  created_at: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [tab, setTab] = useState("Games");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }

      // Auto-create user row if it doesn't exist yet
      const username = user.user_metadata?.username ?? user.email?.split("@")[0] ?? "user";
      await supabase.from("users").upsert({ id: user.id, username, email: user.email }, { onConflict: "id", ignoreDuplicates: true });

      const [{ data: prof }, { count: followers }, { count: following }, { data: myGames }] = await Promise.all([
        supabase.from("users").select("*").eq("id", user.id).single(),
        supabase.from("followers").select("*", { count: "exact", head: true }).eq("following_id", user.id),
        supabase.from("followers").select("*", { count: "exact", head: true }).eq("follower_id", user.id),
        supabase.from("games")
          .select("id, title, description, thumbnail, category, total_plays, total_likes, average_rating, game_type, creator:users(username, avatar, verified_creator)")
          .eq("creator_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      setProfile(prof);
      setFollowerCount(followers ?? 0);
      setFollowingCount(following ?? 0);
      setGames((myGames as unknown as Game[]) ?? []);
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="pt-safe animate-fade-in">
      {/* Header */}
      <div className="px-4 pt-4 pb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {profile.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar} alt="" className="w-16 h-16 rounded-2xl object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black"
                style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>
                {profile.username[0].toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-lg font-black">{profile.username}</h2>
                {profile.verified_creator && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--accent-2)">
                    <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                )}
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full capitalize" style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}>
                {profile.role.replace("_", " ")}
              </span>
            </div>
          </div>

          <button onClick={handleSignOut} className="p-2 rounded-xl" style={{ background: "var(--surface-2)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </button>
        </div>

        {profile.bio && <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>{profile.bio}</p>}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Games", value: games.length },
            { label: "Followers", value: followerCount },
            { label: "Following", value: followingCount },
          ].map((s) => (
            <div key={s.label} className="text-center py-3 rounded-xl" style={{ background: "var(--surface-2)" }}>
              <p className="text-xl font-black">{s.value}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b px-4" style={{ borderColor: "var(--border)" }}>
        {["Games", "Favorites"].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-2 text-sm font-semibold border-b-2 transition-all"
            style={{ borderColor: tab === t ? "var(--accent-2)" : "transparent", color: tab === t ? "var(--accent-2)" : "var(--text-muted)" }}>
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-4 pt-4 grid grid-cols-1 gap-4">
        {tab === "Games" && (
          games.length === 0 ? (
            <div className="text-center py-16">
              <p className="font-bold mb-1">No games yet</p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Tap Create to build your first game</p>
            </div>
          ) : games.map((g) => <GameCard key={g.id} game={g} />)
        )}
        {tab === "Favorites" && (
          <div className="text-center py-16">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>No favorites yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

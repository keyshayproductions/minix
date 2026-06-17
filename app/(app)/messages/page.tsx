"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type Conversation = {
  id: string;
  other_user: { username: string; avatar: string | null };
  last_message: string;
  created_at: string;
  read_status: boolean;
};

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get latest message per conversation partner
      const { data } = await supabase
        .from("messages")
        .select("id, message, read_status, created_at, sender:users!sender_id(username, avatar), receiver:users!receiver_id(username, avatar), sender_id, receiver_id")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (!data) { setLoading(false); return; }

      // Deduplicate by conversation partner
      const seen = new Set<string>();
      const convos: Conversation[] = [];
      for (const msg of data as any[]) {
        const isMe = msg.sender_id === user.id;
        const other = isMe ? msg.receiver : msg.sender;
        const otherId = isMe ? msg.receiver_id : msg.sender_id;
        if (seen.has(otherId)) continue;
        seen.add(otherId);
        convos.push({
          id: otherId,
          other_user: other,
          last_message: msg.message,
          created_at: msg.created_at,
          read_status: msg.read_status || isMe,
        });
      }
      setConversations(convos);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = conversations.filter((c) =>
    c.other_user.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="pt-safe animate-fade-in">
      <div className="sticky top-0 z-40 glass px-4 pt-4 pb-3">
        <h1 className="text-xl font-black mb-3">Messages</h1>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
          />
        </div>
      </div>

      <div className="px-4 pt-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-3">
              <div className="skeleton w-12 h-12 rounded-full flex-shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <div className="skeleton h-4 w-1/3" />
                <div className="skeleton h-3 w-2/3" />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-bold mb-2">No messages yet</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Start a conversation with a creator</p>
          </div>
        ) : (
          filtered.map((c) => (
            <div key={c.id} className="flex items-center gap-3 py-3 border-b active:bg-surface-2 cursor-pointer"
              style={{ borderColor: "var(--border)" }}>
              {c.other_user.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.other_user.avatar} alt="" className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>
                  {c.other_user.username[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm">{c.other_user.username}</p>
                  <p className="text-xs" style={{ color: "var(--text-dim)" }}>
                    {new Date(c.created_at).toLocaleDateString()}
                  </p>
                </div>
                <p className="text-sm truncate" style={{ color: c.read_status ? "var(--text-muted)" : "var(--text)" }}>
                  {c.last_message}
                </p>
              </div>
              {!c.read_status && (
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: "var(--accent-2)" }} />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

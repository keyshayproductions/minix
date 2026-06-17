"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type Notification = {
  id: string;
  type: string;
  content: string;
  read_status: boolean;
  created_at: string;
};

const typeIcon = (type: string) => {
  switch (type) {
    case "like": return "❤️";
    case "comment": return "💬";
    case "follow": return "👤";
    case "rating": return "⭐";
    case "message": return "✉️";
    case "featured": return "🌟";
    default: return "🔔";
  }
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      setNotifications(data ?? []);

      // Mark all as read
      await supabase.from("notifications").update({ read_status: true }).eq("user_id", user.id).eq("read_status", false);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="pt-safe animate-fade-in">
      <div className="sticky top-0 z-40 glass px-4 pt-4 pb-3">
        <h1 className="text-xl font-black">Notifications</h1>
      </div>

      <div className="px-4 pt-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3 py-3">
              <div className="skeleton w-10 h-10 rounded-full flex-shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-3 w-1/3" />
              </div>
            </div>
          ))
        ) : notifications.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-2xl mb-3">🔔</p>
            <p className="font-bold mb-1">No notifications yet</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>You&apos;ll see activity here</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className="flex items-start gap-3 py-3 border-b"
              style={{ borderColor: "var(--border)", opacity: n.read_status ? 0.7 : 1 }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                style={{ background: "var(--surface-2)" }}>
                {typeIcon(n.type)}
              </div>
              <div className="flex-1">
                <p className="text-sm">{n.content}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-dim)" }}>
                  {new Date(n.created_at).toLocaleDateString()}
                </p>
              </div>
              {!n.read_status && (
                <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ background: "var(--accent-2)" }} />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

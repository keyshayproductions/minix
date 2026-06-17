import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Gather user activity signals
  const [{ data: likes }, { data: ratings }, { data: recentPlays }] = await Promise.all([
    supabase
      .from("likes")
      .select("game:games(title, category, game_type)")
      .eq("user_id", user.id)
      .limit(10),
    supabase
      .from("ratings")
      .select("score, game:games(title, category, game_type)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("games")
      .select("id, title, category, game_type, total_plays, average_rating")
      .eq("status", "published")
      .eq("visibility", "public")
      .order("total_plays", { ascending: false })
      .limit(30),
  ]);

  const likedCategories = likes?.map((l: any) => l.game?.category).filter(Boolean) ?? [];
  const highRatedCategories = ratings
    ?.filter((r: any) => r.score >= 4)
    .map((r: any) => r.game?.category)
    .filter(Boolean) ?? [];

  const activitySummary = `
Liked game categories: ${likedCategories.join(", ") || "none yet"}
Highly rated categories (4+ stars): ${highRatedCategories.join(", ") || "none yet"}
Available games: ${JSON.stringify(recentPlays?.map((g) => ({ id: g.id, title: g.title, category: g.category, game_type: g.game_type, plays: g.total_plays, rating: g.average_rating })) ?? [])}
  `.trim();

  const stream = await anthropic.messages.stream({
    model: "claude-opus-4-8",
    max_tokens: 1024,
    thinking: { type: "adaptive" },
    messages: [
      {
        role: "user",
        content: `You are a game recommendation engine for MiniX. Based on this user's activity, pick the best 10 game IDs to show them.

${activitySummary}

Reply with ONLY a JSON array of game IDs (strings) in recommended order, like: ["id1","id2","id3"]
If there's no activity, return all available IDs ordered by rating then plays.`,
      },
    ],
  });

  const message = await stream.finalMessage();
  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return NextResponse.json({ ids: [] });
  }

  try {
    const ids: string[] = JSON.parse(textBlock.text);
    return NextResponse.json({ ids });
  } catch {
    return NextResponse.json({ ids: [] });
  }
}

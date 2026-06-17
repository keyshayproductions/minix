import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();

  if (!prompt?.trim()) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }

  const stream = await anthropic.messages.stream({
    model: "claude-opus-4-8",
    max_tokens: 4096,
    thinking: { type: "adaptive" },
    messages: [
      {
        role: "user",
        content: `You are a creative game designer for MiniX, a mobile-first minigame platform. Generate a complete game concept based on this idea:

"${prompt}"

Respond with a JSON object (no markdown, no code fences) with this exact structure:
{
  "title": "Game title (short, catchy)",
  "tagline": "One-line description",
  "category": "Racing|Puzzle|Action|Platformer|Arcade|Adventure|Battle|Strategy",
  "gameType": "singleplayer|multiplayer|both",
  "playerCount": { "min": 1, "max": 4 },
  "duration": "2-5 min",
  "rules": ["Rule 1", "Rule 2", "Rule 3", "Rule 4"],
  "mechanics": ["Core mechanic 1", "Core mechanic 2", "Core mechanic 3"],
  "winCondition": "How to win",
  "powerUps": ["Power-up 1", "Power-up 2", "Power-up 3"],
  "mapDescription": "Brief description of the game environment/map",
  "difficulty": "Easy|Medium|Hard",
  "monetization": "cosmetics|none",
  "colorScheme": ["#hexcolor1", "#hexcolor2"]
}`,
      },
    ],
  });

  const message = await stream.finalMessage();
  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return NextResponse.json({ error: "No response from AI" }, { status: 500 });
  }

  try {
    const game = JSON.parse(textBlock.text);
    return NextResponse.json({ game });
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response", raw: textBlock.text }, { status: 500 });
  }
}

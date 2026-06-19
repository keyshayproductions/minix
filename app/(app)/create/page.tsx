"use client";

import { useState } from "react";
import Link from "next/link";

type GameConcept = {
  title: string;
  tagline: string;
  category: string;
  gameType: string;
  playerCount: { min: number; max: number };
  duration: string;
  rules: string[];
  mechanics: string[];
  winCondition: string;
  powerUps: string[];
  mapDescription: string;
  difficulty: string;
  colorScheme: string[];
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 p-4 rounded-2xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      <p className="text-xs font-black uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>{title}</p>
      {children}
    </div>
  );
}

function ConceptCard({ concept, onReset }: { concept: GameConcept; onReset: () => void }) {
  const [color1, color2] = concept.colorScheme ?? ["#7c3aed", "#a855f7"];
  return (
    <div className="animate-slide-up">
      <button onClick={onReset} className="flex items-center gap-2 mb-6 text-sm" style={{ color: "var(--text-muted)" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        New Idea
      </button>

      {/* Hero */}
      <div className="rounded-2xl p-5 mb-4"
        style={{ background: `linear-gradient(135deg, ${color1}33, ${color2}22)`, border: `1px solid ${color1}55` }}>
        <div className="flex items-start justify-between gap-3 mb-2">
          <h2 className="text-2xl font-black">{concept.title}</h2>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0"
            style={{ background: `${color1}33`, color: color1 }}>
            {concept.difficulty}
          </span>
        </div>
        <p className="text-sm mb-3" style={{ color: "var(--text-muted)" }}>{concept.tagline}</p>
        <div className="flex flex-wrap gap-2">
          {[concept.category, concept.gameType, concept.duration, `${concept.playerCount.min}–${concept.playerCount.max} players`].map((tag) => (
            <span key={tag} className="px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}>
              {tag}
            </span>
          ))}
        </div>
      </div>

      <Section title="Rules">
        <ol className="flex flex-col gap-2">
          {concept.rules.map((r, i) => (
            <li key={i} className="flex gap-3 text-sm" style={{ color: "var(--text-muted)" }}>
              <span className="font-black flex-shrink-0" style={{ color: color1 }}>{i + 1}.</span>
              {r}
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Core Mechanics">
        <div className="flex flex-col gap-2">
          {concept.mechanics.map((m, i) => (
            <div key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
              <span style={{ color: color1 }}>◆</span>{m}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Win Condition">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>{concept.winCondition}</p>
      </Section>

      {concept.powerUps?.length > 0 && (
        <Section title="Power-Ups">
          <div className="flex flex-wrap gap-2">
            {concept.powerUps.map((p, i) => (
              <span key={i} className="px-3 py-1.5 rounded-xl text-xs font-semibold"
                style={{ background: `${color1}22`, color: color1 }}>
                ⚡ {p}
              </span>
            ))}
          </div>
        </Section>
      )}

      <Section title="Map / Environment">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>{concept.mapDescription}</p>
      </Section>

      <div className="flex gap-3 mt-6 pb-6">
        <button
          className="flex-1 py-3.5 rounded-xl font-bold text-sm transition-all active:scale-95"
          style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))", color: "#fff" }}
        >
          Build This Game
        </button>
        <button
          onClick={onReset}
          className="px-4 py-3.5 rounded-xl font-bold text-sm transition-all active:scale-95"
          style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}
        >
          Regenerate
        </button>
      </div>
    </div>
  );
}

export default function CreatePage() {
  const [activeMode, setActiveMode] = useState<"ai" | "blank" | null>(null);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [concept, setConcept] = useState<GameConcept | null>(null);

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ai/generate-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const text = await res.text();
      let data: any;
      try { data = JSON.parse(text); } catch { throw new Error(`Server error (${res.status}): ${text.slice(0, 300)}`); }
      if (data.error) throw new Error(data.error);
      setConcept(data.game);
    } catch (e: any) {
      setError(e.message ?? "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pt-safe animate-fade-in px-4">
      {!concept && (
        <div className="pt-4 pb-6">
          <h1 className="text-2xl font-black mb-1">Create</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Build your next game</p>
        </div>
      )}

      {concept ? (
        <ConceptCard concept={concept} onReset={() => { setConcept(null); setPrompt(""); }} />
      ) : !activeMode ? (
        <div className="flex flex-col gap-4">
          <button
            onClick={() => setActiveMode("ai")}
            className="w-full p-5 rounded-2xl text-left transition-all active:scale-95"
            style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(168,85,247,0.1))", border: "1px solid var(--accent)" }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <div>
                <p className="font-black">AI Game Builder</p>
                <p className="text-xs" style={{ color: "var(--accent-2)" }}>Powered by Claude AI</p>
              </div>
            </div>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Describe your game idea and AI will generate maps, rules, assets, and gameplay logic automatically.
            </p>
          </button>

          <button
            onClick={() => setActiveMode("blank")}
            className="w-full p-5 rounded-2xl text-left transition-all active:scale-95"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--surface-2)" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
              </div>
              <div>
                <p className="font-black">Blank Project</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Full control</p>
              </div>
            </div>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Start from scratch with the drag-and-drop editor. Build maps, place objects, and configure everything yourself.
            </p>
          </button>

          <Link href="/create/drafts"
            className="flex items-center justify-between p-4 rounded-2xl"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span className="font-semibold text-sm">My Drafts</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </div>
      ) : activeMode === "ai" ? (
        <div className="animate-slide-up">
          <button onClick={() => setActiveMode(null)} className="flex items-center gap-2 mb-6 text-sm" style={{ color: "var(--text-muted)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </button>

          <h2 className="text-xl font-black mb-2">AI Game Builder</h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
            Describe your game idea. Be as detailed as you want.
          </p>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. A multiplayer parkour race with 4 players, checkpoints, and a 3-minute timer..."
            rows={5}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none mb-4"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
          />

          <div className="grid grid-cols-2 gap-3 mb-6">
            {["Multiplayer Race", "Puzzle Game", "Parkour Challenge", "Battle Arena"].map((s) => (
              <button key={s} onClick={() => setPrompt(s)}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-left"
                style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}>
                {s}
              </button>
            ))}
          </div>

          {error && (
            <p className="text-sm px-3 py-2 rounded-xl mb-4"
              style={{ background: "rgba(239,68,68,0.1)", color: "var(--danger)" }}>
              {error}
            </p>
          )}

          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || loading}
            className="w-full py-3.5 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))", color: "#fff" }}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Game ✨"
            )}
          </button>
        </div>
      ) : (
        <div className="animate-slide-up">
          <button onClick={() => setActiveMode(null)} className="flex items-center gap-2 mb-6 text-sm" style={{ color: "var(--text-muted)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </button>
          <h2 className="text-xl font-black mb-2">New Project</h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>Drag-and-drop editor coming soon.</p>
          <div className="flex items-center justify-center h-48 rounded-2xl"
            style={{ background: "var(--surface)", border: "2px dashed var(--border)" }}>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Editor launching...</p>
          </div>
        </div>
      )}
    </div>
  );
}

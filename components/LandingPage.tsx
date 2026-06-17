"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const MOCK_GAMES = [
  { title: "Sky Dash", category: "Racing", plays: "12.4K", rating: "4.8", color: "#7c3aed" },
  { title: "Puzzle Tower", category: "Puzzle", plays: "8.1K", rating: "4.6", color: "#2563eb" },
  { title: "Arena Clash", category: "Action", plays: "31K", rating: "4.9", color: "#dc2626" },
  { title: "Forest Run", category: "Platformer", plays: "5.2K", rating: "4.4", color: "#16a34a" },
  { title: "Neon Kart", category: "Racing", plays: "22K", rating: "4.7", color: "#d97706" },
  { title: "Block Breaker", category: "Arcade", plays: "9.8K", rating: "4.5", color: "#0891b2" },
  { title: "Space War", category: "Action", plays: "18K", rating: "4.8", color: "#7c3aed" },
  { title: "Ice Slide", category: "Puzzle", plays: "4.3K", rating: "4.3", color: "#6366f1" },
  { title: "Rooftop Race", category: "Platformer", plays: "14K", rating: "4.7", color: "#ea580c" },
  { title: "Deep Dive", category: "Adventure", plays: "7.6K", rating: "4.5", color: "#0d9488" },
  { title: "Turbo Smash", category: "Action", plays: "25K", rating: "4.9", color: "#be185d" },
  { title: "Star Collect", category: "Arcade", plays: "11K", rating: "4.6", color: "#7c3aed" },
];

function MockGameCard({ game, style }: { game: typeof MOCK_GAMES[0]; style?: React.CSSProperties }) {
  return (
    <div
      className="rounded-2xl overflow-hidden flex-shrink-0 w-44"
      style={{
        background: "rgba(19,19,26,0.85)",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(8px)",
        ...style,
      }}
    >
      <div className="w-full h-24 flex items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${game.color}33, ${game.color}11)` }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: game.color + "44" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={game.color} strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
          </svg>
        </div>
      </div>
      <div className="p-2.5">
        <p className="font-bold text-xs text-white truncate">{game.title}</p>
        <p className="text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>{game.category}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>▶ {game.plays}</span>
          <span className="text-xs" style={{ color: "#f59e0b" }}>★ {game.rating}</span>
        </div>
      </div>
    </div>
  );
}

function ScrollRow({ games, reverse = false }: { games: typeof MOCK_GAMES; reverse?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let pos = reverse ? -el.scrollWidth / 2 : 0;
    let raf: number;
    const speed = reverse ? -0.4 : 0.4;

    function tick() {
      pos += speed;
      if (pos > el!.scrollWidth / 2) pos = 0;
      if (pos < -el!.scrollWidth / 2) pos = 0;
      el!.style.transform = `translateX(${pos}px)`;
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reverse]);

  const doubled = [...games, ...games];

  return (
    <div className="overflow-hidden">
      <div ref={ref} className="flex gap-3 w-max">
        {doubled.map((g, i) => <MockGameCard key={i} game={g} />)}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const row1 = MOCK_GAMES.slice(0, 6);
  const row2 = MOCK_GAMES.slice(4, 10);
  const row3 = MOCK_GAMES.slice(6, 12);

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden" style={{ background: "var(--background)" }}>
      {/* Scrolling game cards background */}
      <div className="absolute inset-0 flex flex-col justify-center gap-4 py-8 pointer-events-none overflow-hidden"
        style={{ opacity: 0.55 }}>
        <ScrollRow games={row1} />
        <ScrollRow games={row2} reverse />
        <ScrollRow games={row3} />
        <ScrollRow games={row1.slice().reverse()} reverse={false} />
        <ScrollRow games={row2.slice().reverse()} reverse />
      </div>

      {/* Gradient overlays */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, var(--background) 0%, transparent 25%, transparent 75%, var(--background) 100%)" }} />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center, transparent 20%, var(--background) 80%)" }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center"
        style={{ opacity: visible ? 1 : 0, transition: "opacity 0.6s ease" }}>

        {/* Logo */}
        <div className="mb-6" style={{ transform: visible ? "translateY(0)" : "translateY(20px)", transition: "transform 0.6s ease" }}>
          <img src="/logo-white.png" alt="MiniX" className="h-14 w-auto mx-auto mb-3" />
          <p className="text-base" style={{ color: "var(--text-muted)" }}>
            Create. Play. Share.
          </p>
        </div>

        {/* Tagline */}
        <div className="mb-10"
          style={{ transform: visible ? "translateY(0)" : "translateY(20px)", transition: "transform 0.7s ease" }}>
          <h1 className="text-3xl font-black leading-tight mb-3">
            Build games with AI.<br />
            <span className="gradient-text">Play with the world.</span>
          </h1>
          <p className="text-sm max-w-xs mx-auto" style={{ color: "var(--text-muted)" }}>
            The mobile-first platform for creating and discovering minigames.
          </p>
        </div>

        {/* CTAs */}
        <div className="w-full max-w-xs flex flex-col gap-3"
          style={{ transform: visible ? "translateY(0)" : "translateY(20px)", transition: "transform 0.8s ease" }}>
          <Link
            href="/auth/signup"
            className="w-full py-4 rounded-2xl font-black text-base text-center transition-all active:scale-95"
            style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))", color: "#fff" }}
          >
            Get Started — It&apos;s Free
          </Link>
          <Link
            href="/auth/login"
            className="w-full py-4 rounded-2xl font-bold text-base text-center transition-all active:scale-95"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
          >
            Sign In
          </Link>
        </div>

        <p className="text-xs mt-6" style={{ color: "var(--text-dim)" }}>
          Join thousands of creators building the future of mini games
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSent(true);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 animate-fade-in"
      style={{ background: "var(--background)" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <img src="/logo-white.png" alt="MiniX" className="h-12 w-auto mx-auto mb-2" />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Reset your password</p>
        </div>

        {sent ? (
          <div className="text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(34,197,94,0.1)" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="text-lg font-bold mb-2">Check your email</h2>
            <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
              We sent a reset link to <strong>{email}</strong>
            </p>
            <Link href="/auth/login" className="text-sm font-semibold" style={{ color: "var(--accent-2)" }}>
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleReset} className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block" style={{ color: "var(--text-muted)" }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-3.5 rounded-xl text-sm outline-none"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
              />
            </div>

            {error && (
              <p className="text-sm px-3 py-2 rounded-lg" style={{ background: "rgba(239,68,68,0.1)", color: "var(--danger)" }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))", color: "#fff" }}
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>

            <Link href="/auth/login" className="text-center text-sm" style={{ color: "var(--text-muted)" }}>
              ← Back to Sign In
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}

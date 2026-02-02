"use client";

import { useState } from "react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setErr("");
    setLoading(true);
    try {
      const r = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErr(data?.error ?? "Login failed");
        return;
      }

      window.location.href = "/";
    } catch (e: any) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(1200px 600px at 20% -10%, rgba(99, 102, 241, 0.25), transparent 55%)," +
          "radial-gradient(900px 500px at 90% 0%, rgba(16, 185, 129, 0.18), transparent 60%)," +
          "#05070f",
        color: "#e6e8ef",
        fontFamily:
          'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
        display: "grid",
        placeItems: "center",
        padding: 16,
      }}
    >
      <main
        style={{
          width: "min(440px, 92vw)",
          borderRadius: 22,
          border: "1px solid rgba(148, 163, 184, 0.18)",
          background: "rgba(15, 23, 42, 0.35)",
          boxShadow: "0 18px 50px rgba(0, 0, 0, 0.35)",
          padding: 18,
        }}
      >
        <div style={{ padding: 6 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "6px 10px",
              borderRadius: 999,
              border: "1px solid rgba(148, 163, 184, 0.18)",
              background: "rgba(15, 23, 42, 0.35)",
              color: "rgba(226, 232, 240, 0.8)",
              fontSize: 12,
            }}
          >
            🔒 Team access
          </div>

          <h1 style={{ margin: "14px 0 6px 0", fontSize: 26, fontWeight: 750, letterSpacing: "-0.02em" }}>
            Full manual SK
          </h1>

          <p style={{ margin: 0, color: "rgba(226, 232, 240, 0.75)", fontSize: 13, lineHeight: 1.5 }}>
            Enter the team password to view the leaderboard.
          </p>

          <div style={{ marginTop: 16 }}>
            <label
              style={{
                display: "block",
                fontSize: 12,
                color: "rgba(148, 163, 184, 0.95)",
                marginBottom: 8,
              }}
            >
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
              placeholder="••••••••••"
              autoFocus
              style={{
                width: "100%",
                borderRadius: 14,
                border: "1px solid rgba(148, 163, 184, 0.22)",
                background: "rgba(15, 23, 42, 0.55)",
                padding: "11px 12px",
                color: "#e6e8ef",
                outline: "none",
                fontSize: 14,
              }}
            />
          </div>

          {err ? (
            <div
              style={{
                marginTop: 12,
                borderRadius: 16,
                border: "1px solid rgba(239, 68, 68, 0.35)",
                background: "rgba(127, 29, 29, 0.18)",
                padding: 12,
                color: "rgba(254, 226, 226, 0.92)",
                fontSize: 13,
                wordBreak: "break-word",
              }}
            >
              {err}
            </div>
          ) : null}

          <button
            onClick={submit}
            disabled={loading || !password}
            style={{
              width: "100%",
              marginTop: 14,
              borderRadius: 14,
              border: "1px solid rgba(148, 163, 184, 0.22)",
              background: loading ? "rgba(15, 23, 42, 0.35)" : "rgba(99, 102, 241, 0.18)",
              padding: "11px 12px",
              color: loading ? "rgba(226, 232, 240, 0.6)" : "rgba(241, 245, 249, 0.95)",
              cursor: loading || !password ? "not-allowed" : "pointer",
              fontSize: 14,
              fontWeight: 650,
            }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <div style={{ marginTop: 12, fontSize: 12, color: "rgba(148, 163, 184, 0.85)" }}>
            Tip: after login, you’ll stay signed in for 7 days (unless you clear cookies).
          </div>
        </div>
      </main>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

type Row = {
  name: string;
  games: number;
  goals: number;
  assists: number;
  ga: number;
  gaPerMatch: number;
  source?: string;
};

type Payload = {
  updatedAt: string;
  rows: Row[];
};

export default function Page() {
  const [rows, setRows] = useState<Row[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string>("");
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    fetch("/stats.json", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(`stats.json ${r.status}`);
        const data: Payload = await r.json();
        setRows(data.rows ?? []);
        setUpdatedAt(data.updatedAt ?? "");
      })
      .catch((e) => setError(String(e)));
  }, []);

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 28, marginBottom: 6 }}>Full manual SK</h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>
        G+A per match leaderboard
        {updatedAt ? ` • Updated: ${new Date(updatedAt).toLocaleString()}` : ""}
      </p>

      {error ? (
        <pre style={{ color: "crimson", marginTop: 12 }}>{error}</pre>
      ) : (
        <table
          cellPadding={8}
          style={{ borderCollapse: "collapse", width: "100%", maxWidth: 900 }}
        >
          <thead>
            <tr>
              <th align="left">Player</th>
              <th align="right">Games</th>
              <th align="right">Goals</th>
              <th align="right">Assists</th>
              <th align="right">G+A</th>
              <th align="right">G+A / Match</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} style={{ borderTop: "1px solid #ddd" }}>
                <td>{r.name}</td>
                <td align="right">{r.games}</td>
                <td align="right">{r.goals}</td>
                <td align="right">{r.assists}</td>
                <td align="right">{r.ga}</td>
                <td align="right">{r.gaPerMatch.toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}

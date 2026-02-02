"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";

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

function fmtDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

export default function Page() {
  const [rows, setRows] = useState<Row[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [query, setQuery] = useState<string>("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");

    fetch("/stats.json", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(`stats.json ${r.status}`);
        return (await r.json()) as Payload;
      })
      .then((data) => {
        if (!alive) return;
        setRows(data.rows ?? []);
        setUpdatedAt(data.updatedAt ?? "");
      })
      .catch((e) => {
        if (!alive) return;
        setError(String(e));
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.name.toLowerCase().includes(q));
  }, [rows, query]);

  const top3 = filtered.slice(0, 3);

  const totals = useMemo(() => {
    const games = filtered.reduce((s, r) => s + (r.games || 0), 0);
    const goals = filtered.reduce((s, r) => s + (r.goals || 0), 0);
    const assists = filtered.reduce((s, r) => s + (r.assists || 0), 0);
    const ga = goals + assists;
    return { games, goals, assists, ga };
  }, [filtered]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.container}>
          <div className={styles.headerRow}>
            <div>
              <h1 className={styles.title}>Full manual SK</h1>
            
            </div>

            <div className={styles.headerRight}>
              <div className={styles.searchWrap}>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search player…"
                  className={styles.search}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className={styles.container}>
        {error ? (
          <div className={styles.errorBox}>
            <div className={styles.errorTitle}>Could not load stats</div>
            <div className={styles.errorText}>{error}</div>
          </div>
        ) : null}

        <section className={styles.cardsGrid}>
          <StatCard title="Players" value={String(filtered.length)} loading={loading} />
          <StatCard title="Total games" value={String(totals.games)} loading={loading} />
          <StatCard title="Total G+A" value={String(totals.ga)} loading={loading} />
          <StatCard
            title="Avg G+A / match"
            value={totals.games > 0 ? (totals.ga / totals.games).toFixed(4) : "0.0000"}
            loading={loading}
          />
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Top performers</h2>
            <span className={styles.sectionHint}></span>
          </div>

          <div className={styles.topGrid}>
            {loading ? (
              <>
                <TopSkeleton />
                <TopSkeleton />
                <TopSkeleton />
              </>
            ) : top3.length ? (
              top3.map((p, idx) => (
                <div key={p.name} className={styles.topCard}>
                  <div className={styles.topCardRow}>
                    <span className={styles.rank}>#{idx + 1}</span>
                    <span className={styles.muted}>{p.games} games</span>
                  </div>

                  <div className={styles.playerName}>{p.name}</div>

                  <div className={styles.topCardBottom}>
                    <div>
                      <div className={styles.muted}>G+A / match</div>
                      <div className={styles.bigNumber}>{p.gaPerMatch.toFixed(4)}</div>
                    </div>
                    <div className={styles.right}>
                      <div className={styles.mutedMono}>
                        {p.goals}G + {p.assists}A
                      </div>
                      <div className={styles.mutedMono}>{p.ga} total</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyBox}>No players match your search.</div>
            )}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>All players</h2>
            <span className={styles.sectionHint}>Showing {filtered.length}</span>
          </div>

          <div className={styles.tableWrap}>
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Player</th>
                    <th className={styles.num}>Games</th>
                    <th className={styles.num}>Goals</th>
                    <th className={styles.num}>Assists</th>
                    <th className={styles.num}>G+A</th>
                    <th className={styles.num}>G+A / Match</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i}>
                        <td className={styles.loadingCell}>Loading…</td>
                        <td className={styles.numMuted}>—</td>
                        <td className={styles.numMuted}>—</td>
                        <td className={styles.numMuted}>—</td>
                        <td className={styles.numMuted}>—</td>
                        <td className={styles.numMuted}>—</td>
                      </tr>
                    ))
                  ) : filtered.length ? (
                    filtered.map((r) => (
                      <tr key={r.name}>
                        <td className={styles.nameCell}>{r.name}</td>
                        <td className={styles.numMono}>{r.games}</td>
                        <td className={styles.numMono}>{r.goals}</td>
                        <td className={styles.numMono}>{r.assists}</td>
                        <td className={styles.numMono}>{r.ga}</td>
                        <td className={styles.numStrong}>{r.gaPerMatch.toFixed(4)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className={styles.emptyRow}>
                        No players match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className={styles.tableFooter}>
              <span className={styles.mutedMono}>
                {updatedAt ? `Updated ${fmtDate(updatedAt)}` : ""}
              </span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({
  title,
  value,
  loading,
}: {
  title: string;
  value: string;
  loading?: boolean;
}) {
  return (
    <div className={styles.card}>
      <div className={styles.cardLabel}>{title}</div>
      <div className={styles.cardValue}>
        {loading ? <span className={styles.muted}>…</span> : value}
      </div>
    </div>
  );
}

function TopSkeleton() {
  return (
    <div className={styles.topCard}>
      <div className={styles.skelLine} style={{ width: 40 }} />
      <div className={styles.skelLine} style={{ width: 140, height: 18, marginTop: 10 }} />
      <div className={styles.skelBlock} style={{ height: 44, marginTop: 18 }} />
    </div>
  );
}

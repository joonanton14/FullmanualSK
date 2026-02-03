"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<number | null>(null);
  const [soundOn, setSoundOn] = useState(false);
  const [soundError, setSoundError] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [query, setQuery] = useState<string>("");
  const [showSoundHint, setShowSoundHint] = useState(false);

  useEffect(() => {
  // show hint only once per browser/device
  const seen = localStorage.getItem("seenSoundHint");
  if (!seen) setShowSoundHint(true);
  }, []);

  function dismissSoundHint() {
  localStorage.setItem("seenSoundHint", "1");
  setShowSoundHint(false);
  }

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

async function toggleSound() {
    setSoundError("");
console.log("Sound button clicked");

    // Turn OFF
    if (soundOn) {
      setSoundOn(false);
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Turn ON (must play from user gesture click)
   try {
    if (!audioRef.current) {
      const a = new Audio("/sounds/scary-scream-401725.mp3");
      a.preload = "auto";
      a.volume = 0.8;
      a.load(); // prime it
      audioRef.current = a;
    }

    const a = audioRef.current!;
    a.pause();
    a.currentTime = 0;

    // tiny delay helps some browsers
    await new Promise((r) => setTimeout(r, 50));

    await a.play();

    setSoundOn(true);

    intervalRef.current = window.setInterval(() => {
    const aa = audioRef.current;
    if (!aa) return;
    aa.currentTime = 0;
    aa.play().catch(() => {});
    }, 14000);
    } catch (e: any) {
    console.log(e);
    setSoundError(`${e?.name}: ${e?.message || "blocked"}`);
    }
  }

  async function logout() {
    try {
      await fetch("/api/logout", { method: "POST" });
    } finally {
      window.location.href = "/login";
    }
  }

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

              <div className={styles.soundHintWrap}>
    <button
      type="button"
      onClick={async () => {
      if (showSoundHint) dismissSoundHint();
      await toggleSound();
      }}
      className={styles.soundButton}
    >
    {soundOn ? "Sound: ON" : "Sound: OFF"}

    {showSoundHint ? <span className={styles.newBadge}>NEW</span> : null}
    </button>

    {showSoundHint ? (
    <div className={styles.soundPopover} role="dialog" aria-label="New feature">
      <div className={styles.soundPopoverTitle}>New: Scream butt0n</div>
      <div className={styles.soundPopoverText}>
        Click <b>S0und</b> t0 enable the scream every 14 seconds 😈
      </div>

      <div className={styles.soundPopoverActions}>
        <button className={styles.soundPopoverOk} onClick={dismissSoundHint}>
          G0t it
        </button>
      </div>
      </div>
        ) : null}
      </div>

      <button type="button" className={styles.logoutButton} onClick={logout}>
        L0g 0ut
      </button>
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
          <StatCard title="T0tal games" value={String(totals.games)} loading={loading} />
          <StatCard title="T0tal G+A" value={String(totals.ga)} loading={loading} />
          <StatCard
            title="Avg G+A / match"
            value={totals.games > 0 ? (totals.ga / totals.games).toFixed(4) : "0.0000"}
            loading={loading}
          />
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>T0p perf0rmers</h2>
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
                    <span className={styles.rank}>{idx + 1}</span>
                    <span className={styles.muted}>{p.games} games</span>
                  </div>

                  <div className={styles.playerLine}>
                    <div className={styles.playerName}>{p.name}</div>

                    {idx !== 0 && (
                      <img
                        src="/gifs/screamingbeaver.gif"
                        alt="Screaming beaver"
                        className={styles.beaverBig}
                      />
                    )}
                  </div>

                  <div className={styles.topCardBottom}>
                    <div>
                      <div className={styles.muted}>P0ints average</div>
                      <div className={styles.bigNumber}>{p.gaPerMatch.toFixed(4)}</div>
                    </div>
                    <div className={styles.right}>
                      <div className={styles.mutedMono}>
                        {p.goals}G + {p.assists}A
                      </div>
                      <div className={styles.mutedMono}>{p.ga} t0tal</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyBox}>N0 players match y0ur search.</div>
            )}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>All players</h2>
            <span className={styles.sectionHint}></span>
          </div>

          <div className={styles.tableWrap}>
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Player</th>
                    <th className={styles.num}>Games</th>
                    <th className={styles.num}>G0als</th>
                    <th className={styles.num}>Assists</th>
                    <th className={styles.num}>G+A</th>
                    <th className={styles.num}>PPP</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i}>
                        <td className={styles.loadingCell}>L0ading…</td>
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
                        N0 players match your search.
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

import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export const runtime = "nodejs";

// Simple in-memory cache (10 min)
let cache: { at: number; data: any } | null = null;
const CACHE_MS = 10 * 60 * 1000;

const CLUB_ID = "420295";
const SQUAD_URL = `https://proclubshead.com/26/club-squad/gen5-${CLUB_ID}/`;
const BASE = "https://proclubshead.com";

function pickNumberNear(label: string, text: string): number | null {
  // Finds: label ... number (handles decimals too, but we’ll use it for ints here)
  const re = new RegExp(
    label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + `[\\s\\S]{0,120}?(\\d+(?:\\.\\d+)?)`,
    "i"
  );
  const m = text.match(re);
  return m ? Number(m[1]) : null;
}

export async function GET(req: Request) {
  // optional query: minGames (you’re using 0 now)
  const { searchParams } = new URL(req.url);
  const minGames = Number(searchParams.get("minGames") ?? "0");

  // Serve cache
  if (cache && Date.now() - cache.at < CACHE_MS) {
    return NextResponse.json({ ...cache.data, cached: true });
  }

  // 1) Fetch squad page to get player links
  const squadRes = await fetch(SQUAD_URL, {
    headers: { "User-Agent": "Mozilla/5.0", Accept: "text/html" },
  });

  if (!squadRes.ok) {
    return NextResponse.json(
      { error: `ProClubsHead squad page ${squadRes.status}` },
      { status: 502 }
    );
  }

  const squadHtml = await squadRes.text();
  const $squad = cheerio.load(squadHtml);

  const playerUrls = new Set<string>();
  $squad("a[href]").each((_, el) => {
    const href = $squad(el).attr("href") || "";
    if (href.includes(`/26/club-player/gen5-${CLUB_ID}-`)) {
      playerUrls.add(href.startsWith("http") ? href : `${BASE}${href}`);
    }
  });

  const urls = [...playerUrls];

  // 2) Fetch each player page and parse totals
  const players = await Promise.all(
    urls.map(async (url) => {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0", Accept: "text/html" },
      });
      if (!res.ok) return null;

      const html = await res.text();
      const $ = cheerio.load(html);

      const name =
        $("h1").first().text().trim() ||
        url.split("-").pop()?.replace("/", "") ||
        "Unknown";

      // flatten text so our regex works
      const text = $.text().replace(/\s+/g, " ");

      const games = pickNumberNear("Matches played", text) ?? 0;
      const goals = pickNumberNear("Goals", text) ?? 0;
      const assists = pickNumberNear("Assists", text) ?? 0;

      const ga = goals + assists;

      // ✅ ALWAYS compute ourselves (no rounded value from site)
      const gaPerMatch = games > 0 ? ga / games : 0;

      return { name, games, goals, assists, ga, gaPerMatch, source: url };
    })
  );

  const rows = players
    .filter(Boolean)
    .filter((p: any) => p.games >= minGames)
    .sort((a: any, b: any) => b.gaPerMatch - a.gaPerMatch);

  const data = {
    clubId: CLUB_ID,
    source: "proclubshead",
    updatedAt: new Date().toISOString(),
    minGames,
    rows,
  };

  cache = { at: Date.now(), data };

  return NextResponse.json({ ...data, cached: false });
}

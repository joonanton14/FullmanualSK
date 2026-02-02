import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";

const CLUB_ID = "420295";
const SQUAD_URL = `https://proclubshead.com/26/club-squad/gen5-${CLUB_ID}/`;
const BASE = "https://proclubshead.com";

function pickNumberNear(label, text) {
  const re = new RegExp(
    label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + `[\\s\\S]{0,120}?(\\d+(?:\\.\\d+)?)`,
    "i"
  );
  const m = text.match(re);
  return m ? Number(m[1]) : null;
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0", Accept: "text/html" },
  });
  if (!res.ok) throw new Error(`Fetch failed ${res.status} for ${url}`);
  return await res.text();
}

async function main() {
  // 1) squad page → player links
  const squadHtml = await fetchHtml(SQUAD_URL);
  const $squad = cheerio.load(squadHtml);

  const playerUrls = new Set();
  $squad("a[href]").each((_, el) => {
    const href = $squad(el).attr("href") || "";
    if (href.includes(`/26/club-player/gen5-${CLUB_ID}-`)) {
      playerUrls.add(href.startsWith("http") ? href : `${BASE}${href}`);
    }
  });

  const urls = [...playerUrls];

  // 2) each player page → totals → compute GA/match
  const players = await Promise.all(
    urls.map(async (url) => {
      const html = await fetchHtml(url);
      const $ = cheerio.load(html);

      const name = $("h1").first().text().trim() || "Unknown";
      const text = $.text().replace(/\s+/g, " ");

      const games = pickNumberNear("Matches played", text) ?? 0;
      const goals = pickNumberNear("Goals", text) ?? 0;
      const assists = pickNumberNear("Assists", text) ?? 0;

      const ga = goals + assists;
      const gaPerMatch = games > 0 ? ga / games : 0;

      return { name, games, goals, assists, ga, gaPerMatch, source: url };
    })
  );

  const rows = players.sort((a, b) => b.gaPerMatch - a.gaPerMatch);

  const payload = {
    updatedAt: new Date().toISOString(),
    rows,
  };

  const outPath = path.join(process.cwd(), "public", "stats.json");
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), "utf8");

  console.log(`Wrote ${outPath} with ${rows.length} players.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

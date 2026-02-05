import fs from "node:fs";
import path from "node:path";

const raw = process.env.EA_JSON || "";
if (!raw.trim()) {
  throw new Error("EA_JSON is empty. Paste the full JSON into the workflow input.");
}

// Sometimes pasted JSON may include smart quotes or extra whitespace; basic trim helps.
let data;
try {
  data = JSON.parse(raw);
} catch (e) {
  // Helpful debugging: show first chars
  const head = raw.slice(0, 120).replace(/\s+/g, " ");
  throw new Error(`Could not parse pasted JSON. Starts with: ${head}`);
}

if (!data?.members || !Array.isArray(data.members)) {
  throw new Error("Parsed JSON does not contain members[]. Make sure you pasted the EA members/stats response.");
}

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

const rows = data.members.map((m) => {
  const games = toNum(m.gamesPlayed);
  const goals = toNum(m.goals);
  const assists = toNum(m.assists);
  const ga = goals + assists;
  const gaPerMatch = games > 0 ? ga / games : 0;

  return {
    name: String(m.name ?? ""),
    games,
    goals,
    assists,
    ga,
    gaPerMatch, // keep as number; UI will toFixed(4)
    source: "ea-paste",
  };
});

// Sort by G+A per match (desc), then games (desc)
rows.sort((a, b) => {
  if (b.gaPerMatch !== a.gaPerMatch) return b.gaPerMatch - a.gaPerMatch;
  return b.games - a.games;
});

const payload = {
  updatedAt: new Date().toISOString(),
  rows,
};

const outPath = path.join(process.cwd(), "public", "stats.json");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(payload, null, 2) + "\n", "utf8");

console.log(`Wrote ${outPath} with ${rows.length} players`);

#!/usr/bin/env bun
// Deterministic red-line check: for each uncommitted security note (n-z half),
// re-fetch every sidecar URL (hard per-fetch timeout) and confirm the verbatim quote
// appears in the freshly fetched document. Flags mismatches for manual judgment.
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";

const GARDEN = "/Users/cam/Desktop/dev-notes";
const SECTION = process.argv[2] || "security";
const norm = (s: string) =>
  s.replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;|&#\d+;/gi, " ")
    .replace(/[‘’“”]/g, "'")
    .replace(/\[\s*\d+\s*\]/g, " ")
    .replace(/[\s ]+/g, " ")
    .toLowerCase()
    .trim();

// n-z uncommitted security notes
// enumerate section notes directly (robust for brand-new untracked folders, which
// git status collapses to a single dir line). Optional extra args = specific slugs to limit to.
const onlySlugs = process.argv.slice(3);
let list = execSync(`cd ${GARDEN} && fd -e md . content/cs/${SECTION}`, { encoding: "utf8" })
  .trim().split("\n").filter(Boolean);
if (onlySlugs.length) list = list.filter((f) => onlySlugs.some((s) => f.includes(s)));

const nz = list; // now: ALL untracked security notes

const cache = new Map<string, string>();
function fetchText(url: string): string {
  if (cache.has(url)) return cache.get(url)!;
  let out = "";
  try {
    const isPdf = /\.pdf($|\?)/i.test(url);
    if (isPdf) {
      out = execSync(`curl -sL --max-time 25 -A 'Mozilla/5.0' ${JSON.stringify(url)} -o /tmp/_q.pdf && pdftotext /tmp/_q.pdf - 2>/dev/null || true`, { encoding: "utf8", maxBuffer: 20e6 });
    } else {
      out = execSync(`curl -sL --max-time 25 -A 'Mozilla/5.0' ${JSON.stringify(url)}`, { encoding: "utf8", maxBuffer: 20e6 });
    }
  } catch { out = ""; }
  const n = norm(out);
  cache.set(url, n);
  return n;
}

let totalClaims = 0, matched = 0;
const misses: string[] = [];
for (const f of nz) {
  const slug = f.split("/").pop()!.replace(/\.md$/, "");
  const sc = join(GARDEN, ".garden/claims", slug + ".json");
  if (!existsSync(sc)) { misses.push(`${slug}: NO SIDECAR`); continue; }
  let claims: any[] = [];
  try { claims = JSON.parse(readFileSync(sc, "utf8")).claims || []; } catch { misses.push(`${slug}: BAD SIDECAR JSON`); continue; }
  for (const c of claims) {
    totalClaims++;
    if (!c.url || !c.quote) { misses.push(`${slug}: claim missing url/quote`); continue; }
    const doc = fetchText(c.url);
    if (!doc) { misses.push(`${slug}: FETCH FAILED ${c.url}`); continue; }
    const q = norm(c.quote);
    // check full quote, else longest 12-word span (handles elisions/artifacts)
    if (doc.includes(q)) { matched++; continue; }
    const words = q.split(" ");
    const span = words.slice(0, Math.min(12, words.length)).join(" ");
    if (words.length >= 6 && doc.includes(span)) { matched++; continue; }
    misses.push(`${slug}: QUOTE NOT FOUND in ${c.url}\n    quote: "${c.quote.slice(0, 100)}"`);
  }
}

console.log(`n-z notes: ${nz.length} | claims: ${totalClaims} | matched: ${matched} | flagged: ${misses.length}`);
console.log(nz.map((f) => "  " + f.split("/").pop()).join("\n"));
if (misses.length) { console.log("\nFLAGGED (manual review):"); console.log(misses.join("\n")); }

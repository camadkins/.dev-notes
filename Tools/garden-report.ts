#!/usr/bin/env bun
/**
 * garden-report.ts: report the garden's numbers. Never fails, never blocks.
 *
 * Drafts, unsourced notes, alias counts, and tag spread are health signals, not gates. A draft
 * is a legitimate state; a draft that has sat for a year while eleven notes link to it is worth
 * seeing. This prints a number, and the number is the point.
 *
 * Usage: bun Tools/garden-report.ts [garden]
 */
import { Glob } from "bun";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";

const G = process.argv[2] ?? ".";
const C = join(G, "content");
let notes = 0, drafts = 0, aliases = 0, noSources = 0, words = 0;
const staleDrafts: Array<[string, number]> = [];
const t3 = new Map<string, Set<string>>();
const SECTIONS = new Set<string>();

for (const f of new Glob("**/*.md").scanSync(C)) {
  const rel = f.replace(/\\/g, "/");
  if (rel.startsWith("private/") || rel.split("/").some((s) => s.startsWith("_"))) continue;
  const raw = readFileSync(join(C, rel), "utf8");
  const fm = raw.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
  const body = raw.replace(/^---\n[\s\S]*?\n---/, "");
  notes++;
  words += body.split(/\s+/).length;
  const sec = rel.split("/").slice(0, -1).join("/");
  SECTIONS.add(sec);
  if (/^draft:\s*true\s*$/m.test(fm)) {
    drafts++;
    // git, not mtime: a mass sweep rewrites every file and makes mtime meaningless
    let age = -1;
    try {
      const iso = execSync(`git log -1 --format=%cI -- "content/${rel}"`, { cwd: G, encoding: "utf8" }).trim();
      if (iso) age = Math.floor((Date.now() - Date.parse(iso)) / 86400000);
    } catch {}
    staleDrafts.push([rel, age]);
  }
  if (!/^##\s+Sources/m.test(body)) noSources++;
  const inline = fm.match(/^aliases:\s*\[(.*?)\]\s*$/m);
  const block = fm.match(/^aliases:\s*\n((?:[ \t]+-[ \t]+.+\n?)+)/m);
  if (inline) aliases += inline[1].split(",").filter((a) => a.trim()).length;
  else if (block) aliases += block[1].trim().split("\n").length;
  const tb = fm.match(/^tags:\s*\n((?:[ \t]+-[ \t]+.+\n?)+)/m);
  if (tb) for (const line of tb[1].trim().split("\n")) {
    const t = line.replace(/^[ \t]+-[ \t]+/, "").trim();
    if (["cs", "off-watch", "meta"].includes(t) || t.startsWith("resource/")) continue;
    // a tag equal to the note's own folder is the Tier-2 section tag, derived, not Tier 3
    const leaf = sec.split("/").pop() ?? "";
    if (t === leaf || (leaf === "military-computing" && t === "military")) continue;
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(t)) continue;
    if (!t3.has(t)) t3.set(t, new Set());
    t3.get(t)!.add(sec);
  }
}
staleDrafts.sort((a, b) => b[1] - a[1]);
const singleton = [...t3.entries()].filter(([, v]) => v.size < 2).map(([k]) => k);

const out: string[] = [];
out.push("## Garden report", "");
out.push("| metric | value |", "| --- | --- |");
out.push(`| published notes | ${notes - drafts} |`);
out.push(`| drafts | ${drafts} |`);
out.push(`| total words | ${words.toLocaleString()} |`);
out.push(`| median words/note | ${Math.round(words / Math.max(notes, 1))} |`);
out.push(`| aliases | ${aliases} |`);
out.push(`| notes without a Sources section | ${noSources} |`);
out.push(`| tier-3 tags | ${t3.size} |`);
out.push(`| tier-3 tags in only one section | ${singleton.length} |`);
if (staleDrafts.length) {
  out.push("", "### Oldest drafts", "");
  staleDrafts.slice(0, 10).forEach(([r, a]) => out.push(`- \`${r}\` — last commit ${a < 0 ? "unknown" : a + " days ago"}`));
}
if (singleton.length) out.push("", `### Single-section tier-3 tags`, "", singleton.map((s) => `\`${s}\``).join(" · "));
console.log(out.join("\n"));

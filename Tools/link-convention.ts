#!/usr/bin/env bun
/**
 * link-convention.ts: fail on a bare-basename wikilink.
 *
 * The garden runs `markdownLinkResolution: absolute`, so every internal link must be a full
 * path from the content root. A bare `[[gradient-descent]]` resolves to `/gradient-descent`
 * and 404s on the deployed site while resolving fine in Obsidian, which is why 3,530 of them
 * accumulated unnoticed. Markdown-level slug checks cannot see this; only this convention can.
 */
import { Glob } from "bun";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const GARDEN = process.argv[2] ?? ".";
const C = join(GARDEN, "content");
const bad: string[] = [];
for (const f of new Glob("**/*.md").scanSync(C)) {
  const rel = f.replace(/\\/g, "/");
  if (rel.startsWith("private/")) continue;
  const raw = readFileSync(join(C, rel), "utf8");
  const fm = raw.match(/^---\n[\s\S]*?\n---/);
  const offset = fm ? fm[0].split("\n").length - 1 : 0;
  const body = raw.replace(/^---\n[\s\S]*?\n---/, "");
  let fence = false;
  body.split("\n").forEach((line, i) => {
    if (line.trim().startsWith("```")) { fence = !fence; return; }
    if (fence) return;
    if (/^\s*(>|\||<!--)/.test(line)) return;
    // strip inline code first: `[[target]]` in a syntax example is documentation, not a link
    line = line.replace(/``[^`]*``/g, "").replace(/`[^`]*`/g, "");
    for (const m of line.matchAll(/\[\[([^\]|#]+)(?:[#|][^\]]*)?\]\]/g)) {
      const t = m[1].trim();
      if (t && !t.includes("/") && !/^https?:/.test(t)) bad.push(`${rel}:${i + 1 + offset}  [[${t}]]`);
    }
  });
}
console.log(`link-convention: ${bad.length} bare-basename wikilink(s)`);
bad.slice(0, 20).forEach((b) => console.log("  " + b));
process.exit(bad.length ? 1 : 0);

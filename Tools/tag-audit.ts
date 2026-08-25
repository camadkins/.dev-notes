#!/usr/bin/env bun
/**
 * tag-audit — deterministic enforcement of TAXONOMY.md.
 *
 *   bun Tools/tag-audit.ts            # report violations, exit non-zero if any (a-c)
 *   bun Tools/tag-audit.ts --fix      # auto-correct root/section from path + apply alias map
 *   bun Tools/tag-audit.ts --json     # machine-readable report
 *
 * Checks every note under content/:
 *   (a) exactly one root tag valid for its path (cs | off-watch | meta)
 *   (b) exactly one section tag equal to folder -> section
 *   (c) every other tag is an allowlisted Tier-3 tag or a resource/* tag
 *   (d) alias normalization  — non-canonical form flagged with its canonical target
 *   (e) folder-shadow         — a concept tag that merely restates a section name
 *   (f) singleton report      — Tier-3 tags used on exactly one note
 *
 * The taxonomy is the source of truth in TAXONOMY.md; this file is its executable form.
 */
import { Glob } from "bun";
import { readFileSync, writeFileSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { homedir } from "node:os";

const expand = (p: string) => (p.startsWith("~") ? join(homedir(), p.slice(1)) : p);
const ARGS = process.argv.slice(2).filter((a) => !a.startsWith("-"));
// Default to the repo we are standing in, so the same command works locally and on a CI
// runner. Falling back to a fixed ~ path resolved to /home/runner/... and failed the job.
import { existsSync } from "node:fs";
const GARDEN = expand(ARGS[0] ?? (existsSync(join(process.cwd(), "content")) ? process.cwd() : "~/Desktop/dev-notes"));
const CONTENT = join(GARDEN, "content");
const FIX = process.argv.includes("--fix");
const JSON_OUT = process.argv.includes("--json");

// folder (relative to content/) -> section tag. Longest-prefix match wins.
const FOLDER_SECTION: [string, string][] = [
  ["cs/dsa", "dsa"], ["cs/pl", "pl"], ["cs/systems", "systems"], ["cs/languages", "languages"],
  ["cs/machine-learning", "machine-learning"], ["cs/deep-learning", "deep-learning"],
  ["cs/statistics", "statistics"], ["cs/math", "math"], ["cs/history", "history"],
  ["cs/military-computing", "military"], ["cs/ethics", "ethics"],
  ["cs/geopolitics", "geopolitics"], ["cs/software-engineering", "software-engineering"],
  ["cs/security", "security"], ["cs/networking", "networking"], ["cs/cisco", "cisco"], ["cs/resources", "resources"],
  ["cs/standards", "standards"], ["cs/law", "law"], ["cs/forensics", "forensics"],
  ["off-watch/books", "books"], ["off-watch/media", "media"], ["off-watch/golf", "golf"],
  ["off-watch/games", "games"], ["off-watch/dnd", "dnd"], ["off-watch", "off-watch"],
  ["meta", "meta"], ["cs", "cs"],
];

const ROOT_FOR = (rel: string) =>
  rel.startsWith("cs/") || rel === "cs" ? "cs"
  : rel.startsWith("off-watch") ? "off-watch"
  : rel.startsWith("meta") ? "meta" : null;

const SECTION_FOR = (relDir: string): string | null => {
  for (const [prefix, tag] of FOLDER_SECTION) if (relDir === prefix || relDir.startsWith(prefix + "/")) return tag;
  return null;
};

const ALLOWLIST = new Set([
  "algorithms",
  "build-systems",
  "compilers",
  "computer-architecture",
  "concurrency",
  "cryptography",
  "data-structures",
  "databases",
  "distributed-systems",
  "error-handling",
  "formal-methods",
  "golf",
  "languages",
  "memory",
  "operating-systems",
  "optimization",
  "serialization",
  "testing",
  "type-theory",
  "unsupervised-learning",
  "web",
]);

// non-canonical -> canonical (or "" to drop as section-internal / noise)
const ALIAS: Record<string, string> = {
  unsupervised: "unsupervised-learning", supervised: "supervised-learning",
  rnn: "", "convolutional-neural-networks": "", "artificial-neural-networks": "",
  autoencoders: "", transformers: "", attention: "", backpropagation: "",
  "activation-functions": "", "loss-functions": "", "gradient-descent": "",
  regularization: "", generalization: "", "bias-variance": "", "data-splits": "",
  evaluation: "", ensembles: "", embeddings: "", "dimensionality-reduction": "",
  representation: "", "transfer-learning": "", "meta-learning": "", "diffusion-models": "",
  "generative-adversarial-networks": "generative-models",
  rust: "", python: "", cpp: "", racket: "", ansible: "",
  "undefined-behavior": "", abi: "", ffi: "", "supply-chain": "", dependencies: "",
  declarative: "", trees: "", slots: "", leaves: "", edges: "", internal: "",
};

const SECTIONS = new Set(FOLDER_SECTION.map(([, t]) => t));
const ROOTS = new Set(["cs", "off-watch", "meta"]);

type Viol = { file: string; kind: string; msg: string };
const viols: Viol[] = [];
const tier3Count = new Map<string, string[]>();

function parseTags(fm: string): string[] {
  const inline = fm.match(/^tags:\s*\[([^\]]*)\]/m);
  if (inline) return inline[1].split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
  const out: string[] = [];
  const lines = fm.split("\n");
  let intag = false;
  for (const ln of lines) {
    if (/^tags:\s*$/.test(ln)) { intag = true; continue; }
    if (intag && /^\s*-\s+/.test(ln)) { out.push(ln.replace(/^\s*-\s+/, "").trim().replace(/^["']|["']$/g, "")); continue; }
    if (intag && /^\S/.test(ln)) break;
  }
  return out;
}

const glob = new Glob("**/*.md");
let files = 0, fixed = 0;
for (const f of glob.scanSync(CONTENT)) {
  files++;
  const abs = join(CONTENT, f);
  const rel = f.replace(/\\/g, "/");
  if (rel === "index.md") { files--; continue; } // garden home page, no root/section
  // private/ holds raw lecture notes (Quartz ignorePatterns already excludes them from
  // the build). They are Harvest feedstock, not garden notes, so the taxonomy does not apply.
  if (rel === "private" || rel.startsWith("private/")) { files--; continue; }
  const relDir = dirname(rel);
  const text = readFileSync(abs, "utf8");
  const fmMatch = text.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) { viols.push({ file: rel, kind: "fm", msg: "no frontmatter" }); continue; }
  const fm = fmMatch[1];
  const tags = parseTags(fm);
  const expectRoot = ROOT_FOR(rel);
  const expectSection = SECTION_FOR(relDir);

  const roots = tags.filter((t) => ROOTS.has(t));
  const sections = tags.filter((t) => SECTIONS.has(t) && t !== expectRoot);
  const others = tags.filter((t) => !ROOTS.has(t) && !SECTIONS.has(t) && !t.startsWith("resource/"));
  const resourceTags = tags.filter((t) => t.startsWith("resource/"));

  // (a) root
  if (!roots.includes(expectRoot ?? "")) viols.push({ file: rel, kind: "a-root", msg: `missing/wrong root; expected ${expectRoot}` });
  if (roots.length > 1) viols.push({ file: rel, kind: "a-root", msg: `multiple roots: ${roots.join(", ")}` });

  // (b) section
  const hasSection = expectSection && tags.includes(expectSection);
  if (!hasSection) viols.push({ file: rel, kind: "b-section", msg: `missing section '${expectSection}' for folder ${relDir}` });
  const straySection = sections.filter((s) => s !== expectSection);
  if (straySection.length) viols.push({ file: rel, kind: "b-section", msg: `stray section tag(s): ${straySection.join(", ")} (folder implies ${expectSection})` });

  // (c/d/e) concept tags
  for (const t of others) {
    if (t in ALIAS) {
      const canon = ALIAS[t];
      viols.push({ file: rel, kind: "d-alias", msg: canon ? `'${t}' -> canonical '${canon}'` : `'${t}' is section-internal; drop it` });
    } else if (!ALLOWLIST.has(t)) {
      viols.push({ file: rel, kind: "c-allowlist", msg: `'${t}' not in Tier-3 allowlist (add to TAXONOMY.md first)` });
    }
    if (SECTIONS.has(t) && t !== expectSection) {/* handled as stray section */}
    tier3Count.set(t, [...(tier3Count.get(t) ?? []), rel]);
  }
  // (e) folder-shadow: a concept tag equal to another section name is already caught as stray section.

  // resource tag sanity
  for (const rt of resourceTags) {
    if (relDir !== "cs/resources" && !relDir.startsWith("cs/resources/"))
      viols.push({ file: rel, kind: "resource", msg: `${rt} on non-resource note` });
  }

  // --fix: regenerate root+section from path, apply alias map, drop section-internal aliases
  if (FIX) {
    const kept = tags.filter((t) => {
      if (ROOTS.has(t) || SECTIONS.has(t)) return false; // regenerated below
      if (t in ALIAS) return false;                       // remapped/dropped below
      return true;
    });
    const remapped = tags.filter((t) => t in ALIAS && ALIAS[t]).map((t) => ALIAS[t]);
    const newTags = [...new Set([expectRoot, expectSection, ...kept, ...remapped, ...resourceTags].filter(Boolean))] as string[];
    const yaml = "tags:\n" + newTags.map((t) => `  - ${t}`).join("\n");
    const newFm = fm.replace(/^tags:.*(?:\n(?:\s*-\s+.*|\s+.*))*/m, yaml);
    if (newFm !== fm) { writeFileSync(abs, text.replace(fm, newFm)); fixed++; }
  }
}

const singletons = [...tier3Count.entries()].filter(([, fs]) => fs.length === 1);
const hard = viols.filter((v) => ["a-root", "b-section", "c-allowlist"].includes(v.kind));

if (JSON_OUT) {
  console.log(JSON.stringify({ files, violations: viols, singletons: singletons.map(([t]) => t), fixed }, null, 2));
} else {
  console.log(`tag-audit: ${files} notes scanned${FIX ? `, ${fixed} fixed` : ""}`);
  const byKind = new Map<string, Viol[]>();
  for (const v of viols) byKind.set(v.kind, [...(byKind.get(v.kind) ?? []), v]);
  for (const [kind, vs] of [...byKind.entries()].sort()) {
    console.log(`\n[${kind}] ${vs.length}`);
    for (const v of vs.slice(0, 40)) console.log(`  ${v.file}: ${v.msg}`);
    if (vs.length > 40) console.log(`  ... +${vs.length - 40} more`);
  }
  if (singletons.length) console.log(`\n[f-singleton] ${singletons.length} Tier-3 tags on exactly one note: ${singletons.map(([t]) => t).join(", ")}`);
  console.log(`\nHARD violations (a-c): ${hard.length}`);
}
process.exit(hard.length && !FIX ? 1 : 0);

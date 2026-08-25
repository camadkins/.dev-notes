#!/usr/bin/env bun
/**
 * link-audit-built.ts: audit the BUILT site, not the markdown.
 *
 * The garden's markdown-level checks resolve wikilinks against slugs and report clean while the
 * deployed pages 404. That gap hid 3,332 broken links and 157 broken images until 2026-08-25.
 * This reads emitted HTML and resolves every href/src the way a browser does.
 *
 * Usage: bun Tools/link-audit-built.ts [publicDir] [--max-links N] [--max-images N]
 */
import { Glob } from "bun";
import { readFileSync } from "node:fs";
import { join, relative, dirname } from "node:path";

const ROOT = process.argv[2]?.startsWith("--") ? "public" : (process.argv[2] ?? "public");
const arg = (n: string, d: number) => {
  const i = process.argv.indexOf(n);
  return i >= 0 ? Number(process.argv[i + 1]) : d;
};
const MAX_LINKS = arg("--max-links", 0);
const MAX_IMAGES = arg("--max-images", 0);

const files = [...new Glob("**/*").scanSync(ROOT)].map((f) => "/" + f.replace(/\\/g, "/"));
const have = new Set(files);
for (const f of files) {
  if (f.endsWith("/index.html")) { have.add(f.slice(0, -10)); have.add(f.slice(0, -11)); }
}
const exists = (u: string) => {
  const p = u.split("#")[0].split("?")[0];
  return have.has(p) || have.has(p.replace(/\/$/, "") + ".html") || have.has(p.replace(/\/$/, "") + "/index.html");
};
/** resolve href against a page path exactly as a browser does */
const resolve = (page: string, href: string) => {
  try { return new URL(href, "https://local" + page).pathname; } catch { return href; }
};

let links = 0, badLinks = 0, imgs = 0, badImgs = 0;
const examples: string[] = [];
for (const f of new Glob("**/*.html").scanSync(ROOT)) {
  const page = "/" + f.replace(/\\/g, "/");
  const body = readFileSync(join(ROOT, f), "utf8").split("<body")[1] ?? "";
  for (const m of body.matchAll(/<a[^>]+href="([^"]+)"/g)) {
    const h = m[1];
    if (/^(https?:|mailto:|#|\/\/)/.test(h)) continue;
    links++;
    if (!exists(resolve(page, h))) {
      badLinks++;
      if (examples.length < 15) examples.push(`LINK  ${page}  href="${h}"  -> ${resolve(page, h)}`);
    }
  }
  for (const m of body.matchAll(/<img[^>]+src="([^"]+)"/g)) {
    const s = m[1];
    if (/^(https?:|data:|\/\/)/.test(s)) continue;
    imgs++;
    if (!exists(resolve(page, s))) {
      badImgs++;
      if (examples.length < 15) examples.push(`IMG   ${page}  src="${s}"  -> ${resolve(page, s)}`);
    }
  }
}
console.log(`built-site audit: ${links} internal links, ${badLinks} broken (max ${MAX_LINKS})`);
console.log(`                  ${imgs} images, ${badImgs} broken (max ${MAX_IMAGES})`);
examples.forEach((e) => console.log("  " + e));
process.exit(badLinks > MAX_LINKS || badImgs > MAX_IMAGES ? 1 : 0);

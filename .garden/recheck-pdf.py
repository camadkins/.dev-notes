#!/usr/bin/env python3
"""PDF-aware claim re-checker.

The primary verifier substring-matches against the bytes it fetches. For a PDF that
never matches a text quote, so a PDF-sourced batch flags at ~100% regardless of
quality. Cisco documentation is only reachable as PDF (the td/docs HTML is blocked),
so that whole section needs this instead.

Fetches each URL, runs pdftotext when the payload is a PDF, normalizes whitespace and
quotes on both sides, then reports what is STILL missing. Anything it reports needs a
human read, because it is no longer explainable as an extraction artifact.
"""
import json, re, sys, html, subprocess, pathlib, hashlib, os

GARDEN = pathlib.Path.home() / "Desktop/dev-notes"
CACHE = pathlib.Path("/tmp/garden_pdf_cache")
CACHE.mkdir(exist_ok=True)
cache = {}


def fetch_text(url):
    if url in cache:
        return cache[url]
    key = hashlib.sha1(url.encode()).hexdigest()[:16]
    raw = CACHE / f"{key}.bin"
    if not raw.exists():
        # Use the full Chrome header set. Cisco's Akamai edge blocks on TLS/header
        # fingerprint, and a plain -A UA gets a 455-byte Access Denied stub.
        cget = pathlib.Path.home() / "Desktop/dev-notes/.garden/cget.sh"
        if cget.exists():
            subprocess.run(["bash", str(cget), url, str(raw)],
                           capture_output=True, timeout=120)
        if not raw.exists() or raw.stat().st_size == 0:
            subprocess.run(["curl", "-sL", "--max-time", "60", "-A",
                            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
                            url, "-o", str(raw)], capture_output=True, timeout=90)
    if not raw.exists() or raw.stat().st_size == 0:
        cache[url] = ""
        return ""
    # NEVER cache a block page as content. A silently cached Access Denied stub makes
    # every claim against that URL look unverifiable, or worse, would let a future
    # looser matcher "confirm" against boilerplate. Treat it as a fetch failure.
    probe = raw.open("rb").read(4000)
    if b"Access Denied" in probe or b"errors.edgesuite.net" in probe:
        raw.unlink(missing_ok=True)
        cache[url] = ""
        return ""
    head = raw.open("rb").read(5)
    if head.startswith(b"%PDF"):
        r = subprocess.run(["pdftotext", "-layout", str(raw), "-"],
                           capture_output=True, text=True)
        t = r.stdout
        if not t.strip():  # retry without -layout
            r = subprocess.run(["pdftotext", str(raw), "-"], capture_output=True, text=True)
            t = r.stdout
    else:
        t = raw.read_text(encoding="utf8", errors="replace")
    cache[url] = t
    return t


def norm(t):
    t = re.sub(r"<script.*?</script>|<style.*?</style>", " ", t, flags=re.S)
    t = re.sub(r"<[^>]+>", " ", t)
    t = html.unescape(t)
    for a, b in [("“", '"'), ("”", '"'), ("‘", "'"), ("’", "'"),
                 ("–", "-"), ("—", "-"), (" ", " "), ("‑", "-")]:
        t = t.replace(a, b)
    t = re.sub(r"\[\d+\]", "", t)
    t = re.sub(r"[ \t\r\n]+", " ", t)
    return t.lower().strip()


missing, ok, nofetch = [], 0, 0
for slug in sys.argv[1:]:
    p = GARDEN / ".garden/claims" / f"{slug}.json"
    if not p.exists():
        print(f"MISSING SIDECAR: {slug}")
        continue
    for c in json.load(open(p))["claims"]:
        url, q = c.get("url", ""), c.get("quote", "")
        if not url or not q:
            continue
        doc = fetch_text(url)
        if not doc:
            nofetch += 1
            missing.append((slug, url, q, c.get("claim", ""), "FETCH/EXTRACT FAILED"))
            continue
        nq, nd = norm(q), norm(doc)
        probe = nq if len(nq) < 70 else nq[:70]
        if probe in nd:
            ok += 1
            continue
        words = nq.split()
        if any(" ".join(words[i:i + 7]) in nd for i in range(0, max(1, len(words) - 6))):
            ok += 1
        else:
            missing.append((slug, url, q, c.get("claim", ""), "not found"))

print(f"\n=== confirmed: {ok} | still missing: {len(missing)} (fetch/extract failures: {nofetch}) ===")
for slug, url, q, claim, why in missing:
    print(f"\n[{why}] {slug}\n  claim: {claim[:130]}\n  url: {url}\n  quote: {q[:130]}")

#!/usr/bin/env python3
"""Re-check flagged garden claims with markup-aware normalization.

The primary verifier does a literal substring match against the fetched document.
That produces false flags whenever the source renders differently from its storage
form: MediaWiki '''bold''', [[wikilink|piping]], {{templates}}, <ref> footnotes, plus
curly quotes and hard line wrapping in ordinary HTML.

This re-checker normalizes both sides and reports what is STILL missing. Anything it
reports needs a human read of the source, because it is no longer explainable as markup.
"""
import json, re, sys, html, urllib.parse, subprocess, pathlib, time

GARDEN = pathlib.Path.home() / "Desktop/dev-notes"
cache = {}


def wiki_title(url):
    m = re.match(r"https://en\.wikipedia\.org/wiki/(.+)$", url)
    if m:
        return urllib.parse.unquote(m.group(1))
    m = re.search(r"[?&]title=([^&]+)", url)
    if m and "wikipedia.org" in url:
        return urllib.parse.unquote(m.group(1))
    return None


_extract_cache = {}


def wiki_extract(title):
    """Rendered plain-text extract. Writers using the TextExtracts API quote THIS
    surface, which differs from raw wikitext: templates are expanded and math is
    rendered, so a legitimate quote can be absent from the raw source entirely.

    Cached per title and paced: the API rate-limits (429) quickly if called once
    per claim, and a 429 body would otherwise be cached as if it were the article."""
    if title in _extract_cache:
        return _extract_cache[title]
    api = ("https://en.wikipedia.org/w/api.php?action=query&prop=extracts"
           "&explaintext=1&format=json&titles=" + urllib.parse.quote(title))
    text = ""
    for attempt in range(3):
        try:
            r = subprocess.run(["curl", "-sL", "--max-time", "30", "-A",
                                "garden-note-verifier/1.0 (personal note verification)",
                                api], capture_output=True, text=True, timeout=45)
            if "too many requests" in r.stdout.lower():
                time.sleep(5 * (attempt + 1))
                continue
            pages = json.loads(r.stdout)["query"]["pages"]
            text = list(pages.values())[0].get("extract", "")
            break
        except Exception:
            time.sleep(2)
    _extract_cache[title] = text
    time.sleep(1)
    return text


def fetch(url):
    if url in cache:
        return cache[url]
    u = url
    title = wiki_title(url)
    if title and "action=raw" not in url:
        u = ("https://en.wikipedia.org/w/index.php?title="
             + urllib.parse.quote(title) + "&action=raw")
    try:
        r = subprocess.run(["curl", "-sL", "--max-time", "30", "-A",
                            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", u],
                           capture_output=True, text=True, timeout=45)
        t = r.stdout
    except Exception as e:
        t = ""
        print(f"  !! fetch failed {url}: {e}", file=sys.stderr)
    cache[url] = t
    return t


def strip_wiki(t):
    t = re.sub(r"<ref[^>]*/>", " ", t)
    t = re.sub(r"<ref.*?</ref>", " ", t, flags=re.S)
    t = re.sub(r"\{\{[^{}]*\}\}", " ", t)
    t = re.sub(r"\{\{[^{}]*\}\}", " ", t)
    t = re.sub(r"\[\[[^\]|]*\|([^\]]*)\]\]", r"\1", t)   # piped link -> label
    t = re.sub(r"\[\[([^\]]*)\]\]", r"\1", t)             # plain link -> target
    t = t.replace("'''", "").replace("''", "")
    return t


def norm(t, is_wiki):
    t = re.sub(r"<script.*?</script>|<style.*?</style>", " ", t, flags=re.S)
    if is_wiki:
        t = strip_wiki(t)
    t = re.sub(r"<[^>]+>", " ", t)
    t = html.unescape(t)
    for a, b in [("“", '"'), ("”", '"'), ("‘", "'"), ("’", "'"),
                 ("–", "-"), ("—", "-"), (" ", " "), ("→", "->")]:
        t = t.replace(a, b)
    t = re.sub(r"\[\d+\]", "", t)              # footnote markers
    t = re.sub(r"\[self-published source\]", "", t)
    t = re.sub(r"\s+", " ", t)
    return t.lower().strip()


still_missing, confirmed, unfetchable = [], 0, 0
for slug in sys.argv[1:]:
    p = GARDEN / ".garden/claims" / f"{slug}.json"
    if not p.exists():
        print(f"MISSING SIDECAR: {slug}")
        continue
    for c in json.load(open(p))["claims"]:
        url, q = c.get("url", ""), c.get("quote", "")
        if not url or not q:
            continue
        doc = fetch(url)
        if not doc:
            unfetchable += 1
            still_missing.append((slug, url, q, "FETCH FAILED"))
            continue
        is_wiki = "wikipedia.org" in url
        nq = norm(q, False)

        def matches(document, wiki):
            nd = norm(document, wiki)
            probe = nq if len(nq) < 70 else nq[:70]
            if probe in nd:
                return True
            words = nq.split()  # distinctive interior window
            return any(" ".join(words[i:i + 8]) in nd
                       for i in range(0, max(1, len(words) - 7)))

        if matches(doc, is_wiki):
            confirmed += 1
            continue
        # Second surface for Wikipedia: the rendered plain-text extract. Templates and
        # math render differently there, so a real quote can miss the raw wikitext.
        t = wiki_title(url) if is_wiki else None
        if t and matches(wiki_extract(t), False):
            confirmed += 1
            continue
        still_missing.append((slug, url, q, "not found after normalization"))

print(f"\n=== confirmed after normalization: {confirmed} | still missing: {len(still_missing)} ===")
for slug, url, q, why in still_missing:
    print(f"\n[{why}] {slug}\n  url: {url}\n  quote: {q[:150]}")

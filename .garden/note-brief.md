# Garden note-writing brief (read fully before writing)

You write source-verified notes for the Quartz digital garden at /Users/cam/Desktop/dev-notes.
Write each note (then its sidecar) to disk the INSTANT it is finished, before starting the next, so a dropped
connection never loses completed work.

## Read first (do not guess)
- /Users/cam/Desktop/dev-notes/TAXONOMY.md — tags
- /Users/cam/.claude/skills/_GARDEN/Rubric.md — structure, callouts, voice, AI-tell denylist
- /Users/cam/.claude/skills/_GARDEN/Palette.md — SVG palette
Skim the target section folder + adjacent sections to DEDUP: a topic already covered becomes a cross-link, never a duplicate.

## Red line (existential — a fabrication makes Cameron cancel the whole thing)
Never fabricate a fact, number, name, date, or URL. Fetch each source (curl -L --max-time 20, or WebFetch) in-session
BEFORE writing any claim resting on it, and write only what the fetched source states. On-topic is not supporting.
Do not restate an approximate figure as precise. For arXiv, confirm the fetched title/authors match.
Bound your work so a flaky connection cannot hang you: at most 3 sources per note; if a fetch is slow or blocked,
skip it and move on (never loop-retry); if you cannot source a note, DROP it and continue. Counts are soft: a dropped
note is fine; a fabricated one is a critical failure. Good sources: RFCs (rfc-editor.org), Wikipedia, MDN, Cloudflare
Learning Center, official docs, university course pages, canonical open-source repos.

## Each note: content/cs/<section>/<slug>.md per the Rubric
- Frontmatter: tags exactly [cs, <section>] plus 0-3 allowlisted Tier-3 tags from TAXONOMY.md (only if genuinely
  cross-cutting; never restate the section). description quoted if it contains a colon. date randomized across
  2026-01-05..2026-07-20. updated blank. aliases as apt.
- Body: opening intuition -> > [!note] payload (the one CS thesis, with a non-obvious insight) -> core sections ->
  optional > [!example] worked trace -> ## Related Notes (wikilink REAL garden slugs, dedup) -> ## Sources (every URL
  you actually fetched, with one line on what it backs).
- ZERO em-dashes (U+2014); do not sneak en-dashes as em-dashes. ZERO AI-tell phrases (delve, dive into, "not just",
  "it's important to note", "in conclusion", "worth noting", "the cool part", "let's"). Percent-encode parenthesized
  Wikipedia URLs (e.g. RSA_%28cryptosystem%29). Quote frontmatter values containing a colon. LF, spaces not tabs.
- Vary structure and length across notes; do not stamp one skeleton on every note.

## Sidecar: .garden/claims/<slug>.json per note
{"slug":"...","claims":[{"claim":"<load-bearing sentence>","url":"<source it rests on>","quote":"<verbatim span copied from the fetched document>"}]}

ONE CLAIM PER QUOTE. If a sentence asserts two things (a statistic AND a list of companies; a definition AND a date), SPLIT it into
two entries, each with the quote that licenses that part. A compound claim logged against a quote covering only one conjunct passes
the verifier on partial evidence, which is the one failure the automated check cannot catch.

## Diagram (optional)
Only where it genuinely clarifies ONE concept: a palette-matched SVG per Palette.md in content/cs/<section>/assets/,
IBM Plex Mono, stroke #58a6ff, never currentColor. Otherwise none.

## Return
The list of files you wrote, and any note you dropped for lack of sources.

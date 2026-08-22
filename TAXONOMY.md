# Garden Taxonomy & Maintenance Convention

The single, enforced convention for how "Cam's Cyberspace" is tagged and kept consistent as it grows. Written 2026-07-24 to close accumulated tag drift and stop it recurring. Enforced deterministically by `Tools/tag-audit.ts` (run it before every commit and in the gate).

The core idea: **structure is the taxonomy.** A note's folder determines its section tag, so the tag surface is derivable from the tree and cannot silently drift. Everything else is a small, allow-listed vocabulary.

## The four tiers

Every note's `tags:` frontmatter is a YAML list built from these tiers, in this order:

```yaml
tags:
  - cs                 # Tier 1 — root (exactly 1, required)
  - security           # Tier 2 — section (exactly 1, required, = folder)
  - cryptography       # Tier 3 — topic (0 to 3, from the allowlist below)
```

### Tier 1 — Root (exactly one, required)

| Root | Applies to |
|------|-----------|
| `cs` | everything under `content/cs/` |
| `off-watch` | everything under `content/off-watch/` |
| `meta` | garden meta notes under `content/meta/` |

### Tier 2 — Section (exactly one, required, equals the folder)

The section tag is **mechanically the note's folder**, via this map. This is the load-bearing rule: it makes the section tag auditable and impossible to drift.

| Folder | Section tag |
|--------|-------------|
| `content/cs/dsa` | `dsa` |
| `content/cs/pl` | `pl` |
| `content/cs/systems` | `systems` |
| `content/cs/languages` | `languages` |
| `content/cs/standards` | `standards` |
| `content/cs/law` | `law` |
| `content/cs/machine-learning` | `machine-learning` |
| `content/cs/deep-learning` | `deep-learning` |
| `content/cs/statistics` | `statistics` |
| `content/cs/math` | `math` |
| `content/cs/history` | `history` |
| `content/cs/military-computing` | `military` |
| `content/cs/ethics` | `ethics` |
| `content/cs/geopolitics` | `geopolitics` |
| `content/cs/software-engineering` | `software-engineering` |
| `content/cs/security` | `security` |
| `content/cs/networking` | `networking` |
| `content/cs/cisco` | `cisco` |
| `content/cs/resources` | `resources` |
| `content/off-watch/books` | `books` |
| `content/off-watch/media` | `media` |
| `content/off-watch/golf` | `golf` |
| `content/off-watch/games` | `games` |
| `content/off-watch/dnd` | `dnd` |
| `content/off-watch` (area hubs) | `off-watch` |

New section = new folder + one new row here. Never a bare tag with no folder.

### Tier 3 — Topic (zero to three, optional, allowlist-only)

A Tier-3 tag earns its place **only if it groups notes a reader would browse across sections** (a cross-cutting theme). A concept that lives entirely inside one section does not get a tag; its section, title, and cross-links carry it. This is what kills singleton sprawl at the root.

Rules:
- kebab-case, lowercase, singular canonical form.
- Must appear in the **allowlist** below. Adding a new one = add a row here first, in the same commit.
- Never restate the section (a `languages` note does not also get `rust`; use the language tag only for a cross-language note that genuinely spans sections).

**Allowlist (controlled vocabulary):**

`ai` · `security` · `networking` · `cryptography` · `concurrency` · `distributed-systems` · `operating-systems` · `compilers` · `type-theory` · `formal-methods` · `optimization` · `interpretability` · `reinforcement-learning` · `supervised-learning` · `unsupervised-learning` · `generative-models` · `computer-architecture` · `memory` · `serialization` · `error-handling` · `build-systems` · `testing` · `version-control` · `web` · `databases` · `algorithms` · `data-structures` · `complexity` · `discrete-math` · `linear-algebra` · `probability` · `training` · `philosophy` · `regression` · `science` · `courses`

`philosophy` is a Tier-3 tag (not a folder) carried by the ethics/philosophy notes that live under `cs/ethics/`. `science` and `courses` are the golf sub-section organizers under `off-watch/golf/`.

Canonical merges (drift fixes applied 2026-07-24): `unsupervised` -> `unsupervised-learning`; `convolutional-neural-networks`/`artificial-neural-networks`/`rnn`/`autoencoders`/`transformers`/`attention`/`backpropagation`/`activation-functions`/`loss-functions`/`gradient-descent`/`regularization`/`generalization`/`bias-variance`/`data-splits`/`evaluation`/`ensembles`/`embeddings`/`dimensionality-reduction`/`representation`/`transfer-learning`/`meta-learning`/`diffusion-models`/`generative-adversarial-networks` are **section-internal to `deep-learning`/`machine-learning`** and are dropped as tags (the note's title + section + cross-links carry them). Language one-offs `rust`/`python`/`cpp`/`racket`/`ansible` dropped in favor of the `languages` section + per-language subfolder. `undefined-behavior`/`abi`/`ffi`/`supply-chain`/`dependencies`/`declarative`/`trees`/`slots`/`leaves`/`edges`/`internal` dropped (section-internal or noise).

### Tier 4 — Resource namespace (resource notes only)

Notes under `content/cs/resources/` (and any note that *is about* a specific external resource) additionally carry exactly one nested resource-type tag:

| Tag | Class |
|-----|-------|
| `resource/book` | Books (free / open-source / canonical texts) |
| `resource/course` | Courses (free / open university & institution courses) |
| `resource/paper` | References (peer-reviewed publications & papers) |
| `resource/code` | Code (open-source libraries & implementations) |
| `resource/talk` | Talks (talks, video summaries, video podcasts) |
| `resource/reference` | Reference material (definitions, encyclopedic entries, canonical docs, blog posts) |

Quartz renders nested tags natively; `resource/book` groups on its own tag page and rolls up under `resource`.

## Maintenance convention (the durable part)

1. **Where a note lives decides its section tag.** Put the note in the right folder; the section tag follows the map above. Moving a note = changing its section tag (and check permalinks).
2. **Root + section are mandatory and mechanical.** Every note has exactly one of each. The audit fails the build otherwise.
3. **Tier-3 is opt-in and allow-listed.** Reach for a Tier-3 tag only for a genuinely cross-cutting theme, and only from the allowlist. To introduce a new theme, add the row here in the same commit, then use it. No allowlist row = audit failure.
4. **Dedup before writing.** A topic already covered becomes a cross-link, never a duplicate note (see `.garden` state + `_GARDEN` skill).
5. **Run the audit.** `bun Tools/tag-audit.ts` before committing. It is also wired into the garden gate. Zero violations is the invariant.

The test of this document: a newcomer (or an autonomous agent) can tag any note correctly using only the folder map and the allowlist, and the audit script can prove the whole garden conforms without human judgment.

## Enforcement

The governing principle (from a systems read of the drift): tags are a **closed navigational index, not exhaustive descriptive labels**. The tag vocabulary was drifting as a *tragedy of the commons* — each session added a locally-useful tag whose cost (duplication, unsearchable sprawl) fell on the whole garden. Two structural fixes remove the commons dynamic:

- **Derive, don't author.** Any tag derivable from location (root + section) is *generated from the path*, never typed. `tag-audit.ts --fix` rewrites a note's root and section tags to match its folder, so the entire structural-tag class is undriftable by construction. The concept layer (Tier-3) is then the *only* hand-authored tag surface, and it is fully gated by the allowlist.
- **Promotion gate.** A new Tier-3 tag must be added to the allowlist in this file *first*, then used. Frictionless unchecked adds become deliberate, governed acts.

`Tools/tag-audit.ts` checks every note under `content/` for: (a) exactly one root tag valid for its path; (b) exactly one section tag equal to `folder -> section`; (c) every remaining tag is an allowlisted Tier-3 tag or a `resource/*` tag on a resource note; (d) alias normalization — flags a non-canonical form (e.g. `unsupervised`) and names its canonical target; (e) folder-shadow — flags a concept tag that merely restates a section/folder name; (f) singleton report — Tier-3 tags used on exactly one note, as candidates for removal or promotion. It prints violations grouped by file, exits non-zero if any (a-c) violation exists, and with `--fix` auto-corrects root/section from the path and applies the alias map. Wired into the gate. See the script header for usage.

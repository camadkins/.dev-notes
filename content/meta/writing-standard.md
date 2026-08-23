---
title: Writing Standard
description: Default structure and conventions for notes in this garden.
draft: false
comments: true
tags:
  - meta
date: 2026-03-12
aliases: []
---

[[cs/standards/what-a-standard-actually-is|This page defines the baseline structure for notes]]. Not every note follows this exactly, but new notes should start here.

## Frontmatter

Every note uses YAML frontmatter:

```yaml
---
title: Note Title
description: One-line summary of the topic.
draft: false          # true = unpublished, false = published
comments: false       # giscus comments toggle
tags:
  - domain            # e.g., cs, dsa, pl, meta
date: YYYY-MM-DD      # creation date
updated: YYYY-MM-DD   # last meaningful revision (optional; omit to use git timestamp)
aliases: []           # alternate titles for wikilink resolution
---
```

## Body structure

1. **Definition** - what the concept is, in 1-3 sentences.
2. **Core content** - explanation, properties, mechanics. Use subsections (`##`, `###`) to break up longer topics.
3. **Examples** - concrete instances, code, or diagrams. Prefer inline code blocks with syntax highlighting.
4. **Connections** - wikilinks to related notes. These can be inline (in the text where relevant) or in a short "See also" list at the end.

[[cs/standards/normative-versus-informative-and-the-word-shall|Not every section is required.]] Short notes may only need a definition and a few links. The goal is clarity, not uniformity.

## Conventions

- **File names** are lowercase, hyphenated: `avl-tree.md`, `lambda-calculus-syntax-substitution.md`.
- [[cs/software-engineering/coupling-and-cohesion|**One concept per file.**]] If a topic has sub-topics large enough to stand alone, give them their own files and link from the parent.
- **Tags** reflect domain membership (`cs`, `dsa`, `pl`, `meta`), not maturity level. Maturity is tracked through the `draft` field and content completeness.
- **Wikilinks** use Obsidian-style `[[target | display text]]` syntax. Quartz resolves these via shortest-path matching.
- **Diagrams** can be referenced in YAML comments for future creation (see existing DSA notes for examples). Inline Mermaid or embedded SVGs are both fine.
- **LaTeX** is supported via KaTeX. Use `$...$` for inline math and `$$...$$` for display math.

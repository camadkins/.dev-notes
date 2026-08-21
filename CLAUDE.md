# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Overview

Cam's Cyberspace, a digital garden built with **Quartz 5**, deployed at notes.camadkins.com.
Notes live in `content/` (621 markdown files) and cover computer science, security, networking,
and off-watch topics. Cloudflare Pages builds and deploys from `main`.

## Commands

- **Build**: `npx quartz build`
- **Build and serve**: `npx quartz build --serve` (add `--port N --wsPort N` if a port is taken)
- **Type check and format check**: `npm run check`
- **Format**: `npm run format`
- **Tests**: `npm test`
- **Upgrade Quartz**: `npx quartz upgrade` (v5 name; `update` is an alias)
- **Plugins**: `npx quartz plugin install --from-config`, `npx quartz plugin prune`

`npx quartz create` deletes `content/` before repopulating it. Do not run it in a working checkout.

## Architecture

Three-stage pipeline: **parse** (transformers) then **filter** then **emit** (emitters).

Configuration is **`quartz.config.yaml`**, not TypeScript. `quartz.config.ts` and `quartz.layout.ts`
are v4 artifacts and no longer exist. Layout position is a per-plugin `layout:` property in the YAML,
and `layout.byPageType` controls what renders per page type (this is why the graph is absent on
folder and index pages).

Plugins are `@quartz-community/*` **npm packages** declared in `package.json`, so `npm ci` installs
them. `.quartz/plugins` is the git-clone path for `github:` specifiers and stays empty here. CI needs
only `npm ci && npx quartz build`.

## Conventions

- **Frontmatter dates are required.** Always set `date:` on a new note. Quartz falls back to git
  dates when it is missing, and git dates do not survive a branch migration.
- **URLs are lowercased** in v5. `AliasRedirects` generates redirect pages at old uppercase paths.
- **Diagram alt text** is one plain sentence describing what the picture shows. No color legends,
  no restating node values.
- **Images** use relative markdown links to `assets/` beside the note, with
  `markdownLinkResolution: relative`.
- **No em dashes** in note prose.
- `draft: true` keeps a note out of the build. 18 notes and templates are currently drafts.
- Tags follow `TAXONOMY.md`, enforced by `Tools/tag-audit.ts`.

## Garden tooling

`.garden/` holds the note pipeline: `note-brief.md` (one claim per quote), `recheck.py` and
`recheck-pdf.py` (source verification), `verify-quotes.ts`, `cget.sh`, and `inbox.md`.
Only those tracked files are in git; `.garden/claims/` is ignored.

## Branches

`main` is what Cloudflare deploys. `dev` is the working branch and merges to `main` by PR.
`v5` holds the Quartz 5 migration and is merged into `dev`.
Commit messages are short and lowercase, usually prefixed `garden:` or `garden tooling:`.

## Do not

- Add `.github/dependabot.yml`. Upstream Quartz runs dependabot; a fork copy only diverges
  `package.json` and `package-lock.json`, which conflict hardest on an upstream merge.

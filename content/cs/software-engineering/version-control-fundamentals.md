---
title: Version Control Fundamentals
description: How Git models history as a directed acyclic graph of commits, and how branching strategies organize collaborative development.
draft: false
comments: true
tags:
  - cs
  - software-engineering
date: 2026-03-12
updated:
aliases: []
---

## Intuition

Version control solves a deceptively simple problem: **how do multiple people change the same codebase without destroying each other's work?** The naive answer - numbered copies in shared folders - collapses at any real scale. Git's answer is to model the entire history of a project as a [[cs/math/graph-theory|**directed acyclic graph (DAG)**]] of immutable snapshots, where branching and merging are first-class operations rather than special cases.

Understanding Git means understanding the DAG. Every command - `commit`, `branch`, `merge`, `rebase`, `cherry-pick` - is an operation on this graph. Once the data model clicks, the commands stop feeling arbitrary.

---

## Core Idea

### The Object Model

Git stores four types of objects, all [[cs/security/cryptographic-hash-functions|content-addressed by SHA-1 hash]]:

| Object | Contains |
|--------|----------|
| **Blob** | File contents (no filename, no metadata). |
| **Tree** | A directory listing - maps names to blobs or other trees. |
| **Commit** | A tree pointer, parent commit pointer(s), author, timestamp, message. |
| **Tag** | A named pointer to a commit with optional annotation. |

A commit is a snapshot, not a diff. Git computes diffs on the fly by comparing trees. This makes operations like `checkout` and `log` fast regardless of history length.

### The DAG

Commits form a directed acyclic graph where each commit points to its parent(s):

```
A ← B ← C ← D       (main)
         ↖
          E ← F      (feature)
```

- **Linear history:** each commit has one parent.
- **Branch point:** `C` is the common ancestor of `D` and `F`.
- **Merge commit:** has two parents, joining divergent lines.

Branches are just movable pointers to commits. Creating a branch is [[cs/dsa/asymptotic-notation|O(1)]] - it writes 41 bytes (a SHA reference). This cheapness is why Git encourages branching for everything.

### Branching Strategies

| Strategy | How it works | Best for |
|----------|-------------|----------|
| **Trunk-based** | Everyone commits to `main`; short-lived feature branches (hours, not weeks). | CI/CD-heavy teams, small teams. |
| **Git Flow** | Long-lived `develop` and `main` branches; feature, release, and hotfix branches. | Versioned releases with formal QA. |
| **GitHub Flow** | Single `main` branch; feature branches + pull requests; deploy on merge. | SaaS, continuous deployment. |

> [!note]
> The best branching strategy is the one your team can actually follow. Complex models create ceremony that teams circumvent under deadline pressure - and circumvented process is worse than no process.

### Merge vs Rebase

- **Merge** creates a new commit with two parents, preserving the full branch topology.
- **Rebase** replays commits onto a new base, producing a linear history but rewriting commit hashes.

```
# Merge: preserves branch structure
A ← B ← C ← M
         ↖  ↗
          D

# Rebase: linearizes
A ← B ← C ← D'
```

> [!warning]
> Never rebase commits that have been pushed and shared. Rewriting public history forces collaborators to reconcile divergent graphs - a painful, error-prone process.

---

## Example

A typical feature workflow using GitHub Flow:

```bash
# 1. Create a branch from main
git checkout -b fix/login-timeout main

# 2. Make changes and commit
git add src/auth.py
git commit -m "Increase session timeout to 30 minutes"

# 3. Push and open a pull request
git push -u origin fix/login-timeout
gh pr create --title "Fix login timeout" --body "Session was expiring too quickly"

# 4. After review, merge (squash for clean history)
gh pr merge --squash

# 5. Clean up
git checkout main && git pull
git branch -d fix/login-timeout
```

Each step maps to a DAG operation: branch creation (new pointer), commit (new node), push (sync with remote graph), merge (join nodes), delete branch (remove pointer - commits remain).

---

## Related Notes

- [[cs/software-engineering/testing-strategies|Testing Strategies]] - CI pipelines run tests on every branch before merge
- [[cs/software-engineering/software-architecture|Software Architecture]] - repository structure reflects architectural boundaries
- [[cs/software-engineering/api-design|API Design]] - versioning APIs relates to release branching strategies

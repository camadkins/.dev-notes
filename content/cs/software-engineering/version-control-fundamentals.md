---
title: Version Control Fundamentals
description: How Git models history as a directed acyclic graph of commits, and how branching strategies organize collaborative development.
draft: false
comments: true
tags:
  - cs
  - software-engineering
date: 2026-03-12
updated: 2026-08-31
aliases: []
---

## Intuition

Version control solves a deceptively simple problem: **how do multiple people change the same codebase without destroying each other's work?** The naive answer - numbered copies in shared folders - collapses at any real scale. Git's answer is to model the entire history of a project as a [[cs/math/graph-theory|**directed acyclic graph (DAG)**]] of immutable snapshots, where branching and merging are first-class operations rather than special cases.

Understanding Git means understanding the DAG. Every command - `commit`, `branch`, `merge`, `rebase`, `cherry-pick` - is an operation on this graph. Once the data model clicks, the commands stop feeling arbitrary.

This note stays at the level of the model and the workflows built on it. The command-by-command working reference is [[cs/software-engineering/git-command-reference|Git Command Reference]], and the individual pieces of the model each have their own note, listed at the bottom of this one.

---

## Core Idea

### The Object Model

Git stores four types of objects, all [[cs/software-engineering/git-objects-and-content-addressable-storage|content-addressed by SHA-1 hash]]:

| Object | Contains |
|--------|----------|
| **Blob** | File contents (no filename, no metadata). |
| **Tree** | A directory listing - maps names to blobs or other trees. |
| **Commit** | A tree pointer, parent commit pointer(s), author, timestamp, message. |
| **Tag** | A named pointer to a commit with optional annotation. |

A commit is a snapshot rather than a diff. Git computes diffs on the fly by comparing trees, which makes operations like `checkout` and `log` fast regardless of history length. What follows from naming objects by their own hash - deduplication, immutable history, and a single hash that vouches for a whole tree - is the subject of [[cs/software-engineering/git-objects-and-content-addressable-storage|Git Objects and Content-Addressable Storage]].

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

Branches are movable pointers to commits. Creating a branch is [[cs/dsa/asymptotic-notation|O(1)]] - it writes 41 bytes (a SHA reference). This cheapness is why Git encourages branching for everything, and [[cs/software-engineering/refs-and-branches-as-pointers|Refs and Branches as Pointers]] follows the consequence through to why almost nothing in Git is destructive.

Turning this graph into the lines `git log` prints is a [[cs/dsa/topological-sorting|topological sort]], which is the argument of [[cs/software-engineering/the-commit-dag|The Commit DAG]].

### Branching Strategies

| Strategy | How it works | Best for |
|----------|-------------|----------|
| **Trunk-based** | Everyone commits to `main`; short-lived feature branches (hours, not weeks). | CI/CD-heavy teams, small teams. |
| **Git Flow** | Long-lived `develop` and `main` branches; feature, release, and hotfix branches. | Versioned releases with formal QA. |
| **GitHub Flow** | Single `main` branch; feature branches + pull requests; deploy on merge. | SaaS, continuous deployment. |

> [!note]
> The best branching strategy is the one your team can actually follow. Complex models create ceremony that teams circumvent under deadline pressure - and circumvented process is worse than no process.

### Merge vs Rebase

The mechanical difference is one commit versus a set of new ones, and the choice between them is a choice about what history is for. [[cs/software-engineering/merge-vs-rebase|Merge vs Rebase]] takes that argument apart; the short version:

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

Each step maps to a DAG operation: branch creation (new pointer), commit (new node), push (sync with remote graph), merge (join nodes), delete branch (remove pointer - commits remain). [[cs/software-engineering/git-command-reference|Git Command Reference]] gives the same treatment for every command, grouped by which of the four writable locations each one changes.

---

## Related Notes

- [[cs/software-engineering/git-command-reference|Git Command Reference]] - the working reference this note is the concept half of
- [[cs/software-engineering/git-objects-and-content-addressable-storage|Git Objects and Content-Addressable Storage]] - the object model in full
- [[cs/software-engineering/the-commit-dag|The Commit DAG]] - the graph, and what ordering it for display costs
- [[cs/software-engineering/the-three-trees|The Three Trees]] - working directory, index, and HEAD
- [[cs/software-engineering/refs-and-branches-as-pointers|Refs and Branches as Pointers]] - the only mutable layer in the system
- [[cs/software-engineering/merge-vs-rebase|Merge vs Rebase]] - history as record against history as narrative
- [[cs/software-engineering/the-reflog|The Reflog]] - the local undo log for every ref change
- [[cs/software-engineering/git-bisect-as-binary-search|Git Bisect as Binary Search]] - the algorithm hiding in a debugging command
- [[cs/software-engineering/testing-strategies|Testing Strategies]] - CI pipelines run tests on every branch before merge
- [[cs/software-engineering/software-architecture|Software Architecture]] - repository structure reflects architectural boundaries
- [[cs/software-engineering/api-design|API Design]] - versioning APIs relates to release branching strategies

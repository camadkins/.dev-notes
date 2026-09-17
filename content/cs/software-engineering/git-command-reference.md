---
title: Git Command Reference
description: "Git has four writable locations: the object database, the refs, the index, and the working tree. Every command is described by which of them it writes, and in what order."
draft: false
comments: true
tags:
  - cs
  - software-engineering
date: 2026-08-31
updated:
aliases: []
---

Most git references are alphabetical, which is the one ordering that hides the thing worth knowing. `add` and `bisect` land next to each other and have nothing to do with one another, while `reset` and `checkout`, which are genuinely confusable because they overlap, end up pages apart. This page is ordered by effect instead. [[cs/software-engineering/version-control-fundamentals|Version Control Fundamentals]] is the conceptual note on why version control looks like this at all; this is the working reference for what each command does once you accept the model.

> [!note] The idea
> A git repository has exactly four places a command can write: the **object database** (immutable, append-only), the **refs** (mutable names pointing into it), the **index** (the proposed next commit), and the **working tree** (your files). A command is completely specified by which of those four it writes and in what order. Once you can name a command's write set, its surprising behavior stops being surprising, and you can also answer the only question that matters under pressure, which is whether the command can destroy something.

## The four locations

| Location | Holds | Mutable? | Can a command lose data here? |
|----------|-------|----------|-------------------------------|
| Object database (`.git/objects`) | Blobs, trees, commits, tags, each named by the hash of its content | Append-only | Only via garbage collection, and only for objects no ref and no reflog entry reaches |
| Refs (`.git/refs`, `HEAD`) | Branch names, tags, remote-tracking names, `HEAD` | Yes | Moving a ref never deletes a commit; the [[cs/software-engineering/the-reflog\|reflog]] records the old value |
| Index | The flattened manifest that becomes the next commit's tree | Yes | Yes, staged-but-uncommitted content has no reflog |
| Working tree | Ordinary files on disk | Yes | Yes, uncommitted edits are outside git entirely |

The asymmetry in the last column is the whole safety story. Commits are almost impossible to lose and uncommitted work is easy to lose, which is why the standard advice before any risky operation is to commit first, not to be careful. The details of the middle two rows are in [[cs/software-engineering/the-three-trees|The Three Trees]] and [[cs/software-engineering/refs-and-branches-as-pointers|Refs and Branches as Pointers]].

## Writing new objects

These commands add to the object database. Nothing here is destructive, because the database only grows.

**`git add <path>`** writes each file's current content into the object database as a blob and records that blob in the index. The manual's own framing is that the index "is what you use to prepare the contents of the next commit." Running it twice on a file that changed in between writes a second blob; the first is simply left behind. `git add -p` stages hunk by hunk, which means the index can hold a version of the file that has never existed on disk.

**`git commit`** turns the index into permanent objects. It creates "a new commit containing the current contents of the index and the given log message describing the changes," and that commit "is a direct child of HEAD, usually the tip of the current branch, and the branch is updated to point to it." So a commit is two writes: new tree and commit objects, then one ref move. `git commit --amend` does not edit the old commit, since objects are immutable; it writes a new one and moves the branch, leaving the original reachable only through the reflog.

**`git stash`** is a commit in disguise. It records "the current state of the working directory and the index" and then reverts the working directory to match `HEAD`. The result is stored as commits: "The latest stash you created is stored in refs/stash; older stashes are found in the reflog of this reference." A stash therefore survives in the object database like any other commit, which is why a dropped stash is usually recoverable and a never-stashed edit is not.

## Moving a ref

These commands change which commit a name points at. Because commits are immutable, everything here is a pointer assignment.

**`git branch <name>`** creates a ref. It touches neither the index nor the working tree, which is why creating a branch is free and why creating one is never the risky part of anything.

**`git switch <branch>`** moves `HEAD` itself and then makes the index and working tree match: "The working tree and the index are updated to match the branch." It refuses to proceed if that would silently discard local changes. `git checkout <branch>` does the same job; `switch` and `restore` exist because `checkout` had accumulated two unrelated jobs (move `HEAD`, and overwrite files from a commit) under one name.

**`git reset [<mode>] <commit>`** moves the branch that `HEAD` points at, then optionally rewrites the index, then optionally the working tree. Pro Git states the sequence exactly: move the branch `HEAD` points to (stop here if `--soft`), make the index look like `HEAD` (stop here unless `--hard`), make the working directory look like the index. That three-step recipe is the entire command, and it is why `--hard` is the dangerous one: it "is the only way to make the reset command dangerous, and one of the very few cases where Git will actually destroy data."

**`git merge <branch>`** either moves a ref or writes one commit. If the current branch is an ancestor of the target, git fast-forwards, which is a pure ref move with no new object. Otherwise it writes a merge commit recording "the result in a new commit along with the names of the two parent commits and a log message from the user describing the changes."

**`git rebase <upstream>`** writes new commits and then moves the branch. The manual describes it as transplanting "a series of commits onto a different starting point." The originals are not modified, because they cannot be; they are simply no longer reachable from any branch. See [[cs/software-engineering/merge-vs-rebase|Merge vs Rebase]] for when each is the right answer.

**`git cherry-pick <commit>`** takes "one or more existing commits," applies "the change each one introduces," and records "a new commit for each." The new commit has different parents, a different tree, and therefore a different hash from the one you named.

**`git revert <commit>`** also writes forward. It reverts "the changes that the related patches introduce," and records "some new commits that record them." Nothing is removed from history. This is the safe undo for anything already published, and the contrast with `reset` is the contrast between changing the record and appending to it.

## Changing only the index or the working tree

Every command in the previous section, given a path argument, stops being a ref command and becomes a file command. `git reset <path>` skips the ref move entirely and copies that path from `HEAD` into the index, which is exactly the inverse of `git add`. `git restore` was introduced to make this explicit: it restores "specified paths in the working tree with some contents from a restore source," and with `--staged` it restores the index instead. `git checkout -- <path>` is the older spelling of the working-tree case.

> [!warning] The path form and the commit form of `reset` are different commands
> `git reset HEAD~1` moves your branch back one commit. `git reset HEAD~1 file.c` moves nothing and stages that file as it was one commit ago. Nothing in the syntax announces the difference; the presence of a pathspec suppresses step one.

## Reading the graph

**`git log`** walks parent pointers. It lists "commits that are reachable by following the parent links from the given commit(s), but exclude commits that are reachable from the one(s) given with a ^ in front of them," which makes a revision range a set operation rather than a slice of a list. Ordering is a real choice: the default is reverse chronological, and `--topo-order` instead guarantees to "show no parents before all of its children are shown," which is a topological constraint rather than a temporal one. [[cs/software-engineering/the-commit-dag|The Commit DAG]] covers why those two orders differ.

**`git reflog`** reads the local record of ref movement rather than the graph. It is the recovery tool for anything the graph no longer reaches; see [[cs/software-engineering/the-reflog|The Reflog]].

**`git bisect`** is the one read command that also writes: it checks out commits as it goes, which changes `HEAD` and the working tree. It "uses a binary search algorithm" to find the commit that introduced a bug, and it is the subject of [[cs/software-engineering/git-bisect-as-binary-search|Git Bisect as Binary Search]].

## Exchanging with another repository

Remote operations move objects and refs between two object databases. Neither repository's history is edited by the other; each side ends up with more objects and updated names.

**`git remote add <name> <url>`** records a name for another repository. It writes configuration only.

**`git fetch`** copies objects and updates your remote-tracking refs. It retrieves refs "from one or more other repositories, along with the objects necessary to complete their histories," and it never touches your branches, your index, or your working tree. Fetch is always safe.

**`git push`** is fetch in the other direction, with the constraint that the remote ref must move forward. It sends only the objects the remote is missing. A non-fast-forward push is rejected because it would make commits unreachable in a repository whose reflog you do not read; `--force-with-lease` is the version that checks you are overwriting the state you last saw.

**`git pull`** is two commands. It runs a fetch and then integrates the fetched branch, and the integration step is configurable between `--ff-only` (the current default, which "fails if your local branch has diverged from the remote branch"), `--rebase`, `--no-rebase` (a merge), and `--squash`. Most confusion about pull is confusion about which of those four is configured.

> [!tip] The question to ask about any unfamiliar git command
> Which of the four locations does it write, and in what order? A command that only writes objects cannot lose work. A command that only moves refs cannot lose work either, because the reflog remembers. Only the commands that overwrite the index or the working tree can, and there are very few of them.

## Related Notes

- [[cs/software-engineering/version-control-fundamentals|Version Control Fundamentals]] - the conceptual note this reference sits under, including branching strategies
- [[cs/software-engineering/the-three-trees|The Three Trees]] - the working tree, index, and HEAD model that makes `reset` and `checkout` legible
- [[cs/software-engineering/refs-and-branches-as-pointers|Refs and Branches as Pointers]] - why moving a branch is cheap and why it cannot lose a commit
- [[cs/software-engineering/git-objects-and-content-addressable-storage|Git Objects and Content-Addressable Storage]] - what actually lands in the object database
- [[cs/software-engineering/the-commit-dag|The Commit DAG]] - the graph `log`, `merge`, and `bisect` all walk
- [[cs/software-engineering/merge-vs-rebase|Merge vs Rebase]] - the one command choice on this page that is a values question
- [[cs/software-engineering/the-reflog|The Reflog]] - the undo log behind every "I lost my commits" recovery
- [[cs/software-engineering/git-bisect-as-binary-search|Git Bisect as Binary Search]] - `git bisect` read as an algorithm
- [[cs/software-engineering/feature-flags-and-trunk-based-development|Feature Flags and Trunk-Based Development]] - the workflow that keeps branches short enough that most of this page stays unused

## Sources

- "git-add Documentation," Git. https://git-scm.com/docs/git-add . Supports the description of the index as the place you prepare the contents of the next commit, and the existence of hunk-level staging with `git add -p`.
- "git-commit Documentation," Git. https://git-scm.com/docs/git-commit . Supports the quoted description of what `git commit` creates and the statement that the new commit is a direct child of HEAD and the branch is updated to point to it.
- "git-stash Documentation," Git. https://git-scm.com/docs/git-stash . Supports the description of stash recording the state of the working directory and the index, and the storage of the latest stash in `refs/stash` with older stashes in that reference's reflog.
- "git-reset Documentation," Git. https://git-scm.com/docs/git-reset . Supports the mode list and the statement that `git reset [<mode>] <commit>` changes which commit HEAD points to.
- "Git Tools - Reset Demystified," Pro Git. https://git-scm.com/book/en/v2/Git-Tools-Reset-Demystified . Supports the three-step reset recipe, the claim that `--hard` is the only dangerous form and one of the very few cases where Git destroys data, and the path form skipping step one.
- "git-merge Documentation," Git. https://git-scm.com/docs/git-merge . Supports the description of a merge recording the result in a new commit with the names of the two parent commits.
- "git-rebase Documentation," Git. https://git-scm.com/docs/git-rebase . Supports the description of rebase as transplanting a series of commits onto a different starting point.
- "git-cherry-pick Documentation," Git. https://git-scm.com/docs/git-cherry-pick . Supports the quoted description of applying the change each named commit introduces and recording a new commit for each.
- "git-revert Documentation," Git. https://git-scm.com/docs/git-revert . Supports the description of revert as recording new commits that reverse the effect of earlier ones.
- "git-switch Documentation," Git. https://git-scm.com/docs/git-switch . Supports the statement that the working tree and index are updated to match the branch, and that the operation is aborted if it would lose local changes.
- "git-restore Documentation," Git. https://git-scm.com/docs/git-restore . Supports the description of restoring paths in the working tree from a restore source and the `--staged` form restoring the index.
- "git-log Documentation," Git. https://git-scm.com/docs/git-log . Supports the reachability framing of a revision range, the default reverse-chronological ordering, and the `--topo-order` guarantee that no parents are shown before all of their children.
- "git-fetch Documentation," Git. https://git-scm.com/docs/git-fetch . Supports the description of fetch retrieving refs along with the objects necessary to complete their histories.
- "git-push Documentation," Git. https://git-scm.com/docs/git-push . Supports the statement that push sends all necessary data that is not already on the remote.
- "git-pull Documentation," Git. https://git-scm.com/docs/git-pull . Supports the claim that pull runs `git fetch` and then integrates, the four integration options, and that `--ff-only` is the default and fails when the local branch has diverged.
- "git-bisect Documentation," Git. https://git-scm.com/docs/git-bisect . Supports the description of bisect as using a binary search algorithm to find which commit introduced a bug.
- "git-remote Documentation," Git. https://git-scm.com/docs/git-remote . Supports the description of `git remote` as managing the set of repositories whose branches you track.

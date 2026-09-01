---
title: The Reflog
description: "Git writes a local, append-only log of every value each ref has ever held. It is the undo log behind almost every git recovery, and it is the reason a lost commit usually is not lost."
draft: false
comments: true
tags:
  - cs
  - software-engineering
date: 2026-08-31
updated:
aliases: []
---

Someone runs `git reset --hard HEAD~3`, realizes what they did, and starts writing an apology. The commits are still on disk, their hashes are recorded in a file in `.git`, and getting them back is one command. The reason almost nobody reaches for it is that nothing in git's normal output ever mentions it.

> [!note] The idea
> Every time a ref changes value, git appends a line recording the old value, the new value, and the command responsible. That log is the **reflog**, and it functions as a second root set: an object stays alive if any ref reaches it, or if any reflog entry does. The consequence is that the [[cs/software-engineering/the-commit-dag|commit graph]] you can see through branches is smaller than the set of commits you still have, and the gap between them is the recovery surface. It is also strictly local, so this safety net exists only in the clone that made the mistake.

## What it records

The manual defines reflogs as logs that "record when the tips of branches and other references were updated in the local repository," and notes that they are "useful in various Git commands, to specify the old value of a reference." Every ref gets its own log, including `HEAD` itself, and "The reflog covers all recent actions, and in addition the HEAD reflog records branch switching."

That last clause makes the `HEAD` reflog the interesting one. Branch reflogs record where each branch has pointed; the `HEAD` reflog records where you have been, in order, across branches, which is the closest thing git has to a transcript of your session.

Reading it is ordinary log reading, because it is: "git reflog show is an alias for git log -g --abbrev-commit --pretty=oneline". The `@{n}` syntax names positions in that log rather than positions in history, which is the distinction people trip over. `HEAD@{2}` means where `HEAD` was two moves ago, and `HEAD~2` means two commits back along the parent chain. On a linear branch you have been quietly committing to, those coincide. After a checkout, a reset, or a rebase, they have nothing to do with each other.

Time-based forms work too: the documentation's example is `master@{one.week.ago}`, meaning where `master` pointed a week ago in this local repository. The last three words matter; a fresh clone cannot answer that question at all.

## Why it is an undo log

The reflog is structurally the same idea as a journal in a file system or a database. It does not store your data; it stores the sequence of pointer updates that would otherwise be lost when a pointer is overwritten. Recovery then means reading the log backwards to find the previous value, exactly as [[cs/forensics/deleted-files-journaling-and-what-survives|file system journaling and deletion recovery]] works: deleting a file removes a directory entry rather than the content, and whether you get it back depends on whether anything has reused the space and how far back the journal still reaches.

Git's version is more forgiving than a file system's for one reason. The content is [[cs/software-engineering/git-objects-and-content-addressable-storage|content-addressed and immutable]], so nothing is ever overwritten in place. Only names are overwritten, and the reflog is the log of name changes. There is no equivalent of a reused disk block, only garbage collection, and garbage collection is on a timer.

That timer is worth knowing. Reflog entries expire after a default of 90 days (`gc.reflogExpire`), and entries "not reachable from the current tip" expire after 30 (`gc.reflogExpireUnreachable`). Loose objects are pruned only when older than a default of two weeks. So the practical guarantee is roughly: anything you did in the last month is recoverable, anything from last quarter probably is not, and nothing announces the transition.

## The recoveries

Every one of these works the same way. Find the hash the ref used to have, then point a ref at it.

**After a bad `reset`.** `git reflog` shows the entry before the reset; `git reset --hard HEAD@{1}` returns the branch. `git reset` also sets `ORIG_HEAD` to the tip before the operation, so `git reset --hard ORIG_HEAD` is the same move without reading the log.

**After a bad `rebase`.** The pre-rebase commits are unreachable but intact. The `HEAD` reflog shows the tip before the rebase started, and `git reset --hard HEAD@{n}` on that entry restores the original branch, primed commits abandoned. See [[cs/software-engineering/merge-vs-rebase|Merge vs Rebase]] for why the originals still exist.

**After deleting a branch.** `git branch -d` prints the hash it deleted, and the branch's own reflog is gone with it, but the `HEAD` reflog still contains every commit you visited on that branch. `git branch <name> <hash>` recreates the name; see [[cs/software-engineering/refs-and-branches-as-pointers|Refs and Branches as Pointers]] for why that is all a branch was.

**After committing on a detached `HEAD` and switching away.** The commits have no ref at all. The `HEAD` reflog is the only record, which is precisely the case it was designed for.

**When the reflog does not have it.** `git fsck --lost-found` reports dangling objects, which the glossary defines as an unreachable object with "no references to it from any reference or object in the repository." A stash you dropped or a commit whose reflog entry expired can still show up there until gc runs.

> [!warning] What the reflog does not cover
> It logs refs. It does not log the index, and it does not log the working directory. So `git reset --hard` is recoverable in the part that moved your branch and unrecoverable in the part that overwrote your files, and staged-but-never-committed content has no log anywhere. This is the same boundary drawn in [[cs/software-engineering/the-three-trees|The Three Trees]], seen from the recovery side: the object database and the refs both keep records, the other two trees keep none.
>
> It is also never transmitted. Reflogs are not pushed, not fetched, and not present in a fresh clone. A colleague cannot recover your mistake from their copy, and CI runners, containers, and freshly cloned build machines have no reflog to consult.

> [!tip] Run it before you panic, not after
> The first command after any git operation that surprised you is `git reflog`. It costs nothing, it is read-only, and it usually contains the answer in the first five lines. The habit worth building is checking the log before trying a second destructive command to fix the first one, since the second command is what usually does the real damage.

## Related Notes

- [[cs/software-engineering/refs-and-branches-as-pointers|Refs and Branches as Pointers]] - the ref updates this log records, and why repointing a name is a full recovery
- [[cs/software-engineering/the-three-trees|The Three Trees]] - the boundary between what has a log and what does not
- [[cs/software-engineering/the-commit-dag|The Commit DAG]] - the reachable graph, which the reflog's extra roots extend
- [[cs/software-engineering/merge-vs-rebase|Merge vs Rebase]] - where the abandoned commits of a rebase go
- [[cs/forensics/deleted-files-journaling-and-what-survives|Deleted Files, Journaling, and What Survives]] - the same pointer-versus-content recovery argument, on disk
- [[cs/software-engineering/git-command-reference|Git Command Reference]] - which commands move a ref, and therefore write a reflog entry

## Sources

- "git-reflog Documentation," Git. https://git-scm.com/docs/git-reflog . Supports the definition of reflogs as records of when the tips of branches and other references were updated in the local repository, their use in specifying the old value of a reference, the `HEAD@{2}` and `master@{one.week.ago}` examples, the statement that the reflog covers all recent actions and that the HEAD reflog additionally records branch switching, the equivalence of `git reflog show` to `git log -g --abbrev-commit --pretty=oneline`, and the 90-day `gc.reflogExpire` and 30-day `gc.reflogExpireUnreachable` defaults for entries not reachable from the current tip.
- "git-reset Documentation," Git. https://git-scm.com/docs/git-reset . Supports the statement that `ORIG_HEAD` is set to the tip of the current branch before the operation.
- "git-gc Documentation," Git. https://git-scm.com/docs/git-gc . Supports the two-week default for pruning loose objects.
- "gitglossary Documentation," Git. https://git-scm.com/docs/gitglossary . Supports the definition of a dangling object as an unreachable object with no references to it from any reference or object in the repository.

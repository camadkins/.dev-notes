---
title: Refs and Branches as Pointers
description: "A git branch is a file containing one hash. Modelling branches as pointers into an immutable graph, rather than as containers holding commits, removes most of the fear people have of git."
draft: false
comments: true
tags:
  - cs
  - software-engineering
date: 2026-08-31
updated:
aliases: []
---

Ask someone what a branch is and you usually get an answer about a line of work: a place your commits go, a copy of the code, a thing that holds changes until they are merged. That model is wrong in a way that produces real anxiety, because if a branch contains commits then deleting one destroys them, and merging one moves them somewhere else. Neither happens.

> [!note] The idea
> A branch is a **file containing forty hex characters**. It is a name bound to one commit, stored under `.git/refs/heads/`, and forty characters plus a newline is the entire thing. Commits are immutable and live in the [[cs/software-engineering/git-objects-and-content-addressable-storage|object database]]; refs are the only mutable layer in the system, and everything that feels destructive in git is a pointer assignment. Learn what a ref is and the question "can I undo this?" collapses into "did that command move a ref, or did it overwrite a file?"

## Where the mutability lives

Git splits the repository cleanly. The object database is append-only and content-addressed, so nothing in it can change. Layered over that is a small set of mutable names, all of them files whose content is an object name:

- `refs/heads/<name>` for local branches
- `refs/tags/<name>` for tags
- `refs/remotes/<remote>/<name>` for remote-tracking branches
- `HEAD`, at the top of `.git`

That layering is the reason git operations are cheap and reversible. Creating a branch writes one small file, so branching costs nothing and there is no reason to hesitate before doing it. Moving a branch rewrites one small file. Deleting a branch removes one small file, and every commit it named is still exactly where it was.

Remote-tracking refs are the same mechanism pointed at somebody else's repository. The glossary describes such a ref as one "used to follow changes from another repository," typically named like `refs/remotes/foo/bar` to indicate "that it tracks a branch named bar in a remote named foo," and adds the rule that a remote-tracking branch "should not contain direct modifications." `origin/main` is not a branch you work on. It is your local record of where `main` was on `origin` the last time you fetched, which is why it goes stale and why `git fetch` alone fixes that without touching anything you can edit.

## HEAD is a pointer to a pointer

`HEAD` normally does not name a commit. It names a branch, and the branch names a commit, which is why committing advances your branch without you asking: `git commit` creates the commit and then "the branch is updated to point to it."

Detaching `HEAD` removes the middle hop. The glossary is precise about it: "Normally the HEAD stores the name of a branch, and commands that operate on the history HEAD represents operate on the history leading to the tip of the branch the HEAD points at," but git "also allows you to check out an arbitrary commit" that is not the tip of any branch, and the glossary calls the `HEAD` in that state detached. Work still functions in that state: commands that build new history "still work while the HEAD is detached. They update the HEAD to point at the tip of the updated history without affecting any branch."

That last clause is the whole warning. Commits made on a detached `HEAD` are real commits in the object database, and they are reachable from nothing except `HEAD` itself. Move `HEAD` and the only name pointing at them is gone. The commits are still there, which is what `git checkout -b rescue <sha>` exploits, and what the [[cs/software-engineering/the-reflog|reflog]] exists to let you find.

The extra hop also explains the `reset`-versus-`checkout` confusion covered in [[cs/software-engineering/the-three-trees|The Three Trees]]. Both can end with you looking at the same commit, but "reset will move the branch HEAD points to, checkout moves HEAD itself." One writes the branch file, the other writes `HEAD`.

## Deleting a branch deletes a name

This is the operation people fear most and it is the clearest case. `git branch -d feature` removes `refs/heads/feature`. The commits it pointed at are untouched, still in `.git/objects`, still reachable if any other ref reaches them, and still findable through the reflog if not. Git even prints the hash on the way out so you can restore the name with `git branch feature <sha>`.

What actually removes objects is garbage collection, and git's collector works the way a language runtime's does. `git gc` performs housekeeping including "removing unreachable objects which may have been created from prior invocations of git add," where reachable means reachable from a root, and the roots are the refs plus the reflog entries. That is mark-and-sweep with a very familiar shape: refs are the root set, parent and tree pointers are the edges, and the sweep frees what the mark phase never visited. The [[cs/pl/garbage-collection-concepts|garbage collection]] argument transfers wholesale, including the part where you cannot reason about liveness by looking at one object, only by asking what can still reach it.

Git then adds grace periods on top, because a root set that includes your recent mistakes is a feature. Loose objects are pruned only when "older than date (default is 2 weeks ago, overridable by the config variable gc.pruneExpire)," and reflog entries themselves survive on their own schedule, with reachable entries expiring after a default of 90 days and unreachable ones after 30. The practical effect is that a commit you orphaned this morning is still on disk, and will be for weeks.

> [!example] The whole branch, in two files (hash values here are illustrative)
> ```
> $ cat .git/HEAD
> ref: refs/heads/main
> $ cat .git/refs/heads/main
> 9e5e6a4c8f3b2d1e0a7c5b4d3f2e1a0b9c8d7e6f
> ```
> Nothing else is stored about the branch. No list of commits, no diff, no record of when it was created. `git branch feature` writes a second file with the same forty characters in it, and the two names now point at one commit until one of them moves.

## What the pointer model buys you

Almost every recovery in git is renaming or repointing. Committed on the wrong branch? The commit is fine; make a branch pointing at it and move the wrong one back with `git reset`. Deleted a branch? Recreate the name. Rebased and lost the original? The original commits are unreachable, not gone, and the reflog holds their hashes. Force-pushed over a colleague's work? Their commits are still in your object database and in theirs.

The two things that genuinely lose work both live outside this layer. Uncommitted edits in the working directory are not objects and no ref points at them, and content staged but never committed has no reflog. Everything the ref layer touches is recoverable; everything it does not touch is not. That is the actual dividing line, and it does not run where most people's intuition puts it.

## Related Notes

- [[cs/software-engineering/git-objects-and-content-addressable-storage|Git Objects and Content-Addressable Storage]] - the immutable layer the refs point into
- [[cs/software-engineering/the-three-trees|The Three Trees]] - which commands move a branch and which move `HEAD`
- [[cs/software-engineering/the-reflog|The Reflog]] - the second root set, and how to read the hashes back out
- [[cs/software-engineering/the-commit-dag|The Commit DAG]] - the graph refs act as entry points into
- [[cs/pl/garbage-collection-concepts|Garbage Collection: Concepts]] - reachability from a root set, which is exactly what `git gc` computes
- [[cs/software-engineering/git-command-reference|Git Command Reference]] - each command sorted by whether it writes a ref or a file
- [[cs/software-engineering/feature-flags-and-trunk-based-development|Feature Flags and Trunk-Based Development]] - a workflow built on branches being cheap enough to keep short

## Sources

- "gitglossary Documentation," Git. https://git-scm.com/docs/gitglossary . Supports the definition of a remote-tracking branch as a ref used to follow changes from another repository, its `refs/remotes/foo/bar` naming, the rule that it should not contain direct modifications, and the detached HEAD definition including the statement that commands building new history still work and update HEAD without affecting any branch.
- "git-commit Documentation," Git. https://git-scm.com/docs/git-commit . Supports the statement that after a commit the branch is updated to point to it.
- "Git Tools - Reset Demystified," Pro Git. https://git-scm.com/book/en/v2/Git-Tools-Reset-Demystified . Supports the distinction that reset moves the branch HEAD points to while checkout moves HEAD itself.
- "git-gc Documentation," Git. https://git-scm.com/docs/git-gc . Supports the description of `git gc` removing unreachable objects and the default two-week grace period for pruning loose objects, overridable by `gc.pruneExpire`.
- "git-reflog Documentation," Git. https://git-scm.com/docs/git-reflog . Supports the 90-day default for `gc.reflogExpire` and the 30-day default for `gc.reflogExpireUnreachable`.

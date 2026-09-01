---
title: The Three Trees
description: "Working directory, index, and HEAD are three separate snapshots of the same project. Reset and checkout are confusing only until you know which of the three each one writes."
draft: false
comments: true
tags:
  - cs
  - software-engineering
date: 2026-08-31
updated:
aliases: []
---

Nobody finds `git reset` intuitive, and the usual explanations make it worse by describing what it is for. Pro Git takes the other route and describes what it writes, using "the mental frame of Git being a content manager of three different trees." The word tree here means a collection of files rather than the [[cs/dsa/trees|data structure]], and the three are `HEAD`, the index, and the working directory.

> [!note] The idea
> Your project exists in three places at once: the last commit (`HEAD`), the proposed next commit (the index), and the files you are editing (the working directory). Almost every git command that feels unpredictable is a command that writes **some prefix of those three, in a fixed order**, and the flags choose where it stops. `reset` is not three commands sharing a name; it is one three-step procedure with two early exits. Once you can name which trees an invocation writes, you can also tell whether it can lose work, because only the last two are unrecoverable.

## What each tree holds

Pro Git gives each a one-line role. `HEAD` is the "Last commit snapshot, next parent." The index is the "Proposed next commit snapshot." The working directory is the "Sandbox."

`HEAD` is doubly indirect and this matters later. It "is the pointer to the current branch reference, which is in turn a pointer to the last commit made on that branch," so `HEAD` names a branch, and the branch names a commit. That extra hop is the entire difference between `reset` and `checkout`. See [[cs/software-engineering/refs-and-branches-as-pointers|Refs and Branches as Pointers]] for the layer this sits in.

The index is "your proposed next commit," populated from whatever was last checked out and then modified by `git add`. Pro Git notes that it is not literally a tree structure but a flattened manifest, which is a detail that leaks in exactly one place: the index can hold a version of a file that has never existed on disk, because `git add -p` stages selected hunks.

The working directory is where you actually work. "Think of the working directory as a sandbox, where you can try changes out before committing them to your staging area (index) and then to history."

## `git status` is a pair of diffs

The two headings in `git status` output are the two adjacent comparisons. A file listed under "Changes not staged for commit" differs between the index and the working directory. A file listed under "Changes to be committed" differs between `HEAD` and the index. When all three trees agree, `git status` prints nothing interesting, and a file can appear under both headings at once, which is what people mean when they say they staged half a file.

The normal workflow is a pipeline through the three. `git add` copies content from the working directory into the index, writing blobs into the [[cs/software-engineering/git-objects-and-content-addressable-storage|object database]] as it goes. `git commit` then "takes the contents of the index and saves it as a permanent snapshot, creates a commit object which points to that snapshot, and updates master to point to that commit." Switching branches runs the same pipeline backwards: checkout "changes HEAD to point to the new branch ref, populates your index with the snapshot of that commit, then copies the contents of the index into your working directory."

## Reset is one recipe with two exits

The `reset` documentation reads like three unrelated behaviors. Pro Git's version reads like one procedure:

1. Move the branch `HEAD` points to (stop here if `--soft`).
2. Make the index look like `HEAD` (stop here unless `--hard`).
3. Make the working directory look like the index.

That is the whole command. `--soft HEAD~1` therefore undoes a commit and leaves everything staged, which is why it is the standard way to redo a commit message or squash the last few commits. Plain `reset HEAD~1` (the `--mixed` default) undoes the commit and the staging, leaving your edits in the working directory. `--hard` undoes all three, and it is the one to be careful with, because it "is the only way to make the reset command dangerous, and one of the very few cases where Git will actually destroy data."

Give `reset` a path and it becomes a different command: "If you specify a path, reset will skip step 1, and limit the remainder of its actions to a specific file or set of files." Skipping step one is forced rather than chosen, since `HEAD` is a pointer to a whole commit and there is no way to point at part of one. What survives is step two, which copies that path from `HEAD` into the index, which is precisely the inverse of `git add`. That is why `git status` suggests it to unstage a file.

## The cheat sheet, and the one distinction that matters

Pro Git's summary table maps each invocation to the trees it touches. `REF` means the command moves the branch that `HEAD` points at; `HEAD` means it moves `HEAD` itself.

| Command | Moves | Index | Working dir | Safe? |
|---------|-------|-------|-------------|-------|
| `reset --soft <commit>` | REF | no | no | yes |
| `reset <commit>` | REF | yes | no | yes |
| `reset --hard <commit>` | REF | yes | yes | **no** |
| `checkout <commit>` | HEAD | yes | yes | yes |
| `reset <commit> <paths>` | nothing | yes | no | yes |
| `checkout <commit> <paths>` | nothing | yes | yes | **no** |

Two rows deserve reading twice. The first is the `Moves` column on rows three and four: `reset --hard <branch>` and `checkout <branch>` both end with all three trees matching that branch, but "reset will move the branch HEAD points to, checkout moves HEAD itself." If you are on `develop` and run `git reset main`, `develop` now points where `main` does and you have silently moved a branch. If you run `git checkout main`, `develop` does not move at all.

The second is that `checkout <commit>` is marked safe while `checkout <commit> <paths>` is not. Without paths, "checkout is working-directory safe" and refuses to clobber modified files. With paths it does not check, which makes it, in Pro Git's words, "exactly like git reset --hard [branch] file (if reset would let you run that)." This is the sharpest edge in daily git use and it is hidden behind two spellings of one word. `git restore` exists to split them apart: `git restore <path>` restores the working tree from the index, and `git restore --staged <path>` restores the index from `HEAD`, with the target named in the flag instead of inferred from whether you typed a path.

> [!warning] What the reflog can and cannot get back
> Moving a branch is always recoverable, because the [[cs/software-engineering/the-reflog|reflog]] records every value a ref has held and the commits stay in the object database. Overwriting the index or the working directory is not, because neither has a log and neither is content-addressed. This is the practical reason the answer to "how do I safely try this" is almost always "commit first," which converts an unrecoverable tree into a recoverable ref.

## Related Notes

- [[cs/software-engineering/refs-and-branches-as-pointers|Refs and Branches as Pointers]] - why `HEAD` points at a branch rather than a commit, and what detaching means
- [[cs/software-engineering/git-objects-and-content-addressable-storage|Git Objects and Content-Addressable Storage]] - where `git add` puts the content before the index records it
- [[cs/software-engineering/the-reflog|The Reflog]] - the log that makes ref moves reversible and tree overwrites not
- [[cs/software-engineering/git-command-reference|Git Command Reference]] - the same commands grouped by everything they write, including remotes
- [[cs/software-engineering/version-control-fundamentals|Version Control Fundamentals]] - the conceptual layer above this one

## Sources

- "Git Tools - Reset Demystified," Pro Git. https://git-scm.com/book/en/v2/Git-Tools-Reset-Demystified . Supports the three-trees frame and the role given to each tree, the description of `HEAD` as a pointer to the current branch reference which points to the last commit, the index as the proposed next commit implemented as a flattened manifest, the working directory as a sandbox, the `git commit` and branch-checkout descriptions, the three-step reset recap and its two early exits, the claim that `--hard` is the only dangerous form and one of the very few cases where Git destroys data, the path form skipping step one, the summary cheat-sheet of which commands affect which trees, the statement that reset moves the branch HEAD points to while checkout moves HEAD itself, and the comparison of `checkout [commit] <paths>` to a `reset --hard` on a file.
- "git-restore Documentation," Git. https://git-scm.com/docs/git-restore . Supports the description of `git restore` restoring the working tree from a source and `--staged` restoring the index from `HEAD`.

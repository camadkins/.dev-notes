---
title: Merge vs Rebase
description: "Merge preserves what happened; rebase writes what you wish had happened. The choice is about who the history is for, and both answers have a cost paid by a different tool."
draft: false
comments: true
tags:
  - cs
  - software-engineering
date: 2026-08-31
updated:
aliases: []
---

The merge-versus-rebase argument is usually conducted in aesthetic terms, one side asking for clean linear history and the other calling that dishonest. Both sides are describing a real property and neither is describing a preference. The disagreement is about what a repository's history is supposed to be.

> [!note] The idea
> A merge commit is a **record**: it says two lines of development existed, and here is where they were reconciled. A rebase produces a **narrative**: a sequence of changes arranged for a reader, in which the parallelism never happened. Both are truthful about the content and neither is truthful about the other's subject. The useful question is not which is cleaner, it is which downstream consumer you are writing for, because the two answers break different tools.

## What each one does to the graph

Merge writes one new commit. Outside a fast-forward, "the branches to be merged must be tied together by a merge commit that has both of them as its parents," and the [[cs/software-engineering/the-commit-dag|DAG]] keeps both lines:

```
      A---B---C topic
     /         \
D---E---F---G---H master
```

Rebase writes new commits and abandons the old ones. The manual describes it as transplanting "a series of commits onto a different starting point," turning

```
      A---B---C topic
     /
D---E---F---G master
```

into

```
              A'--B'--C' topic
             /
D---E---F---G master
```

The primed commits are genuinely different objects. Each has a different parent, therefore a different hash, therefore a different identity, per [[cs/software-engineering/git-objects-and-content-addressable-storage|content addressing]]. `A` and `A'` may have identical diffs and are not the same commit. The originals are not deleted; they become unreachable from any branch and survive in the object database until garbage collection, findable through the [[cs/software-engineering/the-reflog|reflog]].

## History as a record

Under this view the repository is an audit trail. It should say that two people worked in parallel for three days, that one of them integrated the other's work on a particular commit, and that two conflicts in the scheduler were resolved there and not somewhere else. `git merge --no-ff` takes the position literally by refusing to fast-forward, so even a branch that could have been a straight line leaves a visible branch point saying "this work was a unit."

The evidence value is real. When a conflict resolution is wrong, the merge commit is the only place the resolution exists as an object you can look at, because the resolution is not in either parent. A rebased history contains the same resolved code with no marker saying a human made a judgment call there.

The cost lands on anyone reading the history later. Branches contain the commits developers actually make, including `wip`, `fix typo`, and commits that did not compile. That is exactly the assumption [[cs/software-engineering/git-bisect-as-binary-search|git bisect]] needs and does not get: a broken intermediate commit inside a merged branch is neither good nor bad, it is untestable, and a long-lived branch merged after weeks makes the "when did this break" question ambiguous because the break entered the branch at one time and the mainline at another. `git bisect --first-parent` exists for this, following "only the first parent commit upon seeing a merge commit," which is a way of saying you gave up on the inside of branches and will treat each merge as one atomic change.

## History as a narrative

Under this view the repository is a document written for a future maintainer, and the unit is the reviewable change rather than the keystroke. Interactive rebase is the editing tool: reorder, squash the typo fix into the commit it fixes, split a commit that did two things, rewrite a message now that you know what the change turned out to be. What lands on the mainline is a sequence in which every commit builds, every commit does one thing, and every message is written with hindsight.

This is a real engineering property, and not only an aesthetic one. It is what makes `git log -p` on a file readable, what makes `git blame` land on a commit whose message explains the line, and what makes bisect's precondition plausible, since a history where every commit builds is a history where every commit can be tested.

The cost is symmetric to the merge case and less often admitted. A rebased commit is a tree that has never existed before the rebase produced it. `A'` was never built, never tested, and never run by anyone, and if the rebase resolved a conflict then `A'` contains code no reviewer saw. A green pipeline on `C'` says nothing about `A'` and `B'`. Rebase therefore buys bisect a cleaner-looking sequence while quietly filling it with untested commits, and the mitigation is to make the machine do the work: `git rebase --exec` appends a command after each commit in the rewritten history, so `git rebase -i --exec "make test" main` actually tests each rewritten commit and stops on the first failure.

## The one rule that is not a preference

Rebasing something other people have pulled is the case where taste stops applying. The manual states the position without hedging: "Rebasing (or any other form of rewriting) a branch that others have based work on is a bad idea: anyone downstream of it is forced to manually fix their history."

The mechanism is the identity change. Your collaborator's repository holds `A`, `B`, `C`; you push `A'`, `B'`, `C'`; nothing merges them, because git has no way to know they correspond. If they now merge their work in, "the commits from subsystem will remain duplicated forever," and the manual notes such duplicates "clutter up history, making it harder to follow." Fixing it means rebasing their branch too, and "This becomes a ripple effect: anyone downstream from topic is forced to rebase too, and so on!"

So the operative rule is about publication, not about rebase. Rewrite your own unpublished work freely; the moment someone else could have fetched it, the history is a shared artifact and rewriting it externalizes a cost onto people who did not choose it. Merges and reverts are the append-only operations, and [[cs/software-engineering/git-command-reference|`git revert`]] is the published-history counterpart to `reset`.

## The third answer

Squash merging is the position that a branch should appear in the mainline as exactly one commit. `git merge --squash` produces the tree of a real merge without the merge commit, which "allows you to create a single commit on top of the current branch whose effect is the same as merging another branch," and the squash-and-merge option on the major hosting platforms does the same thing.

It is history-as-narrative at a coarser grain: one paragraph per unit of work, no branch topology at all, and no intermediate commits to bisect into. For a team whose branches are one reviewable change anyway, this is the cheapest way to get a bisectable mainline, and it is why squash-merge and [[cs/software-engineering/feature-flags-and-trunk-based-development|trunk-based development]] tend to show up together. The information it discards is everything inside the branch, permanently, once the branch is deleted.

> [!tip] Decide it once, per repository, and write it down
> The failure mode is not choosing wrong, it is choosing differently every week. A history that is half merges and half rebases has neither property: it is not a faithful record, and it does not read as a sequence. Pick the consumer you care about (auditors and incident reviews want the record; readers and bisect want the narrative), configure `pull.rebase` and the merge button to match, and stop relitigating it.

## Related Notes

- [[cs/software-engineering/the-commit-dag|The Commit DAG]] - the graph each strategy leaves behind
- [[cs/software-engineering/git-objects-and-content-addressable-storage|Git Objects and Content-Addressable Storage]] - why a rebased commit is a different commit
- [[cs/software-engineering/the-reflog|The Reflog]] - where the pre-rebase commits go, and how to get them back
- [[cs/software-engineering/git-bisect-as-binary-search|Git Bisect as Binary Search]] - the tool that pays for both choices
- [[cs/software-engineering/feature-flags-and-trunk-based-development|Feature Flags and Trunk-Based Development]] - the workflow that makes the argument small by keeping branches short
- [[cs/software-engineering/code-review|Code Review]] - the reader whose experience the narrative view is optimizing
- [[cs/software-engineering/git-command-reference|Git Command Reference]] - `merge`, `rebase`, `revert`, and `cherry-pick` by what they write

## Sources

- "git-merge Documentation," Git. https://git-scm.com/docs/git-merge . Supports the statement that outside a fast-forward the merged branches must be tied together by a merge commit having both as parents, and the description of `--squash` as creating a single commit whose effect is the same as merging another branch.
- "git-rebase Documentation," Git. https://git-scm.com/docs/git-rebase . Supports the description of rebase as transplanting a series of commits onto a different starting point, the before-and-after diagrams, the `--exec` option appending a command after each commit created in the final history, and the RECOVERING FROM UPSTREAM REBASE material including the warning that rebasing a branch others have based work on forces them to manually fix their history, the permanent duplication of commits, and the ripple effect on everyone downstream.
- "git-bisect Documentation," Git. https://git-scm.com/docs/git-bisect . Supports the description of `--first-parent` as following only the first parent commit upon seeing a merge commit.

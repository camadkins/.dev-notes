---
title: The Commit DAG
description: "Git history is a partial order, not a sequence. Every confusing thing about git log output comes from flattening that partial order into a line, which is a topological sort."
draft: false
comments: true
tags:
  - cs
  - software-engineering
date: 2026-08-31
updated:
aliases: []
---

A commit records a snapshot and the commits it came after. The glossary is blunt about what that adds up to: the commit objects "form a directed acyclic graph, because they have parents (directed), and the graph of commit objects is acyclic (there is no chain which begins and ends with the same object)." Every graph algorithm you have ever written applies to it, and two of them you already run daily without noticing.

> [!note] The idea
> The commit graph is a **partial order**. Commit `A` precedes commit `B` only if there is a chain of parent pointers from `B` back to `A`; two commits on separate branches are related by nothing at all. A terminal, though, prints lines, so `git log` has to invent a total order over a structure that does not have one. Choosing that total order is a [[cs/dsa/topological-sorting|topological sort]], and every complaint about git log output ("why is that commit there?", "why is a week-old commit above a new one?") is a complaint about which tie-breaking rule was used.

## The edges point backwards

Each commit object stores the hash of its parent or parents. A root commit has zero parents, an ordinary commit has one, a merge commit has two or more. The direction is child to parent, which is the opposite of the direction time runs, and that is the single fact that makes reachability work: from a branch tip you can walk the entire history behind it, and from an old commit you cannot find its children without scanning everything.

```
A---B---C---D        main
     \         \
      E---F-----M    (M is a merge, parents D and F)
```

Acyclicity is not enforced by a check. It falls out of [[cs/software-engineering/git-objects-and-content-addressable-storage|content addressing]]: a commit's name is the hash of its content, and its content includes its parents' names. To build a cycle you would have to know a commit's hash before computing it, since that hash would need to appear inside itself. The DAG property is structural rather than validated, in the same way a [[cs/dsa/hash-tables|hash table]] does not check that two keys hashed the same way produce the same bucket.

## Reachability is the primitive

Git rarely asks "what is in this branch." It asks what is reachable from a set of starting points. `git log` is documented in exactly those terms: it lists "commits that are reachable by following the parent links from the given commit(s), but exclude commits that are reachable from the one(s) given with a ^ in front of them." The manual then names the operation outright: "You can think of this as a set operation."

This is why `git log main..feature` means "commits reachable from feature but not from main," why `git branch --merged` can answer whether one commit is an ancestor of another, and why deleting a branch does not delete commits. It removes a starting point. Anything only that starting point could reach becomes unreachable, which is a different condition from being gone, and the [[cs/software-engineering/the-reflog|reflog]] keeps a second set of starting points precisely so unreachable does not mean lost.

Reachability over a DAG is a [[cs/dsa/graph-traversals-bfs-dfs|graph traversal]] and nothing more. The interesting engineering is in doing it fast on graphs with millions of vertices, which is what the supplemental commit-graph file exists for: the glossary describes it as "a supplemental representation of the commit graph which accelerates commit graph walks."

## Three orderings of the same graph

`git log` offers three orderings, and the differences between them are exactly the differences a [[cs/dsa/graphs|graph]] and a list disagree about.

The default is reverse chronological, sorted by the commit timestamp. `--date-order` will "Show no parents before all of its children are shown, but otherwise show commits in the commit timestamp order." `--topo-order` will "Show no parents before all of its children are shown, and avoid showing commits on multiple lines of history intermixed."

Read those carefully. The parent-after-child guarantee is stated as a property of `--date-order` and `--topo-order`, and it is the definition of a topological order on this graph. It is not stated of the default, and it cannot be, because a commit's timestamp comes from the clock of whichever machine made it. A colleague with a skewed clock, a rebase that preserves author dates, or a commit made on a laptop with the wrong timezone can all put a parent above its child in default output.

The manual's own example makes the last distinction concrete:

```
---1----2----4----7
    \              \
     3----5----6----8---
```

With the numbers denoting timestamp order, `--date-order` produces 8 7 6 5 4 3 2 1, and `--topo-order` produces 8 6 5 3 7 4 2 1, because "some older commits are shown before newer ones in order to avoid showing the commits from two parallel development track mixed together."

Both outputs are valid topological orders of the same DAG. That is not a defect in either; a topological order is not unique in general, and any linearization that respects the edges is correct. The two options are two different tie-breaking rules over the set of vertices that are currently free to be emitted, which is the same choice Kahn's algorithm makes every time more than one vertex has indegree zero.

> [!example] The two standard topological sorts, in a tool you already use
> The [[cs/dsa/topological-sorting|topological sorting]] note gives two algorithms. Kahn's keeps a queue of vertices whose prerequisites are all satisfied and drains it, choosing freely among ties. `--date-order` and `--topo-order` are that same loop with two different tie-breakers: newest timestamp first, or stay on the current line of history first. The other standard algorithm, reversed [[cs/dsa/depth-first-search-algorithms|DFS]] postorder, is what `git log --graph` effectively renders when it draws one branch's spine before joining in the side branch.

## Timestamps are not the history

The deeper reason to prefer the graph over the dates is that the parent pointers are the only causal record git has. A commit's timestamp is a physical clock reading from an untrusted machine; a commit's parent list is a claim about what the author had in hand when they made it, and it cannot be wrong, because the parent's content is hashed into the child.

This is the same distinction [[cs/systems/logical-clocks-lamport-and-vector|logical clocks]] draw in distributed systems. Wall-clock time across machines gives you an order that looks total and is not trustworthy; the happens-before relation gives you a partial order that is trustworthy and admits concurrent events with no order between them. Two commits on two branches are concurrent in exactly that sense. Git chose to record the partial order and let the display layer fake a total one, which is the right way round, and it means the fake is recoverable: `--topo-order` puts the causal structure back.

> [!tip] What to do with this
> When git log output confuses you, add `--graph --topo-order` and the confusion usually resolves into a fact about the shape of the history rather than a mystery about the tool. And when you find yourself asking "which came first," check whether you mean "earlier by clock" or "an ancestor of," because on a branching history those are different questions with different answers.

## Related Notes

- [[cs/dsa/graphs|Graphs]] - the vertices-and-edges model the commit history literally is
- [[cs/dsa/topological-sorting|Topological Sorting]] - the algorithm `git log` runs to turn the DAG into lines
- [[cs/dsa/graph-traversals-bfs-dfs|Graph Traversals]] - reachability, which is what every revision range computes
- [[cs/software-engineering/git-objects-and-content-addressable-storage|Git Objects and Content-Addressable Storage]] - why the graph cannot contain a cycle
- [[cs/software-engineering/refs-and-branches-as-pointers|Refs and Branches as Pointers]] - the roots a traversal starts from
- [[cs/software-engineering/merge-vs-rebase|Merge vs Rebase]] - the two ways to add an edge when two lines of history rejoin
- [[cs/software-engineering/git-bisect-as-binary-search|Git Bisect as Binary Search]] - searching this graph instead of walking it
- [[cs/systems/logical-clocks-lamport-and-vector|Logical Clocks: Lamport and Vector]] - the same partial-order-versus-wall-clock argument in distributed systems
- [[cs/software-engineering/git-command-reference|Git Command Reference]] - the commands that write to and read from this graph

## Sources

- "gitglossary Documentation," Git. https://git-scm.com/docs/gitglossary . Supports the definition of the commit DAG (directed because commits have parents, acyclic because no chain begins and ends with the same object) and the description of the commit-graph file as a supplemental representation that accelerates commit graph walks.
- "git-log Documentation," Git. https://git-scm.com/docs/git-log . Supports the reachability definition of the revision range and its framing as a set operation, the default reverse-chronological ordering, the quoted guarantees of `--date-order` and `--topo-order`, and the worked eight-commit example with both output orders.

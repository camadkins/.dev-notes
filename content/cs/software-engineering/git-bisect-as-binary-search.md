---
title: Git Bisect as Binary Search
description: "git bisect is binary search with the sorted array replaced by a commit DAG. The sortedness precondition becomes monotonicity of the good and bad property along ancestry, and knowing where that assumption fails is the whole skill."
draft: false
comments: true
tags:
  - cs
  - software-engineering
  - algorithms
date: 2026-08-31
updated:
aliases: []
---

The manual does not bury it. `git bisect` "uses a binary search algorithm to find which commit" introduced a bug, and it is the one place in daily engineering where a first-year algorithms exercise shows up unmodified, does real work, and gets used by people who would not describe themselves as running an algorithm. It is worth taking the claim literally, because the parts that map exactly are the parts that make it fast, and the parts that do not map are exactly the parts that make it give wrong answers.

> [!note] The idea
> [[cs/dsa/binary-search|Binary search]] needs a sorted array so that testing the midpoint eliminates half the candidates. `git bisect` needs the same guarantee expressed over a [[cs/software-engineering/the-commit-dag|commit graph]] instead of an index range: **the bad property must be inherited by every descendant of the first commit that has it.** That is the DAG analogue of sortedness, it is an assumption about your project and not about git, and when it does not hold bisect still returns a commit with total confidence, in the same way binary search on an unsorted array returns an index.

## The predicate form is the bridge

The binary search note gives the generalization that makes the connection visible. Instead of searching a sorted array for a value, search for the first index at which a monotonic predicate becomes true:

```pseudo
function firstTrue(predicate, n):
    lo = 0
    hi = n
    while lo < hi:
        mid = lo + (hi - lo) // 2
        if predicate(mid):
            hi = mid
        else:
            lo = mid + 1
    return lo
```

with the stated requirement that `predicate(i)` be monotonic: `false, false, …, true, true, …`. That is `git bisect` with the names changed. The predicate is your test, `false` is `git bisect good`, `true` is `git bisect bad`, and the returned index is the first bad commit. Git even supports the general form directly: bisect "can be used to find the commit that changed any property of your project," and you can run `git bisect start --term-old fast --term-new slow` to hunt a performance regression, or `--term-new fixed --term-old broken` to find the commit that fixed something. Sortedness never mentioned bugs, and neither does bisect.

## What "sorted" means on a graph

An array has one axis, so monotonicity is a statement about an index. A commit history is a partial order, so the precondition has to be stated over ancestry, and git's own algorithm document states it: it supposes there is only one first bad commit, which means all of that commit's descendants are bad and every other commit is good.

Read that as the sortedness condition and everything lines up. In the array, `A[i]` false for all `i` below the answer and true for all `i` at or above it. In the graph, every commit that is not a descendant of the culprit is good, and every descendant is bad. Testing one commit therefore partitions the candidate set the same way testing `A[mid]` does, and for the same reason.

The candidate set is where the first difference appears. Binary search maintains `[lo, hi)`. Bisect maintains the analogous region by keeping only the commits that are ancestors of the bad commit (including it) and are not ancestors of any good commit (excluding the good commits themselves), which the document notes "is equivalent as keeping only the commit given by: git rev-list BAD --not GOOD1 GOOD2...". Every `git bisect good` or `git bisect bad` shrinks that set, exactly as an assignment to `lo` or `hi` shrinks the interval, and the [[cs/dsa/loop-invariant|loop invariant]] is the same shape: the first bad commit is always inside the current candidate set.

## Finding the midpoint is the hard part

An array midpoint is arithmetic. A graph has no midpoint, and git's documentation says so: "As the Git commits form a directed acyclic graph (DAG), finding the best bisection commit to test at each step is not so simple."

The algorithm it settles on, credited to Linus and later improved by Junio Hamano, is:

1. Reduce the graph to the candidate set described above.
2. Starting from the good ends, label each commit with its number of ancestors plus one. Call that `X`.
3. Relabel each commit `min(X, N - X)`, where `N` is the size of the candidate set.
4. Test the commit with the highest label.

Step three carries the whole idea, and it is not the obvious formula. The obvious one is `min(number_of_ancestors(X), number_of_descendants(X))`, on the reasoning that marking a commit good eliminates its ancestors and marking it bad eliminates its descendants. The first half is right; the second is wrong, and the document is explicit that `information_if_bad(X) = number_of_descendants(X)` is `(WRONG)` while `information_if_bad(X) = N - number_of_ancestors(X)` is `(TRUE)`. The reason is that step one already threw away everything that is not an ancestor of the current bad commit. So when a new bad commit is found, you learn not only that its descendants are bad, but that every candidate outside its ancestry cannot be the first bad commit at all. Marking bad is worth more than the naive count suggests, and the correct objective is to maximize `f(X) = min(number_of_ancestors(X), N - number_of_ancestors(X))`.

There is one optimization, and it is the same one you would write: since `min(X, N - X)` can never exceed `N/2`, the search stops the moment a commit hits `N/2`.

> [!example] The graph where the two formulas disagree
> The documentation works this example, with `A` the good end and `O` the bad tip:
>
> ```
>          G-H-I-J
>         /       \
> A-B-C-D-E-F      O
>         \       /
>          K-L-M-N
> ```
>
> The naive `g(X) = min(ancestors, descendants)` scores `F` highest at 6. Git's `f(X)` scores `G`, `H`, `K`, and `L` at 7. Picking `L` is better "because if for example L is bad, then we will know not only that L, M and N are bad but also that G, H, I and J are not the first bad commit," since a single first bad commit must be an ancestor of any commit that tests bad. Testing on the mainline before the fork looks like the balanced choice and is not.

## Complexity, and where the log stops holding

Each answer removes at least the winning commit's score from the candidate set, so a well-shaped history halves and the cost is [[cs/dsa/asymptotic-notation|logarithmic]] in the number of commits. Git shows its own estimate as it goes, printing `Bisecting: 675 revisions left to test after this (roughly 10 steps)` and then `Bisecting: 337 revisions left to test after this (roughly 9 steps)`. Ten tests over roughly a thousand commits is the same arithmetic as ten probes over a thousand-element array, and it is the reason bisect turns an afternoon into ten minutes.

The bound is best-case-shaped, though, and the DAG is where it degrades. Because the objective is capped at `N/2` and achieved only when some commit actually has about half the candidate set as ancestors, a wide history with many short parallel branches has no such commit, and each step removes less than half. A long linear history bisects at the textbook rate; a history that is mostly merges of many small branches does not. This is one more reason the [[cs/software-engineering/merge-vs-rebase|merge versus rebase]] choice has a downstream cost rather than only a look.

## Where the precondition breaks

Binary search on unsorted data does not error; it returns a plausible index. Bisect behaves identically, and every failure mode below is a violation of monotonicity rather than a bug in git.

**The bug was introduced, fixed, and reintroduced.** Now the good and bad property is not inherited along ancestry, there is more than one first bad commit, and the single-culprit supposition the algorithm is built on is false. Bisect will converge and name a commit. Which one it names depends on the path it took. This is the most common way a bisect result is confidently wrong, and the tell is a result that makes no sense when you read the diff.

**The test is flaky.** The predicate has to be a function of the commit. A test that fails one run in three is `A[mid]` returning a different value on each read, and no search algorithm survives that. Run the test enough times per step to make the answer deterministic, or fix the flake first.

**The commit does not build.** Arrays have no third state; histories do. A commit that cannot be compiled is neither good nor bad, which is why `git bisect skip` exists and why the skip case runs a different algorithm. The manual is honest about the cost: "if you skip a commit adjacent to the one you are looking for, Git will be unable to tell exactly which of those commits was the first bad one." A history full of unbuildable intermediate commits does not merely slow bisect down, it can make the answer unavailable.

**The regression came in through a merge.** A conflict resolution exists in the merge commit and in neither parent, so the property genuinely first appears at the merge, and a branch merged weeks after it was written puts the breakage at a mainline position that has nothing to do with when it was written. `git bisect --first-parent` follows "only the first parent commit upon seeing a merge commit," which treats each merge as one atomic change and, in the manual's words, is "particularly useful in avoiding false positives when a merged branch contained broken or non-buildable commits, but the merge itself was OK."

## Automating the predicate

Once the predicate is a script, the search should not involve you. `git bisect run <cmd>` drives the whole loop, with an exit-code protocol that encodes the three-valued answer: the command "should exit with code 0 if the current source code is good/old, and exit with a code between 1 and 127 (inclusive), except 125, if the current source code is bad/new," and "The special exit code 125 should be used when the current source code cannot be tested," which triggers a skip. The documented pattern for a broken build is one line:

```sh
make || exit 125   # this skips broken builds
```

> [!tip] The algorithm is free; the predicate is the work
> Nothing in a bisect session is hard except deciding what question to ask, and the quality of the answer is entirely the quality of the test. A precise, fast, deterministic reproduction turns a regression hunt into ten mechanical steps. A vague one ("the app feels wrong") violates monotonicity before you start. This is the same observation the [[cs/software-engineering/testing-strategies|testing strategy]] argument makes from the other direction: a suite whose failures are specific and reproducible is worth more than a suite that is merely large, and bisect is one of the places that value gets cashed in.

## Related Notes

- [[cs/dsa/binary-search|Binary Search]] - the algorithm this is, including the monotone-predicate form that generalizes it off arrays
- [[cs/dsa/loop-invariant|Loop Invariant]] - the property both searches maintain, stated over an interval or over a candidate set
- [[cs/dsa/divide-and-conquer|Divide and Conquer]] - the family the halving argument belongs to
- [[cs/dsa/graphs|Graphs]] - why the midpoint needs an algorithm instead of arithmetic
- [[cs/software-engineering/the-commit-dag|The Commit DAG]] - the structure being searched
- [[cs/software-engineering/merge-vs-rebase|Merge vs Rebase]] - the history-shape decision that determines how well bisect works
- [[cs/software-engineering/testing-strategies|Testing Strategies]] - where the predicate comes from
- [[cs/software-engineering/git-command-reference|Git Command Reference]] - the rest of the commands, grouped by what they write

## Sources

- "git-bisect Documentation," Git. https://git-scm.com/docs/git-bisect . Supports the description of bisect as using a binary search algorithm, its generalization to finding the commit that changed any property of the project and the `--term-old`/`--term-new` mechanism with the fast/slow and fixed/broken examples, the progress output showing 675 and 337 revisions remaining with roughly 10 and 9 steps, the warning that skipping a commit adjacent to the culprit leaves git unable to say which was the first bad one, the `--first-parent` option and its stated usefulness against false positives from broken commits inside a merged branch, and the `git bisect run` exit-code protocol including the special meaning of 125 and the `make || exit 125` pattern.
- "git-bisect-lk2009 Documentation," Git. https://git-scm.com/docs/git-bisect-lk2009 . Supports the statement that finding the best bisection commit on a DAG is not simple, the attribution to Linus with later improvement by Junio Hamano, the four-step algorithm (restrict to ancestors of bad that are not ancestors of good, label with ancestor count plus one, take `min(X, N - X)`, choose the maximum), the equivalence of step one to `git rev-list BAD --not GOOD1 GOOD2...`, the `N/2` shortcut, the supposition of a single first bad commit whose descendants are all bad, the derivation showing `information_if_bad(X) = number_of_descendants(X)` is wrong and `N - number_of_ancestors(X)` is right, and the fifteen-commit worked example in which the naive formula picks `F` while the git formula picks among `G`, `H`, `K`, and `L`.

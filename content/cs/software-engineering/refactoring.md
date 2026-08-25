---
title: Refactoring
description: "Refactoring is not a synonym for cleanup. It is a specific technique built from small behavior-preserving transformations, with a hard constraint: the system stays working the whole way through."
draft: false
comments: true
tags:
  - cs
  - software-engineering
date: 2026-06-03
updated:
aliases:
  - Refactor
  - Behavior-Preserving Transformation
  - Refactoring Catalog
---

Most people use "refactoring" to mean "changing code without adding features." Martin Fowler, who documented the technique and wrote its catalog, spends a fair amount of effort arguing that this usage is wrong, and the argument is worth following because the precision is where the technique's value comes from.

His definition is narrow on purpose. Refactoring is "a disciplined technique for restructuring an existing body of code, altering its internal structure without changing its external behavior." **Restructuring** is the general activity, "any rearrangement of parts of a whole," and it "doesn't imply any particular way of doing the restructuring." Refactoring is one specific way of doing it.

> [!note] The idea
> The load-bearing constraint is not that behavior is preserved at the end. It is that behavior is preserved at *every step*, because the unit of work is a small named transformation rather than an edit session. Fowler's test for whether you are actually refactoring is a stopwatch: "If you are doing refactoring your system should not be broken for more than a few minutes at a time." A restructuring that leaves the build red for two days is a rewrite wearing the word as a costume.

## Small steps compose

The mechanism is deliberately unglamorous. Refactoring's "heart is [[cs/pl/operational-semantics-big-step-small-step|a series of small behavior preserving transformations]]. Each transformation (called a 'refactoring') does little, but a sequence of these transformations can produce a significant restructuring."

Two properties follow, and they are the whole argument for working this way. First, "since each refactoring is small, it's less likely to go wrong." Second, "the system is kept fully working after each refactoring, reducing the chances that a system can get seriously broken during the restructuring." You are trading a single large risky jump for a long series of individually verifiable ones, and paying for it in ceremony.

This is also why the technique needs well-defined behavior to operate on. Fowler notes he cannot see how you would refactor "something that doesn't have a well defined behavior," which rules out things people casually claim to refactor. Restructuring a document, in his framing, is not refactoring.

## The catalog

A refactoring is a *named* transformation, not an improvisation, and the naming is what makes the practice teachable. The online catalog backing the second edition of the book lists them individually, each with a sketch and the aliases from earlier editions: Extract Function (formerly Extract Method), Inline Function, Extract Variable (formerly Introduce Explaining Variable), Change Function Declaration (which absorbs Add Parameter, Remove Parameter, and Rename Function), Move Function, Encapsulate Variable, [[cs/pl/objects-classes-and-dispatch|Replace Conditional with Polymorphism]], Remove Dead Code, Pull Up Method, Push Down Field.

The catalog is grouped by keyword tags that read like a map of what goes wrong in codebases: `basic`, `encapsulation`, `moving-features`, `organizing-data`, `simplify-conditional-logic`, `refactoring-apis`, `dealing-with-inheritance`.

Having a catalog entry changes the conversation. "Extract Function on the validation block, then Move Function onto the Order class" is a reviewable plan with known mechanics and a known safety profile. "I cleaned up the order code" is not.

> [!example] Where refactoring sits in a normal day
> Fowler's account is that refactoring "isn't a special task that would show up in a project plan," and it brackets feature work on both sides.
>
> **Before:** "When I need to add a new feature to a codebase, I look at the existing code and consider whether it's structured in such a way to make the new change straightforward. If it isn't, then I refactor the existing code to make this new addition easy." His claim is that this is usually *faster* than skipping the preparation.
>
> **After:** having added the feature and got it working, "I often notice that the resulting code, while it works, isn't as clear as it could be. I then refactor it into a better shape so that when I (or someone else) return to this code in a few weeks time, I won't have to spend time puzzling out how this code works."
>
> **While reading:** "If I struggle to understand this code, I refactor it so I won't have to struggle again next time I look at it."

## What makes the steps safe

Behavior preservation is a claim, and a claim needs evidence. Two things supply it.

Automated refactoring tools, now built into most IDEs, perform many common transformations mechanically. Fowler calls these "a really valuable part of my toolkit allowing me to carry out refactoring faster," while being clear they are not the foundation: "such tools aren't essential." He works regularly in languages without tool support.

What he falls back on in those languages is the actual foundation: "I rely on taking small steps, and using frequent testing to detect mistakes." That is the pairing that makes the whole practice work. Small steps bound how much can be wrong at once; a fast test suite tells you within seconds which step broke it. Neither is sufficient alone. Small steps without tests just means you find the breakage later with no idea which of forty steps caused it, and a good test suite without small steps still leaves you [[cs/dsa/binary-search|bisecting a large diff]].

## The economic case

The reason to do any of this is stated as a cost argument, not an aesthetic one. Successful software keeps needing enhancement, "but the nature of a code-base makes a big difference on how easy it is to make these changes. Often enhancements are applied on top of each other in a manner that makes it increasingly harder to make changes. Over time new work slows to a crawl."

Refactoring is the countermeasure to that specific drift, applied continuously so that "added enhancements don't lead to unnecessary complexity." This is the same ledger [[cs/software-engineering/technical-debt|technical debt]] describes from the finance side: refactoring is the operation that pays down principal, and the reason it belongs in day-to-day work rather than a quarterly cleanup sprint is that interest only accrues where you are actually working.

> [!tip]
> Fowler is careful to disclaim authorship: "I'm not the father or the inventor of refactoring, just a documenter." That is a useful frame for the catalog too. It is not a set of rules someone designed, it is a written-down record of moves practitioners were already making, which is why the entries feel obvious once named and were nearly impossible to teach before they were.

## Related Notes

- [[cs/software-engineering/technical-debt|Technical Debt]] - refactoring is how principal gets paid down
- [[cs/software-engineering/testing-strategies|Testing Strategies]] - the fast test suite that makes small steps verifiable
- [[cs/software-engineering/design-patterns|Design Patterns]] - frequently the target shape a sequence of refactorings moves toward
- [[cs/software-engineering/code-review|Code Review]] - named refactorings make a large diff reviewable
- [[cs/software-engineering/version-control-fundamentals|Version Control Fundamentals]] - small commits mirror small transformations

## Sources

- "Refactoring," Martin Fowler. https://refactoring.com/ . Supports the definition of refactoring as a disciplined technique altering internal structure without changing external behavior; the series of small behavior-preserving transformations, each less likely to go wrong, with the system kept fully working after each one; the cost-of-enhancement argument about work slowing to a crawl; refactoring as a day-to-day activity done before adding a feature, after getting it working, and while struggling to read code; and automated tools being valuable but not essential, with small steps plus frequent testing as the fallback.
- "Catalog of Refactorings," Martin Fowler. https://refactoring.com/catalog/ . Supports the existence of the online catalog for the second edition, the named refactorings and their first-edition aliases cited here, and the keyword tag groupings.
- "Refactoring Malapropism," Martin Fowler. https://martinfowler.com/bliki/RefactoringMalapropism.html . Supports the distinction between restructuring as the general activity and refactoring as one specific technique, the claim that a system being broken for days means you are not refactoring, the few-minutes-at-a-time constraint, the requirement of well-defined behavior, the point that refactoring a document is not refactoring, and Fowler describing himself as a documenter rather than the inventor.

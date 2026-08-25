---
title: SOLID Principles
description: "Five design principles with one shared enemy: code that resists change. Each names a specific way a class becomes expensive to modify, and each is routinely misread as a rule about size."
draft: false
comments: true
tags:
  - cs
  - software-engineering
date: 2026-02-19
updated:
aliases:
  - SOLID
  - Single Responsibility Principle
  - Open-Closed Principle
  - Liskov Substitution Principle
  - Interface Segregation Principle
  - Dependency Inversion Principle
---

SOLID is a mnemonic acronym for five principles "intended to make source code more understandable, flexible, and maintainable." The five did not arrive as a set. Robert C. Martin "introduced the basic principles of SOLID design in his 2000 paper *Design Principles and Design Patterns* about software rot," and the acronym itself "was coined around 2004 by Michael Feathers." Two different people, four years apart. That the letters spell a word is a teaching artifact bolted onto principles that already existed independently, and one of the five, the L, comes from a 1987 keynote by someone with no connection to the acronym at all.

> [!note] The idea
> Every one of the five is a statement about the *cost of a future change*, not about the shape of present code. The single responsibility principle counts reasons to change. The open-closed principle asks whether extension requires modification. Liskov substitution asks whether a caller's assumptions survive a swap. Interface segregation asks whether a client is dragged along by changes it does not use. Dependency inversion asks which direction a change propagates through layers. Read them as size rules ("small classes, small interfaces") and you get the metrics without the benefit, because none of the five mentions size.

## The five, as stated

| Letter | Principle | Statement |
|---|---|---|
| S | Single responsibility | "There should never be more than one reason for a class to change." |
| O | Open-closed | "Software entities should be open for extension, but closed for modification." |
| L | Liskov substitution | Functions using pointers or references to base classes "must be able to use pointers or references of derived classes without knowing it." |
| I | Interface segregation | "Clients should not be forced to depend upon interface methods that they do not use." |
| D | Dependency inversion | "One should depend upon abstractions, not concretes." |

The stated benefits cluster. SRP is credited with maintainability, testability, and flexibility, since "changes to one responsibility don't affect unrelated parts of the system." OCP buys extensibility and stability, reducing "the risk of introducing bugs when making changes." ISP is a decoupling move, cutting "dependencies between classes, making the code more modular and maintainable." DIP is explicitly about loose coupling. Four of the five, in other words, are [[cs/software-engineering/coupling-and-cohesion|coupling and cohesion]] arguments wearing object-oriented clothes, which is not an accident of framing: Martin described SRP "as being based on the principle of cohesion, as described by Tom DeMarco in his book *Structured Analysis and System Specification*, and Meilir Page-Jones in *The Practical Guide to Structured Systems Design*."

## S: the word "responsibility" caused the trouble

The canonical example is a module that compiles and prints a report. It can change for two reasons: the content of the report could change, or the format could. "These two things change for different causes," so SRP says they are two responsibilities and belong in separate classes. The failure mode is concrete rather than aesthetic. If compilation and printing share a class, "if there is a change to the report compilation process, there is a greater danger that the printing code will break."

The word "reason" turned out to be too loose, and Martin spent years correcting the reading. In 2014 he wrote a post whose stated goal was "to clarify what was meant by the phrase 'reason for change'," landing on a formulation that is about grouping rather than splitting: "Gather together the things that change for the same reasons. Separate those things that change for different reasons." Later still the principle got restated in terms of people: "A module should be responsible to one, and only one, actor," where an actor is "a group (consisting of one or more stakeholders or users) that requires a change in the module." He illustrates it with roles, not tasks, since "while they might be the same person, the role of an accountant is different from a database administrator."

> [!warning] SRP does not say "a class should do one thing"
> That reading produces classes with one method and a codebase you cannot navigate. The actual test is social: who asks for the change? Two methods requested by the same actor for the same reasons belong together, however different they look. Two methods requested by accounting and by operations belong apart, however similar they look. The 2014 clarification is half a *gathering* instruction, and that half is the one that gets dropped.

## L: substitutability is semantic, and undecidable

The L is the only letter with an independent formal pedigree. Liskov substitution "is [[cs/pl/subtyping-variance-type-constraints|a particular definition of a subtyping relation]], called strong behavioral subtyping, that was initially introduced by Barbara Liskov in a 1987 conference keynote address titled *Data abstraction and hierarchy*." Liskov and Jeannette Wing gave it a compact statement in a 1994 paper: "Let *phi(x)* be a property provable about objects *x* of type T. Then *phi(y)* should be true for objects *y* of type S where S is a subtype of T."

The point of the formulation is that it is "a semantic rather than merely syntactic relation." Behavioral subtyping "is a stronger notion than typical subtyping of functions defined in type theory, which relies only on the contravariance of parameter types and covariance of the return type." A compiler checks the syntactic half. The semantic half it cannot check, and not for want of effort: behavioral subtyping "[[cs/history/turing-and-computability|is undecidable in general]]," since a property like "this method always terminates" cannot be verified for an arbitrary subtype. The principle is a reasoning tool for humans designing hierarchies, not a check a build can run.

The obligations it imposes go beyond signatures. [[cs/languages/Racket/contracts-and-blame|Preconditions "cannot be strengthened in the subtype,"]] postconditions "cannot be weakened," invariants "cannot be weakened," and new exceptions cannot be thrown unless they are subtypes of ones the supertype already throws. Then there is the history constraint, "the novel element introduced by Liskov and Wing," which forbids a subtype from allowing state changes the supertype does not permit. Its canonical violation is "defining a *mutable point* as a subtype of an *immutable point*." This is precisely where the earlier accounts fell short: under Meyer's and Pierre America's definitions "a mutable point would be a behavioral subtype of an immutable point, whereas Liskov substitution principle forbids this," and the improvement came from taking aliasing into account.

> [!example] Square is not a Rectangle
> Give `Rectangle` virtual `setWidth` and `setHeight`, then make `Square` a subclass whose setters write both dimensions to keep the invariant. The `is-a` relationship holds in English and the compiler is satisfied. Now a caller:
>
> ```cpp
> void g(Rectangle& r) {
>     r.setWidth(5); r.setHeight(4);
>     assert(r.getArea() == 20); // assertion will fail
> }
> ```
>
> The subclass is substitutable syntactically and not semantically, so LSP is violated "even though the is-a relationship holds between `Rectangle` and `Square`."
>
> The sharper reading is that the blame is negotiable. If a shape's type is only "a constraint on the relationship of its dimensions," then `g`'s assumption "that `setHeight()` will change height, and area, but not width is invalid" in the first place, and that assumption is broken "not only for squares, but even potentially for other rectangles that might be coded to preserve area or aspect ratio when height changes." The violation lives in the mismatch between a subtype's behavior and a caller's unwritten expectations. Which side you call wrong depends on which contract you meant to publish.

## I and D: two different arguments that both end in "interface"

The last two letters are easy to conflate because both are satisfied by writing an interface, and they are aimed at opposite ends of the same dependency edge.

Interface segregation constrains the *shape* of what a client depends on: "clients should not be forced to depend upon interface methods that they do not use." The cost of violating it is transitive. A client that names a fat interface is coupled to every method on it, so a change made for some other client's method still forces the first client to recompile, retest, and possibly break. The listed benefits follow directly: decoupling, "more targeted implementations of interfaces," and clients that "don't have to depend on methods they don't use."

Dependency inversion constrains the *direction* of the edge: "one should depend upon abstractions, not concretes." Its stated payoff is loose coupling, which "reduces dependencies between modules, making the code more flexible and easier to test," plus the ability to change an implementation "without affecting clients."

So ISP is about splitting an abstraction that grew too wide, and DIP is about which side of a layer boundary the abstraction sits on. Both fail the same way in practice, which is that adding an interface with exactly one production implementation satisfies neither principle. A one-to-one interface does not segregate anything (no client was carrying methods it did not use) and inverts nothing (the dependency still points at the same concrete design, now with an extra file in between). Both principles are claims about relationships between modules. Neither is satisfied by a syntactic move inside one.

## What holds them together

SOLID is scoped to object-oriented and functional programming, and the principles "also form a core philosophy for methodologies such as agile software development and adaptive software development." The through line is the paper that started it: *software rot*. Each principle isolates one mechanism by which a working system becomes progressively harder to change, and each proposes a structural constraint that raises today's design cost to lower tomorrow's modification cost. That trade is the whole content. Applied where change is not actually coming, every one of the five is [[cs/software-engineering/technical-debt|overhead]].

## Related Notes

- [[cs/software-engineering/coupling-and-cohesion|Coupling and Cohesion]] - the older, more general framing that SRP was explicitly built on
- [[cs/software-engineering/design-patterns|Design Patterns]] - the catalog these principles are usually taught alongside
- [[cs/software-engineering/refactoring|Refactoring]] - the operation you perform when a principle is being violated
- [[cs/software-engineering/software-architecture|Software Architecture]] - dependency inversion is a layering decision before it is a class decision
- [[cs/software-engineering/technical-debt|Technical Debt]] - software rot is the failure mode all five are aimed at
- [[cs/pl/subtyping-variance-type-constraints|Subtyping, Variance, and Type Constraints]] - the variance rules LSP strengthens
- [[cs/pl/objects-classes-and-dispatch|Objects, Classes, and Dispatch]] - the inheritance machinery these principles constrain

## Sources

- "SOLID," Wikipedia. https://en.wikipedia.org/wiki/SOLID . Supports SOLID as a mnemonic acronym for five principles making source code more understandable, flexible, and maintainable; its application to object-oriented and functional programming and to agile and adaptive software development; Robert C. Martin introducing the basic principles in his 2000 paper *Design Principles and Design Patterns* about software rot; the acronym being coined around 2004 by Michael Feathers; and the canonical statement plus listed importance of each of the five principles (single responsibility, open-closed, Liskov substitution, interface segregation, dependency inversion).
- "Single-responsibility principle," Wikipedia. https://en.wikipedia.org/wiki/Single-responsibility_principle . Supports the actor formulation and the definition of an actor; Martin's original "one reason to change" phrasing and his 2014 blog post clarifying it; the gather-together/separate wording; the accountant versus database administrator role illustration; SRP being based on cohesion as described by Tom DeMarco and Meilir Page-Jones; and the report compilation/formatting example including the risk that printing code breaks when compilation changes.
- "Liskov substitution principle," Wikipedia. https://en.wikipedia.org/wiki/Liskov_substitution_principle . Supports LSP as strong behavioral subtyping introduced by Barbara Liskov in a 1987 keynote titled *Data abstraction and hierarchy*; the Liskov and Wing 1994 subtype requirement statement; the semantic-not-syntactic character and the comparison with contravariance/covariance subtyping; general undecidability of behavioral subtyping; the precondition, postcondition, invariant, and exception rules; the history constraint as Liskov and Wing's novel element and the mutable-point/immutable-point violation; the contrast with Meyer's and Pierre America's definitions and the aliasing improvement; and the Rectangle/Square example including the failing assertion in `g` and the argument that the caller's assumption may itself be invalid.

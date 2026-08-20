---
title: Coupling and Cohesion
description: "Two ordinal scales invented by Larry Constantine in the late 1960s to explain why some code is expensive to change. They are not independent axes, and neither one is minimizable on its own."
draft: false
comments: true
tags:
  - cs
  - software-engineering
date: 2026-05-06
updated:
aliases:
  - Coupling
  - Cohesion
  - Loose Coupling
  - High Cohesion
  - Connascence
---

Draw a box around any piece of a system and two questions immediately follow. What is inside, and how much does it belong together? What crosses the boundary, and how strongly does it bind? Those are cohesion and coupling, and they were invented together for exactly that reason.

Coupling is "the degree of interdependence between software modules, a measure of how closely connected two routines or modules are." Cohesion is "the degree to which the elements inside a module belong together." Both are ordinal measures, usually stated as high or low, and both were "invented by Larry Constantine in the late 1960s as part of a structured design, based on characteristics of 'good' programming practices that reduced maintenance and modification costs." They were published in the 1974 article by Stevens, Myers, and Constantine and in the 1979 Yourdon and Constantine book, and became standard terms afterward.

> [!note] The idea
> The pair is not two independent dials you can set separately. "Low coupling often correlates with high cohesion, and vice versa," and the reason is mechanical: cohesion is what you *keep* inside the box, and everything you fail to keep inside becomes an edge crossing the boundary. Pull a module apart to make each piece more focused and you manufacture coupling between the pieces. Push everything into one module to eliminate coupling and you destroy cohesion. Neither quantity is separately minimizable, which is why the design goal is stated as a pair and why the useful work is choosing *where* the boundary goes, not whether it exists.
>
> Wikipedia makes this explicit at the limit. A module can achieve perfect cohesion by containing a single atomic element, but "in practice complex tasks are not expressible by a single, simple element," so a single-element module ends up "either too complicated to accomplish a task, or too narrow and thus tightly coupled to other modules." Cohesion "is balanced with both unit complexity and coupling."

## Coupling, ranked

Coupling is "not binary but multi-dimensional." The classic ranking, from highest (worst) to lowest, comes out of structured design and still describes most of what goes wrong:

| Type | What is shared | Why it hurts |
|---|---|---|
| **Content** | One module uses the code of another, "for instance a branch." | Violates information hiding outright. |
| **Common** | "Several modules have access to the same global data." | Leads to "uncontrolled error propagation and unforeseen side-effects when changes are made." |
| **External** | An externally imposed data format, communication protocol, or device interface. | Change is not yours to make. |
| **Control** | "One module controlling the flow of another, by passing it information on what to do." | A what-to-do flag means the caller knows the callee's internal branches. |
| **Stamp** | A composite data structure of which the callee uses only parts. | See below. |
| **Data** | Elementary data through parameters, and nothing else. | The floor. Passing an integer to a square-root function. |

Stamp coupling deserves its own look because it is the one that hides in reasonable-looking code. A module passes a whole record to a function that needs one field, and now "a modification in a field that a module does not need may lead to changing the way the module reads the record." Wikipedia's scaled-up version is a `UserProfile` component "designed to return the entire user profile information in response to requests, even when consumers only require a specific attribute." Two costs follow, one obvious and one not. The bandwidth waste is visible. The invisible cost is that "when any attribute within the `UserProfile` component changes, all consumers that interact with it may need to undergo testing, even if they do not utilize the modified attribute." You have coupled your test burden to fields nobody reads.

Object-oriented code adds two more. Subclass coupling "describes the relationship between a child and its parent," and note the asymmetry: "the child is connected to its parent, but the parent is not connected to the child." Temporal coupling is "when two actions are bundled together into one module just because they happen to occur at the same time," which is the same thing that temporal cohesion names from inside the box.

Three further flavors show up in measurement work rather than design vocabulary. Dynamic coupling exists because "static coupling metrics lose precision when dealing with an intensive use of dynamic binding or inheritance," so it evaluates at runtime. Semantic coupling looks at "conceptual similarities between software entities using, for example, comments and identifiers," leaning on techniques like latent semantic indexing. And logical coupling, also called evolutionary or change coupling, "exploits the release history of a software system to find change patterns among modules or classes," finding entities likely to change together. That last one is worth sitting with. It measures coupling from version-control history rather than from source code, which means it detects the dependencies your architecture diagram does not know about.

The consequences of tight coupling are stated plainly: "a change in one module usually forces a ripple effect of changes in other modules," assembly takes more effort and time, and "a particular module might be harder to reuse and/or test because dependent modules must be included."

## Cohesion, ranked

Cohesion has a parallel ladder, worst to best, and it classifies modules by *what justified the grouping*:

- **Coincidental** (worst): "parts of a module are grouped arbitrarily. The only relationship between the parts is that they have been grouped together," the canonical instance being a `Utilities` class.
- **Logical**: parts "grouped because they are logically categorized to do the same thing even though they are different by nature," like all input handling routines together, or bundling all models, views, and controllers into separate folders.
- **Temporal**: grouped "according to the time in which they are processed," for example a post-exception handler that closes files, writes a log, and notifies the user.
- **Procedural**: grouped "because they always follow a certain sequence of execution," like checking file permissions then opening the file.
- **Communicational / informational**: grouped "because they operate on the same data."
- **Sequential**: grouped "because the output from one part is the input to another part like an assembly line."
- **Functional** (best): grouped "because they all contribute to a single well-defined task of the module," such as lexical analysis of an XML string.

> [!warning] The ladder is not evenly spaced
> This is the detail that gets lost when the list is memorized. "Although cohesion is a ranking type of scale, the ranks do not indicate a steady progression of improved cohesion." Studies by Constantine, Yourdon, and Steve McConnell "indicate that the first two types of cohesion are inferior, communicational and sequential cohesion are very good, and functional cohesion is superior." So the practical read is a cliff, not a slope: coincidental and logical cohesion are the ones to hunt down, and communicational already buys you most of the benefit. Grinding a communicational module toward functional purity is a much smaller win than the ranking's ordinal appearance suggests.
>
> Note also what the logical-cohesion example implicates. Bundling all models, views, and controllers into their own folders is *logical* cohesion, second from the bottom. The folder layout most web frameworks ship by default is, by this taxonomy, a weak grouping.

The advantages of high cohesion track the same maintenance argument: reduced module complexity, increased maintainability "because logical changes in the domain affect fewer modules, and changes in one module require fewer changes in other modules," and increased reusability because developers "will find the component they need more easily among the cohesive set of operations."

## What low coupling actually means

The definition is about knowledge, not about call counts. "Low coupling refers to a relationship in which one module interacts with another module through a simple and stable interface and does not need to be concerned with the other module's internal implementation." Both adjectives carry weight. Simple bounds how much passes through. Stable bounds how often what passes through changes. An interface can be enormous and still be low coupling if it never moves; a two-method interface that changes every sprint is not.

Coupling increases between classes `A` and `B` if `A` has an attribute of type `B`, calls services of a `B`, has a method referencing `B` via return type or parameter, or is a subclass of (or implements) `B`. One approach to decreasing it is functional design, "which seeks to limit the responsibilities of modules along functionality," which is the same instinct the [[solid-principles|single responsibility principle]] later formalized. Martin's SRP was explicitly built on this cohesion literature.

Coupling can also be scored. Pressman's metric combines input and output data parameters, input and output control parameters (weighted double), global variables used as data and as control (control again doubled), plus fan-out and fan-in:

$$\mathrm{Coupling}(C) = 1 - \frac{1}{d_{i} + 2 c_{i} + d_{o} + 2 c_{o} + g_{d} + 2 g_{c} + w + r}$$

The number "ranges from approximately 0.67 (low coupling) to 1.0 (highly coupled)." A module with a single input and a single output data parameter and one call scores 0.67. A module with five input and five output data parameters, an equal number of control parameters, ten globals, fan-in 3 and fan-out 4 scores 0.98. The compression at the top is the honest signal here: past a certain point the metric saturates and stops discriminating, which is a fair description of what tight coupling does to your ability to reason about the module at all.

## Connascence: coupling with the change question built in

Coupling tells you what two components share. It is weaker at telling you how much a change will hurt. Connascence, "introduced by Meilir Page-Jones," is the framework that adds that dimension, evaluating dependencies on three axes: strength, "which measures the effort required to refactor or modify the dependency"; locality, "which considers how physically or logically close dependent components are in the codebase"; and degree, "which measures how many components are affected."

It splits into static forms detectable at compile time, "such as method signatures," and dynamic forms detectable at runtime, "which can manifest in forms like connascence of timing, values, or algorithm." Common types include connascence of name, type, position, and meaning, and they are not equally severe. Depending on parameter order gives connascence of position, "which is fragile and difficult to refactor because reordering parameters breaks the interface," while connascence of name, resting on field or parameter names, "is generally more resilient to change." The types form "a natural hierarchy of strength, with connascence of name typically considered weaker than connascence of meaning."

The two frameworks compose rather than compete. "Coupling identifies what is shared between components, connascence evaluates how those dependencies behave, how changes propagate, and how difficult they are to refactor." Data coupling, for instance, "often involves connascence of name or type." And the axes interact: "dependencies with high strength, wide scope, and spanning distant boundaries are significantly harder to refactor and maintain," which is why dependencies crossing module or distributed-system boundaries carry higher coordination costs.

> [!tip] Locality is why the same dependency has two different prices
> Two functions in one file sharing an implicit assumption is a bad smell you can fix in an afternoon. The same assumption shared across a service boundary is a coordinated multi-team release. Identical coupling type, identical strength, wildly different cost, and the only variable is locality. This is the concrete reason [[cs/systems/virtualization-vms-and-containers|distributed]] architectures are unforgiving: they take dependencies that were cheap because they were local and stretch them across a boundary where every one of them now needs a versioning story.

## Related Notes

- [[solid-principles|SOLID Principles]] - SRP was explicitly built on the cohesion work of DeMarco and Page-Jones
- [[software-architecture|Software Architecture]] - module boundaries are where these two forces get traded off
- [[refactoring|Refactoring]] - the operation that moves elements across boundaries to fix a bad grouping
- [[design-patterns|Design Patterns]] - most patterns are named coupling-reduction moves
- [[technical-debt|Technical Debt]] - coincidental cohesion and common coupling are how debt accumulates structurally
- [[api-design|API Design]] - a published interface is a coupling contract you cannot unilaterally change
- [[cs/pl/modules-signatures-and-separate-compilation|Modules, Signatures, and Separate Compilation]] - the language-level machinery for enforcing a boundary

## Sources

- "Coupling (computer programming)," Wikipedia. https://en.wikipedia.org/wiki/Coupling_%28computer_programming%29 . Supports the definition of coupling and its multi-dimensional (non-binary) character; the correlation between low coupling and high cohesion; the invention by Larry Constantine in the late 1960s as part of structured design and the 1974 Stevens/Myers/Constantine article plus 1979 Yourdon and Constantine book; the ranked list of content, common, external, control, stamp, and data coupling with their definitions; the stamp-coupling `UserProfile` example including the testing burden on consumers that do not use a changed attribute; subclass coupling and its asymmetry; temporal coupling; dynamic, semantic, and logical/evolutionary/change coupling; the three disadvantages of tight coupling; the definition of low coupling as interacting through a simple and stable interface without concern for internal implementation; functional design and the four ways coupling increases between classes A and B; the Pressman coupling metric formula, its approximate 0.67 to 1.0 range, and the two worked values; and the connascence framework attributed to Meilir Page-Jones including strength, locality, degree, static versus dynamic forms, connascence of position versus name, the strength hierarchy, and the relationship between coupling and connascence.
- "Cohesion (computer science)," Wikipedia. https://en.wikipedia.org/wiki/Cohesion_%28computer_science%29 . Supports the definition of cohesion as the degree to which elements inside a module belong together; cohesion as an ordinal measure with high cohesion associated with robustness, reliability, reusability, and understandability; the contrast with coupling and the correlation between high cohesion and loose coupling; the Constantine/structured-design origin and 1974 and 1979 publications; the advantages of high cohesion (reduced complexity, maintainability, reusability); the argument that a single-element module is either too complicated or too narrow and tightly coupled, so cohesion is balanced against unit complexity and coupling; the full ranked list of cohesion types from coincidental to functional with their definitions and examples (including the Utilities class, the MVC folder example under logical cohesion, and the post-exception handler under temporal cohesion); and the finding by Constantine, Yourdon, and McConnell that the ranks are not a steady progression, with the first two inferior, communicational and sequential very good, and functional superior.

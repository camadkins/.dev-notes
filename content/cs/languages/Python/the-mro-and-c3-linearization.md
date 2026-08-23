---
title: The MRO and C3 Linearization
description: "The merge algorithm that turns an inheritance graph into a single lookup order, the monotonicity property it guarantees, and why some class hierarchies are simply rejected."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-06-24
updated:
aliases:
  - Method Resolution Order
  - C3 Linearization
  - Python MRO
---

Single inheritance makes attribute lookup trivial. Walk up the parent chain until something matches. Multiple inheritance destroys that, because there is no chain, only a directed acyclic graph, and a lookup has to visit its nodes in *some* order. Python's answer since 2.3 is to flatten the graph once at class creation and store the result. As the HOWTO defines it, the list of the ancestors of a class C, including the class itself, ordered from the nearest ancestor to the furthest, is called the class precedence list or the linearization of C, and the Method Resolution Order is the set of rules that construct the linearization.

> [!note] The idea
> C3 is a topological sort with an extra constraint bolted on. Ordinary [[cs/dsa/topological-sorting|topological ordering]] of the inheritance DAG would give you an order that respects "subclass before superclass" and nothing else, and there are usually many such orders. C3 picks one, and the property that makes it the right one is monotonicity: an order that survives being extended. The price for that guarantee is that some hierarchies admit no valid order at all, and Python raises at class creation rather than silently picking a bad one.

## Monotonicity is the whole point

The definition in the HOWTO is short enough to hold in your head. A MRO is monotonic when the following is true: if C1 precedes C2 in the linearization of C, then C1 precedes C2 in the linearization of any subclass of C. In other words, the order you observe in a class is a prefix-preserved fact about every class that will ever inherit from it.

Why that matters is stated just as directly. Otherwise, the innocuous operation of deriving a new class could change the resolution order of methods, potentially introducing very subtle bugs. Picture the failure. A library ships `Base` and `Mixin`, and in `class Widget(Mixin, Base)` the mixin's `save` correctly shadows the base's. A user writes `class MyWidget(Widget, Base)`, and under a non-monotonic order the relative positions of `Mixin` and `Base` flip. Nothing in `Widget` changed. Nothing in the library changed. The behavior of an unmodified class inverted because someone subclassed it. Monotonicity is what makes cooperative `super()` chains a stable contract rather than a coincidence of declaration order.

This was not hypothetical. The change was prompted by a post from Samuele Pedroni, who showed that the Python 2.2 method resolution order is not monotonic and proposed replacing it with the C3 method resolution order. The algorithm was not invented for Python: the C3 method itself has nothing to do with Python, since it was invented by people working on Dylan, and it is described in a paper written for a Lisp audience. Python adopted an existing result rather than deriving its own, which is why the guarantees are stated as theorems rather than as behavior.

## The merge

C3 is defined recursively. The linearization of a class is the class itself, followed by the merge of the linearizations of its parents together with the list of parents:

```
L[C(B1 ... BN)] = C + merge(L[B1] ... L[BN], B1 ... BN)
```

The parent list appearing as an extra argument to `merge` is the part people skip, and it is what enforces local precedence: the order you wrote the bases in is itself a constraint the result must respect.

The merge rule is a repeated selection. Take the head of the first list; if this head is not in the tail of any of the other lists, then add it to the linearization of C and remove it from the lists in the merge, otherwise look at the head of the next list and take it, if it is a good head. Repeat until every class is placed or no good head exists.

"Not in the tail of any other list" is the topological condition wearing different clothes. A class sitting in the tail of some list is a class that something else must precede, so placing it now would violate an ordering constraint that another branch imposes. Scanning the heads left to right is the tie-break: among all currently placeable classes, take the one from the earliest parent. That is what makes the result deterministic where a general topological sort would leave a choice.

> [!example] The classic diamond
> With `class B(A)`, `class C(A)`, and `class D(B, C)`, the merge runs on `L[B] = B A O`, `L[C] = C A O`, and the parent list `B C`. `B` is a good head and goes first. `A` is next in line but sits in the tail of `L[C]`, so it is skipped; `C` is taken instead. Only then does `A` become placeable. The linearization is `D B C A O`, and the reason it is correct is visible in the skip: `A` waited for every class that inherits from it. That is why `super().__init__()` written once in each of `B` and `C` runs `A.__init__` exactly once, no matter how the diamond is entered.

## When there is no answer

Not all classes admit a linearization. C3 is a constraint solver over a small set of orderings, and constraints can be contradictory. If the merge exhausts every list without finding a good head, it is impossible to construct the merge, and Python will refuse to create the class and raise an exception.

The canonical contradiction is a pair of bases whose orders disagree. If one branch requires X before Y and another requires Y before X, X sits in the tail of one list while Y sits in the tail of the other, no head is good, and the algorithm halts. The error arrives at `class` statement execution, not at the first attribute lookup, which is the useful property: a hierarchy that cannot be linearized never becomes a class object at all.

The alternative was worse. As the HOWTO frames the older behaviors, a MRO is bad when it breaks such fundamental properties as local precedence ordering and monotonicity, and both the classic-class MRO and the Python 2.2 MRO were bad by that standard. A depth-first left-to-right walk can reach a base class before a class that derives from it, which means an override quietly fails to override. Rejecting the class is a strictly better failure than producing a lookup order that silently ignores a subclass.

C3 also explains a piece of Python that otherwise looks arbitrary. `super()` does not mean "my parent." It means "the next class after me in the MRO of the object's actual type," which is why the same `super()` call inside a mixin can dispatch to a class the mixin's author never heard of. That indirection only works because the MRO is computed per instance type and is monotonic, so a mixin can rely on its position relative to other classes staying fixed under subclassing. The linearization is computed once by `type.__new__` during [[cs/languages/Python/metaclasses-and-class-creation|class creation]] and cached on the class, so the cost is paid at definition time rather than per lookup, and the runtime walk is a scan down a stored tuple. That stored order is the chain [[cs/languages/Python/the-descriptor-protocol|descriptor lookup]] walks, and it is Python's particular answer to the general problem of [[cs/pl/objects-classes-and-dispatch|how an object system resolves a name to an implementation]].

## Related Notes

- [[cs/dsa/topological-sorting|Topological Sorting]] - the general ordering problem C3 specializes, and the constraint it adds
- [[cs/pl/objects-classes-and-dispatch|Objects, Classes, and Dispatch]] - the design space of dispatch that the MRO is one point in
- [[cs/languages/Python/metaclasses-and-class-creation|Metaclasses and Class Creation]] - when the linearization is computed and where it is stored
- [[cs/languages/Cpp/virtual-dispatch-vtables-and-object-layout|Virtual Dispatch, Vtables, and Object Layout]] - the alternative answer, where multiple inheritance is solved by layout and virtual bases
- [[cs/languages/Python/the-descriptor-protocol|The Descriptor Protocol]] - what happens at each class the MRO walk visits
- [[cs/math/relations-and-equivalence|Relations and Equivalence]] - partial orders, which is the structure an inheritance graph actually is

## Sources

- "The Python 2.3 Method Resolution Order," Python HOWTOs. https://docs.python.org/3/howto/mro.html . Supports the definition of linearization and MRO; the monotonicity property and its motivation; the C3 recursive formula and the merge prescription; the failure to construct a merge causing class creation to raise; the origin of C3 in Dylan and Samuele Pedroni's demonstration that the 2.2 order was not monotonic; and the characterization of a bad MRO as one breaking local precedence ordering or monotonicity.

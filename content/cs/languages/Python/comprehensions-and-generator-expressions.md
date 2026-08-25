---
title: Comprehensions and Generator Expressions
description: "What a display actually is, why the leftmost iterable is the one expression evaluated eagerly, and what changed when CPython stopped compiling comprehensions as nested functions."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-03-11
updated:
aliases: []
---

Python calls the bracket-and-brace syntax for building a container a **display**, and the language reference gives each display two flavors: either the container contents are listed explicitly, or they are computed via a set of looping and filtering instructions, called a comprehension. That word choice matters more than it looks. A comprehension is not a special kind of loop bolted onto a literal. It is the second way to write the same literal.

> [!note] The idea
> A comprehension is a *container constructor* with a nested scope glued to it, and the scope boundary is not drawn where you would guess. Everything in the comprehension runs in a separate implicitly nested scope except the iterable expression in the leftmost `for` clause, which is evaluated directly in the enclosing scope and passed in. That single asymmetry explains the leak behavior, the eager-versus-lazy split in generator expressions, and why the compiler was able to delete the nested function entirely in Python 3.12 without changing what most code observes.

## The shape is one grammar, three containers

The reference specifies a comprehension as a single expression followed by at least one `for` clause and zero or more `for` or `if` clauses. Semantically, the elements of the new container are those produced by considering each `for` or `if` clause a block, nesting from left to right, and evaluating the expression to produce an element each time the innermost block is reached. Left-to-right nesting is why `[(i, f) for i in nums for f in fruit]` varies `f` fastest; Guido's pronouncement in PEP 202 put it as `[... for x... for y...]` nesting with the last index varying fastest, just like nested `for` loops.

That one grammar plugs into three displays. A list display yields a new list object built from the elements resulting from the comprehension. A set display uses curly braces and is distinguishable from a dictionary display by the lack of colons separating keys and values, and yields a new mutable set. A dict comprehension, in contrast to list and set comprehensions, needs two expressions separated with a colon followed by the usual `for` and `if` clauses, and when it runs, the resulting key and value elements are inserted in the new dictionary in the order they are produced.

Two sharp edges live in the dict case. Clashes between duplicate keys are not detected; the last value stored for a given key value prevails, so a comprehension keyed on something non-unique silently loses rows. And the key/value evaluation order was only pinned down recently: prior to Python 3.8 the evaluation order of key and value in dict comprehensions was not well-defined, and in CPython the value was evaluated before the key. Starting with 3.8 the key is evaluated before the value.

An empty set has no display at all. `{}` constructs an empty dictionary, so `set()` is the only way in.

PEP 202's stated rationale for the whole feature was modest: list comprehensions provide a more concise way to create lists in situations where `map()` and `filter()` and/or nested loops would currently be used. It is a readability argument, not a performance one.

## The scoping rule, and the one expression that escapes it

Here is the rule verbatim in effect. Aside from the iterable expression in the leftmost `for` clause, the comprehension is executed in a [[cs/pl/scoping-binding-and-closures|separate implicitly nested scope]]. This ensures that names assigned to in the target list do not leak into the enclosing scope. So the loop variable of a comprehension is invisible outside it, unlike a plain `for` statement, whose target survives the loop.

The exception is not arbitrary. The iterable expression in the leftmost `for` clause is evaluated directly in the enclosing scope and then passed as an argument to the implicitly nested scope. Subsequent `for` clauses and any filter condition in the leftmost `for` clause cannot be evaluated in the enclosing scope, because they may depend on values obtained from the leftmost iterable. The reference's own example is `[x*y for x in range(10) for y in range(x, x+10)]`: the second iterable literally mentions `x`, which does not exist yet outside.

One more restriction falls out of wanting the construct to stay a constructor. To ensure the comprehension always results in a container of the appropriate type, `yield` and `yield from` expressions are prohibited in the implicitly nested scope, a change made in Python 3.8.

## When a generator expression is the right call

The syntax for generator expressions is the same as for list comprehensions except that they are enclosed in parentheses instead of brackets, and at runtime a generator expression evaluates to a [[cs/languages/Python/generators-and-iterators|generator iterator]] which yields the same values as the corresponding list comprehension. The reference is explicit that `(x**2 for x in range(10))` is roughly equivalent to defining a generator function that loops the passed iterator and yields, then calling it as `make_generator_of_squares(iter(range(10)))`.

The decision rule is about *when errors surface* as much as about memory. The iterable expression in the leftmost `for` clause is evaluated immediately, so an error raised by this expression is emitted at the point where the generator expression is defined rather than at the point where the first value is retrieved. After that expression is evaluated, an iterator is created from the result as if `iter()` had been called on it, and any error raised when creating the iterator is also emitted immediately. `(x**2 for x in None)` raises `TypeError` on the spot. All other expressions are [[cs/pl/evaluation-order-and-strictness|evaluated lazily]], in the same fashion as normal generators, meaning when the iterator is asked to yield a value.

So `(nonexistent_value for x in range(10))` constructs happily and only explodes when you consume it. So does `(x*y for x in range(10) for y in nonexistent_iterable)`, because the *second* iterable is inside the lazy part. A generator expression is the right call when the consumer is a reducer or a constructor that walks the stream once, when the sequence is large or unbounded, or when you want the work interleaved with consumption. It is the wrong call when you need `len()`, indexing, or a second pass, and it is a trap when the deferred body reads names you are about to rebind.

The parenthesization rule is a small piece of ergonomics with a real gotcha: the enclosing parentheses can be omitted in calls when the generator expression is the only positional argument and there are no keyword arguments. `sum(x**2 for x in range(10))` is legal. Add a keyword argument and the generator needs its own parentheses again, as in `sum((x**2 for x in range(10)), start=1000)`.

## What Python 3.12 changed underneath

Comprehensions used to be compiled as nested functions, which provided isolation of the comprehension's iteration variable but was inefficient at runtime. Each call allocated a new single-use function object, called it (allocating and destroying a Python frame), and threw it away. PEP 709 inlined list, dictionary, and set comprehensions into the code where they are defined, providing the expected isolation by pushing and popping clashing locals on the stack instead. The PEP reports up to 2x faster for a microbenchmark of a comprehension alone, and an 11% speedup for one sample benchmark derived from real-world code that makes heavy use of comprehensions.

The isolation trick is a new [[cs/languages/Python/the-bytecode-and-the-eval-loop|opcode]]. `LOAD_FAST_AND_CLEAR` saves any outer value of the iteration variable on the stack before running the comprehension, and a matching `STORE_FAST` restores it afterward. In effect, comprehensions introduce a sub-scope where local variables are fully isolated, but without the performance cost or stack frame entry of a call. A secondary win: if the comprehension accesses variables from the outer scope, inlining avoids the need to place those variables in a cell, so the comprehension and all other code in the outer function access them as normal fast locals.

Generator expressions were left out. They are currently not inlined in the reference implementation of PEP 709, because the returned generator object can outlive the frame that made it.

> [!example] Two observable consequences of inlining
> Calling `locals()` inside a comprehension used to return the comprehension function's own locals, including a synthetic `.0` argument holding the iterator. Under PEP 709, `[locals() for x in lst]` called as `f([1])` returns `[{'lst': [1], 'x': 1}]`: the outer `lst` is now visible and the synthetic `.0` is gone. Separately, a comprehension no longer has its own dedicated frame in a stack trace. The `<listcomp>` line that used to appear between the enclosing function and the raising callee is simply absent, and the enclosing function's frame carries the comprehension's line number instead.

> [!warning] "No leak" is about names, not about aliasing
> The nested scope stops the target name from escaping. It does nothing about the objects. A comprehension that appends the same mutable object into every slot produces a container of aliases, and the [[cs/languages/common/memory-ownership-refcounting-gc|reference-counting model]] is what decides when any of them dies. Isolation of the loop variable and isolation of the values it names are different questions.

## Related Notes

- [[cs/languages/Python/generators-and-iterators|Generators and Iterators in Python]] - what a generator expression evaluates to, and PEP 289's memory argument
- [[cs/pl/scoping-binding-and-closures|Scoping, Binding, and Closures]] - the general theory the implicitly nested scope is an instance of
- [[cs/pl/evaluation-order-and-strictness|Evaluation Order and Strictness]] - the eager/lazy split as a language design axis
- [[cs/languages/Python/the-data-model-and-dunder-methods|The Data Model and Dunder Methods]] - hashability, which is what constrains dict comprehension keys
- [[cs/languages/common/memory-ownership-refcounting-gc|Who Frees the Memory]] - the cost of materializing a large list instead of streaming it

## Sources

- "6. Expressions," The Python Language Reference. https://docs.python.org/3/reference/expressions.html . Supports the "displays" framing and its two flavors, the comprehension grammar and left-to-right block nesting, the implicitly nested scope and the leftmost-iterable exception with the `[x*y for x in range(10) for y in range(x, x+10)]` example, the `yield` prohibition added in 3.8, list/set/dict display semantics, the empty-set-versus-`{}` rule, duplicate-key resolution, the 3.8 key-before-value ordering change, and the generator expression rules including the parentheses-in-calls exception and the immediate-versus-lazy error timing.
- "PEP 202 - List Comprehensions," Python Enhancement Proposals. https://peps.python.org/pep-0202/ . Supports the rationale that list comprehensions are a more concise alternative to `map()`, `filter()`, and nested loops, and the BDFL pronouncement that nested `for` clauses vary the last index fastest.
- "PEP 709 - Inlined comprehensions," Python Enhancement Proposals. https://peps.python.org/pep-0709/ . Supports the pre-3.12 nested-function compilation and its per-call function and frame allocation, the inlining of list/dict/set comprehensions with stack push/pop isolation, the up-to-2x microbenchmark and 11% real-world figures, `LOAD_FAST_AND_CLEAR`, the avoided cell allocation for outer variables, generator expressions being excluded, and the two visible changes to `locals()` and tracebacks.

---
title: Context Managers and the with Statement
description: "What with actually expands to, the __enter__/__exit__ contract, the return value of __exit__ as an exception switch, and why contextlib turns a generator into a resource protocol."
draft: false
comments: true
tags:
  - cs
  - languages
  - error-handling
date: 2026-05-21
updated:
aliases: []
---

`try`/`finally` works. The problem is that it does not compose and it does not travel. Every caller who opens the same resource writes the same acquire step, the same guard, and the same release step, and any one of them can get it slightly wrong. The `with` statement exists so that the correct pairing is written once, by the author of the resource, and reused by everyone else. The language reference states the purpose exactly that way: `with` wraps the execution of a block with methods defined by a context manager, allowing common `try...except...finally` usage patterns to be encapsulated for convenient reuse.

The general machinery of non-local exits and cleanup is in [[cs/pl/exceptions-handlers-and-non-local-control|exceptions, handlers, and non-local control]]. This note is about the Python contract.

> [!note] The idea
> `with` is not a scoping construct and it is not a special form for files. It is a two-method protocol with an unusual asymmetry: `__enter__` produces a value, and `__exit__` receives the *exception state* and returns a boolean that decides whether the exception continues to propagate. That return value is the whole reason `with` is more expressive than `try`/`finally`. A `finally` clause can only run code on the way out; an `__exit__` can also swallow the exception on the way out, which is what makes `contextlib.suppress` possible as a context manager at all.

## The exact expansion

The reference gives the semantics as a sequence and then as code. The context expression is evaluated to obtain a context manager. Its `__enter__` and `__exit__` are both loaded for later use, before either runs. `__enter__` is invoked, and if a target was included after `as`, the return value from `__enter__` is assigned to it. The suite runs. Then `__exit__` is invoked: if an exception caused the suite to be exited, its type, value, and traceback are passed as arguments, otherwise three `None` arguments are supplied.

The branch at the end is the interesting part. If the suite exited due to an exception and `__exit__` returned false, the exception is reraised. If the return value was true, the exception is suppressed and execution continues with the statement following the `with`. If the suite exited for any reason other than an exception, the return value from `__exit__` is ignored entirely.

Written out, `with EXPRESSION as TARGET: SUITE` is semantically equivalent to:

```python
manager = (EXPRESSION)
enter = manager.__enter__
exit = manager.__exit__
value = enter()
hit_except = False
try:
    TARGET = value
    SUITE
except:
    hit_except = True
    if not exit(*sys.exc_info()):
        raise
finally:
    if not hit_except:
        exit(None, None, None)
```

with the difference that implicit special method lookup is used for `__enter__` and `__exit__`, meaning they are found on the type rather than on the instance, as with the rest of [[cs/languages/Python/the-data-model-and-dunder-methods|Python's special methods]].

Read that expansion carefully and two things fall out that the prose version hides. The assignment `TARGET = value` sits *inside* the guarded block, which the reference confirms in a note: `with` guarantees that if `__enter__` returns without an error then `__exit__` will always be called, so an error during assignment to the target list is treated exactly like an error inside the suite. And `exit` is bound to the method object before the suite runs, so swapping the attribute on the instance mid-block changes nothing.

Multiple items nest rather than parallelise. `with A() as a, B() as b:` is semantically equivalent to a `with A()` containing a `with B()`. Support for multiple context expressions arrived in Python 3.1, and grouping parentheses that let the items break across lines arrived in 3.10.

## Why this beats a hand-written try/finally

PEP 343's stated purpose is to make it possible to factor out standard uses of `try`/`finally`. But the interesting content in the PEP is Guido's argument about *why the with-statement design won* over the alternative in PEP 340, which would have made the block a potential looping construct.

The deciding influence was Raymond Chen's argument that hiding flow control in [[cs/pl/macros-and-metaprogramming|macros]] makes code inscrutable. Guido concluded that PEP 340 templates could hide all sorts of control flow, giving its own auto-retry example, which catches exceptions and repeats the block up to three times, as the case that convinced him. The with-statement, by contrast, does not hide control flow: a `finally` suite temporarily suspends control flow, but in the end control resumes as if the suite were not there at all.

His example makes the guarantee concrete. In

```python
with f = open("/etc/passwd"):
    BLOCK1
BLOCK2
```

(PEP 343 quoting the earlier PEP 310 syntax) you know, just as if the first line were `if True`, that if `BLOCK1` completes without an exception then `BLOCK2` is reached, and if `BLOCK1` raises or executes a non-local goto such as a `break`, `continue`, or `return`, then `BLOCK2` is not. The magic added at the end does not affect that.

So the honest answer to "why does this beat try/finally" is in two parts. It is more readable, because the acquire-release pair is written once at the definition instead of at every use. And it is *bounded*, because the design deliberately refuses to let the construct hide control flow, which is exactly the property a macro-style block statement would have given away.

## contextlib: a generator as a resource protocol

Writing a class with two dunder methods for every resource is heavy. `@contextlib.contextmanager` turns a generator into one instead. The contract is precise: the decorated function must return a generator-iterator when called, and that iterator must yield exactly one value, which is bound to the target in the `as` clause. At the point where the generator yields, the block nested in the `with` is executed, and the generator is resumed after the block exits.

Exception handling flows through the [[cs/languages/Python/generators-and-iterators|generator]] itself. If an unhandled exception occurs in the block, it is reraised inside the generator at the point where the `yield` occurred, so an ordinary `try`/`except`/`finally` around the `yield` traps or cleans up. The documented trap: if an exception is caught merely to log it rather than to suppress it, the generator must reraise it, or the context manager tells the `with` statement that the exception has been handled and execution resumes after the block.

The canonical shape from the docs is exactly three lines of structure:

```python
@contextmanager
def managed_resource(*args, **kwds):
    resource = acquire_resource(*args, **kwds)
    try:
        yield resource
    finally:
        release_resource(resource)
```

`contextmanager` also uses `ContextDecorator`, so the context managers it creates can be used as decorators as well as in `with` statements. Because a generator-based manager is otherwise one-shot, a new generator instance is implicitly created on each function call when used as a [[cs/languages/Python/decorators|decorator]], which is how it satisfies the requirement that decorators support multiple invocations.

Three other pieces of the module are worth knowing by name. `contextlib.suppress(*exceptions)` returns a context manager that suppresses the named exceptions and resumes at the first statement after the block, and the docs are pointed about it, saying that as with any mechanism that completely suppresses exceptions it should be used only for very specific errors where silently continuing is known to be right. Since 3.12 it also handles `BaseExceptionGroup`, removing suppressed exceptions from the group and re-raising the rest in a new group derived from the original. `contextlib.closing(thing)` covers resources that expose only a `close()` method. And `ExitStack` handles the case the static `with` syntax cannot: a set of context managers that is optional or driven by input data, such as opening a list of filenames whose length is not known at write time.

> [!example] Why ExitStack unwinds in reverse
> `with ExitStack() as stack: files = [stack.enter_context(open(f)) for f in filenames]` closes every opened file at the end of the block even if a later `open` raises. Each instance maintains a stack of registered callbacks called in reverse order of registration when the stack closes, which the docs say ends up behaving as if multiple nested `with` statements had been used. The equivalence goes further than cleanup order: if an inner callback suppresses or replaces an exception, outer callbacks are passed arguments based on that updated state, exactly as nesting would. `enter_context(cm)` runs the manager's own `__enter__` and returns its result, so those managers can still suppress exceptions as they would standing alone. One caveat the docs state plainly: callbacks are not invoked implicitly when the stack instance is garbage collected.

> [!warning] Returning a truthy value from `__exit__` silently eats exceptions
> The most common `__exit__` bug is an accidental one. A method that falls off the end returns `None`, which is false, and propagation is correct. A method that ends with something like `return self.cleanup()` returns whatever `cleanup` returned, and if that is truthy every exception in the block disappears. `__exit__` should return false unless suppression is the deliberate intent.

## Related Notes

- [[cs/pl/exceptions-handlers-and-non-local-control|Exceptions, Handlers, and Non-Local Control]] - the general theory of unwinding and cleanup that `with` specialises
- [[cs/languages/Python/generators-and-iterators|Generators and Iterators in Python]] - the suspension machinery `@contextmanager` reuses to represent acquire-and-release
- [[cs/languages/Python/decorators|Decorators in Python]] - `ContextDecorator`, and why a one-shot manager needs a fresh generator per call
- [[cs/languages/Python/the-data-model-and-dunder-methods|The Data Model and Dunder Methods]] - implicit special method lookup, and the wider protocol scheme `__enter__` belongs to
- [[cs/languages/common/errors-as-values-vs-control-flow|Errors as Values vs Control Flow]] - the design axis that decides whether cleanup rides on unwinding at all
- [[cs/languages/Rust/ownership-and-moves|Ownership and Moves in Rust]] - the alternative answer, where release is tied to scope exit by the type system rather than by a statement

## Sources

- "8. Compound statements," The Python Language Reference. https://docs.python.org/3/reference/compound_stmts.html . Supports the stated purpose of `with`, the full step-by-step execution order, `__exit__` receiving type/value/traceback or three `None`s, the true/false return deciding suppression versus reraise, the ignored return value on non-exception exit, the exact code equivalence with implicit special method lookup, the guarantee that a failed target assignment is treated like a suite error, and multiple items nesting with the 3.1 and 3.10 version changes.
- "PEP 343 - The 'with' Statement," Python Enhancement Proposals. https://peps.python.org/pep-0343/ . Supports the PEP's purpose of factoring out standard `try`/`finally` uses, context managers providing `__enter__` and `__exit__`, Raymond Chen's flow-control-macro argument and the auto-retry example that decided against PEP 340, the claim that the with-statement does not hide control flow, and the `open("/etc/passwd")` example showing that BLOCK2 is reached exactly when BLOCK1 completes normally.
- "contextlib - Utilities for with-statement contexts," Python Standard Library. https://docs.python.org/3/library/contextlib.html . Supports the `@contextmanager` contract (generator-iterator yielding exactly one value, block running at the yield, resumption after), exceptions being reraised inside the generator at the yield and the must-reraise-when-logging warning, the canonical acquire/`try`/`yield`/`finally` shape, `ContextDecorator` use and the fresh-instance-per-call rule, `suppress` semantics including the caution and the 3.12 `BaseExceptionGroup` behavior, `closing`, and `ExitStack` including reverse-order callbacks, nesting equivalence with updated exception state, `enter_context`, and the garbage-collection caveat.

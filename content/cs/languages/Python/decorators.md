---
title: Decorators in Python
description: "The @ syntax as sugar for rebinding a name, why stacking applies bottom to top, what functools.wraps repairs, and how a decorator that takes arguments is a different animal."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-04-06
updated:
aliases:
  - Python Decorators
  - functools.wraps
---

Before Python 2.4 you wrote the transformation after the function body:

```python
def foo(self):
    ...
foo = classmethod(foo)
```

PEP 318's complaint about that pattern is specific, and it is not about aesthetics. For large functions it separates a key component of the function's behavior from the definition of the rest of the function's external interface, and it names the function three times for what is conceptually a single declaration. The `@` syntax moves the transformation next to the declaration it modifies. Nothing else changed.

> [!note] The idea
> A decorator is not a language feature that wraps functions. It is a rebinding rule: the decorator expression is evaluated at definition time, called with the function object as its only argument, and whatever it returns is bound to the function's name instead of the function. Wrapping is merely the most common thing to return. The consequence people underuse is that a decorator is free to return anything at all, a different function, a class instance, a registry entry, or the original object unchanged after a side effect.

## The desugaring is one sentence in the reference

The language reference states the rule directly. A function definition may be wrapped by one or more decorator expressions; those expressions are evaluated when the function is defined, in the scope that contains the function definition; the result must be a callable, which is invoked with the function object as the only argument; and the returned value is bound to the function name instead of the function object.

Three separate facts sit in that sentence, and each one bites somewhere.

**Definition time, not call time.** The decorator runs once, when the `def` executes. A decorator that opens a file or registers into a global does so at import, which is why a badly written decorator turns an import into a side effect.

**The enclosing scope.** The expression after `@` is resolved where the definition lives, not inside the function.

**Any callable.** `@` does not require a function. A class with `__call__`, a `partial`, or an instance method all qualify, because the check is the general [[cs/languages/Python/the-data-model-and-dunder-methods|callable protocol]] rather than a function type test.

Stacking composes in nested fashion. The reference gives the canonical example:

```python
@f1(arg)
@f2
def func(): pass
```

is roughly equivalent to `func = f1(arg)(f2(func))`, except that the original function is never temporarily bound to the name `func`. PEP 318's rationale for bottom-to-top application is that it matches the usual order of function application: in mathematics, composing `g` after `f` means `g(f(x))`, so `@g` above `@f` means the outer `g` applies last.

Classes work the same way. `@f1(arg)` over `@f2` over `class Foo` is roughly `Foo = f1(arg)(f2(Foo))`, with the same evaluation rules and the result bound to the class name. PEP 318 itself only added function and method decorators in Python 2.4; class decorators arrived through PEP 3129, and the PEP notes candidly that almost anything class decorators do could be done with metaclasses, but metaclasses are sufficiently obscure that an easier way to make simple class modifications was worth having.

One grammar note: since Python 3.9, functions and classes may be decorated with any valid assignment expression, where previously the grammar was much more restrictive. PEP 318 records the original restriction and Guido's reason for it, a gut feeling that arbitrary expressions after `@` were a bad idea.

## What wrapping costs, and what functools.wraps repairs

The default decorator shape returns a new function, which means the name now points at an object whose identity is wrong. The `functools` documentation is direct about the damage: if the wrapper function is not updated, the metadata of the returned function will reflect the wrapper definition rather than the original function definition, which is typically less than helpful. Concretely, in the documented example the decorated function's `__name__` would have been `'wrapper'` and the original docstring would have been lost.

`functools.update_wrapper(wrapper, wrapped)` fixes this. By default it copies the wrapped function's `__module__`, `__name__`, `__qualname__`, `__annotations__`, `__type_params__`, and `__doc__` onto the wrapper (the `WRAPPER_ASSIGNMENTS` constant), and updates the wrapper's `__dict__`, its instance dictionary, from the original (the `WRAPPER_UPDATES` constant). `@functools.wraps(wrapped)` is the convenience form for applying that inside a decorator, and the docs define it exactly as `partial(update_wrapper, wrapped=wrapped, assigned=assigned, updated=updated)`.

The piece worth remembering is the escape hatch. `update_wrapper` automatically adds a `__wrapped__` attribute to the wrapper referring to the function being wrapped, specifically to allow access to the original for introspection and other purposes, the documented example being bypassing a caching decorator such as `lru_cache()`. Since Python 3.4 that attribute always refers to the wrapped function even if the wrapped function itself defined one.

`update_wrapper` is also tolerant by design. It may be used with callables other than functions, and any attribute named in `assigned` or `updated` that is missing from the object being wrapped is simply ignored rather than raising. The one thing that still raises `AttributeError` is the wrapper itself missing an attribute named in `updated`.

## Decorators with arguments are a factory, not a decorator

`@decomaker(argA, argB)` looks like the same construct with parameters. It is not. PEP 318 spells out that

```python
@decomaker(argA, argB, ...)
def func(arg1, arg2, ...):
    pass
```

is equivalent to `func = decomaker(argA, argB, ...)(func)`. The rationale is that the part after the `@` sign is an expression, and whatever that expression returns is called.

So there are two calls, at two different moments, and they take different arguments. `decomaker(argA, argB)` runs first and must return a decorator; that returned decorator then receives the function. This is why parameterised decorators are written as three nested levels rather than two, and why forgetting the parentheses on a decorator factory produces a baffling error: `@decomaker` without a call binds the *factory's* return value from being handed the function as its first configuration argument.

> [!example] Reading a stack against its desugaring
> `@f1(arg)` over `@f2` over `def func` becomes `func = f1(arg)(f2(func))`. Evaluate it inside out. `f2(func)` runs first because it is nearest the `def`. Then `f1(arg)` is evaluated, producing a decorator, and that decorator is applied to the result of `f2`. Two of those three calls happen at definition time, and only the final returned object survives under the name `func`. If `f2` used `@wraps` and `f1` did not, `func.__name__` is whatever `f1`'s wrapper was called, and the `__wrapped__` chain is where the original went.

> [!warning] The name is rebound, so the original is only reachable if someone kept it
> Nothing preserves the undecorated function automatically except the `__wrapped__` attribute that `update_wrapper` sets. A decorator that builds its own wrapper without calling `functools.wraps` or `update_wrapper` leaves no documented path back to the original, and tooling that relies on `__name__`, `__doc__`, or signature introspection sees the wrapper instead.

## Related Notes

- [[cs/pl/scoping-binding-and-closures|Scoping, Binding, and Closures]] - the closure that holds the wrapped function is what makes a wrapper work at all
- [[cs/languages/Python/the-data-model-and-dunder-methods|The Data Model and Dunder Methods]] - `__call__`, and why any callable can sit after an `@`
- [[cs/pl/macros-and-metaprogramming|Macros and Metaprogramming]] - decorators as the mild, expression-level end of the program-transformation spectrum
- [[cs/languages/Python/context-managers-and-with|Context Managers and the with Statement]] - the other place Python turns a protocol into syntax
- [[cs/languages/Racket/language-design-from-core-to-surface-racket|Language Design from Core to Surface]] - surface syntax defined by desugaring to a smaller core, which is exactly what `@` is

## Sources

- "8. Compound statements," The Python Language Reference. https://docs.python.org/3/reference/compound_stmts.html . Supports decorator expressions being evaluated at definition time in the enclosing scope, the result needing to be a callable invoked with the function object as its only argument and bound to the function name, the nested application of multiple decorators with the `f1(arg)(f2(func))` equivalence and the note that the original is never temporarily bound, the identical class-decorator rules, and the Python 3.9 change permitting any valid assignment expression.
- "PEP 318 - Decorators for Functions and Methods," Python Enhancement Proposals. https://peps.python.org/pep-0318/ . Supports the pre-decorator `foo = classmethod(foo)` motivation and its "names the function three times" complaint, the bottom-to-top application order and its function-composition rationale, the `@decomaker(argA, argB)` to `func = decomaker(...)(func)` equivalence and the reasoning that whatever the expression returns is called, the original restriction against arbitrary expressions, and class decorators arriving via PEP 3129 with the metaclass comparison.
- "functools - Higher-order functions and operations on callable objects," Python Standard Library. https://docs.python.org/3/library/functools.html . Supports `update_wrapper` and `wraps` semantics, the `WRAPPER_ASSIGNMENTS` attribute list (`__module__`, `__name__`, `__qualname__`, `__annotations__`, `__type_params__`, `__doc__`) and `WRAPPER_UPDATES` copying `__dict__`, the automatic `__wrapped__` attribute and the `lru_cache` bypass use case, the `wraps` equivalence to a `partial` of `update_wrapper`, the worked example where the undecorated name would be `'wrapper'` with the docstring lost, and the missing-attribute tolerance rules.

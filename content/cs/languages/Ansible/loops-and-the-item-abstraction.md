---
title: Loops and the item Abstraction
description: "loop, the with_ family, and loop_control: why item is a shared name rather than a binding, and what iterating a list of dicts replaces in a language with no functions."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-07-11
updated:
aliases:
  - Ansible Loops
  - loop_control and loop_var
---

Ansible offers three keywords for running a task more than once, and the docs sort them the way a programmer would: `loop` and the `with_` family "run the task once per item in the list used as input, while `until` will rerun the task until a condition is met," which makes "the former 'for loops' and the latter a 'while/until loop'." `loop` arrived in 2.5 as the simpler option and is recommended for most cases, while the `with_` keywords remain valid for the foreseeable future.

The mechanism underneath is worth stating before the syntax. `loop` takes a list and runs the task body once per element, binding each element to the name `item`. That name is the entire abstraction. There is no parameter list, no iteration variable declared anywhere, and no scope introduced by the loop.

> [!note] The idea
> `item` is a shared name, not a binding. Nothing about a loop creates a scope, so nesting one looping construct inside another collides: when you nest two looping tasks through `include_tasks`, "the inner, nested loop will overwrite the value of `item` from the outer loop," and the documented fix is to rename the iteration variable per loop with `loop_control.loop_var`. Compare that to a language where the loop variable is [[cs/pl/scoping-binding-and-closures|a fresh binding in a fresh scope]] and shadowing is the well-defined default. Ansible's `item` behaves like a dynamically scoped variable in the sense developed by [[cs/languages/Racket/parameters-and-dynamic-binding|parameters and dynamic binding]]: whoever assigned it most recently wins, regardless of where the reading code was written. Every other quirk on this page follows from that one design choice.

## What the list can be, and where it comes from

The simplest form is a literal list in the task. The next is a variable holding a list. Beyond that, the docs are explicit about a constraint that trips people: "the `loop` keyword requires a list as input, but the `lookup` keyword returns a string of comma-separated values by default." Ansible 2.5 introduced `query` for exactly this, a Jinja2 function that always returns a list, so `loop: "{{ query('inventory_hostnames', 'all') }}"` works where the equivalent bare `lookup` would hand you one long string. The alternative is `wantlist=True` on the lookup itself.

That constraint exposes what the `with_` keywords always were. They "rely on Lookup plugins," and even `items` is a lookup, which means each `with_X` form was a plugin name glued to a loop. `loop` is documented as equivalent to `with_list`, and the migration table maps the rest onto `loop` plus a filter. The most important migration note is a semantic difference rather than a syntax one: "`with_items` performs implicit single-level flattening," so converting to `loop` may require `| flatten(1)` to reproduce the same iteration.

## Iterating a list of dicts, and what it replaces

The list-of-hashes pattern is the one that carries real weight, because it is the substitute for a function with named parameters. You write one task with `{{ item.name }}` and `{{ item.groups }}` in its module arguments, and supply a list of dicts, each dict being one call's worth of arguments. That is the shape of an argument table applied row by row.

For dicts rather than lists, `dict2items` transforms a dictionary into a list of items suitable for looping, and `items2dict` is documented as its reverse. Nested loops without `include_tasks` are done with a filter as well: a Cartesian product of two lists, written `loop: "{{ ['alice','bob'] | product(['clientdb','employeedb']) | list }}"`, gives every pair, which is the combinatorial object described in [[cs/math/combinatorics|combinatorics]] rendered as a loop input. The pattern generalizes. When a language cannot nest control flow cleanly, the way out is to precompute the iteration space as data and iterate it once.

Conditionals interact with loops per element, not per task: "when combining conditionals with a loop, the `when:` statement is processed separately for each item." Results do not. Registering a looped task gives you a `results` attribute containing a list of all responses, with the top-level `changed` and `failed` true if at least one iteration changed or failed, and `skipped` true only if all iterations were skipped. One task, many module invocations, one aggregated status. That aggregation is what makes the loop change semantics in [[cs/languages/Ansible/handlers-and-notify-semantics|handlers and notify semantics]] behave the way they do.

## loop_control, and why it kept growing

`loop_control` collects the knobs the bare keyword could not express, and reading them in release order is a good short history of what people actually needed.

- `label` (2.2) limits console output when looping over large structures, because the default is to print each item in full.
- `loop_var` (renaming `item`) fixes the nesting collision described above.
- `index_var` (2.5) exposes the current index, zero indexed.
- `extended` (2.8) adds `ansible_loop` with `index`, `index0`, `revindex`, `first`, `last`, `length`, `previtem`, `nextitem`, and `allitems`, which is the Jinja2 loop object by another name. The docs attach a cost: `extended` uses more memory on the control node because `ansible_loop.allitems` holds a reference to the full loop data for every loop, and `extended_allitems: false` (2.14) turns that off.
- `break_when` (2.18) exits a loop after any item based on a Jinja2 expression, which is the point at which the construct finally acquired the equivalent of `break`.

Nine years elapsed between `label` and `break_when`. A loop that started as "run this task per element" accumulated the index, the first and last flags, the neighbours, and finally early exit, arriving at roughly the feature set a `for` statement ships with on day one.

> [!warning] Loop when you must, not by reflex
> The docs are direct that a loop is often the wrong tool: "you can pass a list directly to a parameter for some plugins," most packaging modules among them, and "when available, passing the list to a parameter is better than looping over the task." Their example labels the loop version "non-optimal, slower and may cause issues with interdependencies." The reason is in [[cs/languages/Ansible/the-execution-model-and-module-transfer|the execution model]]: each iteration is a full module invocation on the target, so a fifty-package loop pays the module transfer and execution cost fifty times and asks the package manager to resolve dependencies fifty times independently. The loop is the general mechanism, and the module parameter is the batched one.

## Related Notes

- [[cs/languages/Ansible/filters-and-tests-as-transformations|Filters and Tests as Transformations]] - `flatten`, `dict2items`, and `product`, the filters that make loop inputs
- [[cs/languages/Ansible/handlers-and-notify-semantics|Handlers and notify Semantics]] - why one changed iteration fires every notified handler
- [[cs/pl/evaluation-order-and-strictness|Evaluation Order and Strictness]] - why a loop input has to be a fully materialized list before the task runs
- [[cs/math/combinatorics|Combinatorics]] - the product and permutation filters, and the size of the iteration space they build
- [[cs/languages/Ansible/why-ansible-has-no-generics|Why Ansible Has No Generics]] - why a list of dicts is the substitute for a parameterized call

## Sources

- "Loops," Ansible Community Documentation. https://docs.ansible.com/ansible/latest/playbook_guide/playbooks_loops.html . Supports the three looping keywords and the for/while framing, `loop` added in 2.5 and `with_` not deprecated, `loop` as the equivalent of `with_list`, the lookup-versus-query list requirement, `with_items` implicit flattening, list-of-hashes and `dict2items` iteration, per-item `when` evaluation, the `results` structure from registering a looped task, the `loop_control` directives and their versions, the `extended` memory caveat, the nested-loop `item` collision and `loop_var` fix, the `product` filter for nested iteration, and the guidance that passing a list to a module parameter beats looping.
- "Using filters to manipulate data," Ansible Community Documentation. https://docs.ansible.com/ansible/latest/playbook_guide/playbooks_filters.html . Supports `dict2items` producing key and value attributes and `items2dict` as its reverse.

---
title: "Blocks, Rescue, and Always"
description: "Grouped error handling in a language with no exception objects: what rescue actually catches, what it cannot catch, and the four ways it diverges from try and catch."
draft: false
comments: true
tags:
  - cs
  - languages
  - error-handling
date: 2026-06-24
updated:
aliases: []
---

The Ansible docs make the comparison themselves. Blocks create logical groups of tasks, and blocks also offer ways to handle task errors, similar to exception handling in many programming languages. The similarity is real enough to be useful and misleading enough to be worth taking apart carefully, because four of the properties you rely on in `try`/`catch` are absent.

> [!note] The idea
> `block`/`rescue`/`always` looks like `try`/`catch`/`finally` but is built from a different primitive. There is no exception object, no type hierarchy to select on, and no stack to unwind, so `rescue` is structurally a single untyped catch that fires on one condition: a task returned `failed`. Everything that is not that condition, including an unreachable host and a malformed task, passes straight through the construct as if it were not there. The block is a grouping and inheritance mechanism first and an error handler second, and the inheritance half explains most of the surprises.

## A block is not a scope

All tasks in a block inherit directives applied at the block level. Most of what you can apply to a single task, with the exception of loops, can be applied at the block level. The critical sentence is the next one: the directive does not affect the block itself, it is only inherited by the tasks enclosed by a block.

So a `when` on a block does not guard entry into the block. It is copied onto each contained task and evaluated separately for each one, exactly as [[cs/languages/Ansible/conditionals-and-fact-based-branching|a condition on an import]] behaves. In the documentation's own example, the `when` condition is evaluated before Ansible runs each of the three tasks in the block. If a task inside the block changes the thing the condition tests, later tasks in the same block see the new value.

That is the first structural difference from `try`. A `try` block is a lexical region with an entry and an exit. An Ansible block is a distribution operator that pushes attributes down onto its children and then disappears. The grouping is real in the source text and mostly not real at execution time.

The loops exception is telling. You cannot put `loop` on a block, because the block is not a thing that executes and therefore not a thing that can execute repeatedly. It has no runtime identity to iterate.

## What rescue catches

Ansible only runs rescue blocks after a task returns a `failed` state. That is the entire selection criterion. There is no type to match on, no `catch (IOException e)` versus `catch (SQLException e)`, and no way to write a rescue that handles one kind of failure and rethrows another. You get one handler for one condition, which is closer to `catch (Throwable)` than to anything a careful Java programmer would write.

The negative case is the one that bites. Errors caused by invalid task definitions and unreachable hosts do not trigger the rescue or always sections of a block. Both exclusions make sense once you see the mechanism. An unreachable host has no connection over which a module could return `failed`, so there is no failed result to trigger anything, and the host drops out of the play entirely. An invalid task definition is a parse-level problem detected before the task could run at all. Neither produces the return value the construct keys on.

This is the practical trap in using `always` for cleanup. If your always section removes a temporary file on the target, and the target went unreachable mid-play, the cleanup does not run, and there is nothing in the language that will make it run. `always` in Ansible means "regardless of the block and rescue task results," not "regardless of what happened." Tasks in the `always` section run no matter what the task status of the previous block is, which is a narrower guarantee than `finally` gives you and a much narrower one than the word suggests.

## Compared against checked exceptions

Java's arrangement is the sharpest available contrast. [[cs/languages/Java/checked-and-unchecked-exceptions|Checked exceptions]] are subject to the Catch or Specify Requirement, and code that fails to honor that requirement will not compile. All exceptions are checked exceptions except those indicated by `Error`, `RuntimeException`, and their subclasses, so the language partitions failure into a statically enforced half and an unenforced half.

Ansible has neither half. Nothing in a task declares what it can fail with. There is no compiler to enforce a declaration, no signature to carry one, and no type on the failure to declare. Every task can fail, all failures are the same kind, and whether you handle them is entirely a runtime and stylistic question. In the taxonomy of [[cs/pl/exceptions-handlers-and-non-local-control|non-local control]], Ansible does not really have an exception mechanism at all. It has a status flag on a return value and a construct that branches on it, which puts it closer to the [[cs/languages/common/errors-as-values-vs-control-flow|errors-as-values]] camp wearing exception-shaped syntax.

The one place Ansible reaches for something like an exception object is inside the rescue section. `ansible_failed_task` holds the task that returned failed and triggered the rescue. `ansible_failed_result` holds the captured return result of the failed task that triggered the rescue. Two magic variables, populated only in that scope, standing in for what other languages give you as a first-class value you can bind, pass, wrap, and rethrow. There is no rethrow. To fail again you run a `fail` task, which is a new failure rather than a propagation of the old one.

## The status revision

The subtlest behavior is bookkeeping. If an error occurs in the block and the rescue task succeeds, Ansible reverts the failed status of the original task for the run and continues to run the play as if the original task had succeeded. The rescued task is considered successful and does not trigger `max_fail_percentage` or `any_errors_fatal` configurations. However, Ansible still reports a failure in the playbook statistics.

Two different consumers of the same event get two different answers on purpose. The execution engine is told the failure did not happen, so per-host fail thresholds and the fatal-error switch stay quiet. The end-of-run recap is told it did happen, so the operator can see that recovery was needed. A handled exception in most languages leaves no trace unless you log one; here the trace is automatic and the semantic effect is erased.

> [!warning] Rescue is not a transaction
> The natural use of `block`/`rescue` is graceful rollback, and the construct offers no atomicity to support it. Each host runs its own copy of the block, so a play across fifty machines can end with some rolled back, some rolled forward, and some unreachable and therefore untouched by either path. Nothing coordinates them. If the operation genuinely needs all-or-nothing across hosts, you are in [[cs/systems/two-phase-commit-and-distributed-transactions|distributed transaction]] territory, and rescue gives you per-host cleanup rather than a commit protocol.

## Related Notes

- [[cs/languages/Java/checked-and-unchecked-exceptions|Checked and Unchecked Exceptions]] is the statically enforced version of the same problem, and shows exactly what Ansible gave up by having no type on a failure.
- [[cs/pl/exceptions-handlers-and-non-local-control|Exceptions, Handlers, and Non-Local Control]] supplies the general vocabulary that makes rescue legible as a degenerate case.
- [[cs/languages/common/errors-as-values-vs-control-flow|Errors as Values vs Control Flow]] is the camp Ansible actually belongs to, despite the syntax.
- [[cs/systems/two-phase-commit-and-distributed-transactions|Two-Phase Commit and Distributed Transactions]] is what rollback across many hosts would require if you wanted a real guarantee.
- [[cs/languages/Ansible/conditionals-and-fact-based-branching|Conditionals and Fact-Based Branching]] explains the per-task re-evaluation that a `when` on a block inherits.

## Sources

- [Blocks, Ansible playbook guide](https://docs.ansible.com/ansible/latest/playbook_guide/playbooks_blocks.html) backs directive inheritance, the loops exception, what rescue triggers on, the unreachable and invalid-definition exclusions, the always guarantee, the failed-status revision, and the two rescue variables.
- [The Catch or Specify Requirement, Java Tutorials](https://docs.oracle.com/javase/tutorial/essential/exceptions/catchOrDeclare.html) backs the Java side of the comparison.

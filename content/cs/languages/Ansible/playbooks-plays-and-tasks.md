---
title: "Playbooks, Plays, and Tasks"
description: "The three-level structure of an Ansible playbook, why execution is task-major rather than host-major, and where handlers fit in the ordering."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-03-11
updated:
aliases:
  - Ansible Playbooks
  - Plays and Tasks
---

An Ansible playbook has exactly three structural levels and nothing else. A playbook is one or more plays in an ordered list, each play runs one or more tasks, and each task calls an Ansible module. The terms are sports analogies, and the analogy holds up: the playbook is the game plan, each play executes part of the overall goal, and the tasks are the individual movements.

The interesting part is not the nesting. It is the order the engine walks it in, which is not the order a shell script would walk it in, and which decides what "this playbook failed" actually means.

> [!note] The idea
> A playbook is a nested loop whose outer variable is the task, not the host. Ansible executes each task in order, one at a time, against all machines matched by the host pattern, and only after a task has executed on all target machines does it move to the next task. Anyone porting a per-host shell script expects the opposite: finish host A, then host B. Inverting the loop is what makes a play a synchronization barrier, so every managed node reaches step three before any node reaches step four, and it is why a partial failure leaves your fleet at a known, uniform point in the sequence rather than scattered.

## Play: a host set plus a task list

At a minimum, each play defines two things: the managed nodes to target (using a pattern) and at least one task to execute. Everything else is optional decoration on those two bindings. The pattern side is covered in [[cs/languages/Ansible/inventory-and-host-patterns|inventory and host patterns]]; the task side is a list of module invocations.

Multiple plays in one playbook are how a single run orchestrates a multimachine deployment, running one play on your webservers, another play on your database servers, and a third on your network infrastructure. For a network engineer that third case is the one that matters, because the play boundary is also the boundary where the connection method and credentials change. A play sets keywords like `remote_user`, the user account for the SSH connection, and playbook keywords set at the playbook, play, or task level can control the connection plugin, whether to use privilege escalation, and how to handle errors.

For Ansible 2.10 and later you should use the fully-qualified collection name in playbooks, because multiple collections can contain modules with the same name. `ansible.builtin.service` rather than bare `service`. The ambiguity this resolves is a namespacing problem, the same one covered generally in [[cs/pl/modules-signatures-and-separate-compilation|module systems]]: two independently authored collections can each define `user`, and the short name has no way to say which one you meant.

## Execution order, and the two rules that follow from it

A playbook runs in order from top to bottom, and within each play, tasks also run in order from top to bottom. Layered on that, the default strategy runs each task on all affected hosts before starting the next task on any host, using 5 forks. That default is called the `linear` strategy, and it is a plugin you can replace: the `free` strategy allows each host to run until the end of the play as fast as it can, which converts the synchronization barrier back into independent per-host execution.

Two consequences follow from the linear default.

First, failure is per-host and sticky. If a task fails on a host, Ansible removes that host from the rotation for the rest of the playbook. The run does not abort; it continues with a smaller host set. This is why the end-of-run summary keeps general failures and fatal "unreachable" communication attempts separate in the counts. A device that dropped its SSH session is a different operational problem from a device where your config template was wrong, and the recap refuses to conflate them.

Second, re-running is the normal recovery. Most Ansible modules check whether the desired final state has already been achieved and exit without performing any actions if that state has been achieved, so repeating the task does not change the final state. Modules that behave this way are idempotent. The full argument for why that property is what makes the declarative model work at all lives in [[cs/languages/common/declarative-models-and-idempotence|declarative models and idempotence]]. The caveat the docs attach is worth carrying: not all playbooks and not all modules behave this way, so test in a sandbox before running repeatedly in production.

## Handlers: the deferred task list

A play has a fourth slot that breaks the top-to-bottom reading, and it exists for one specific pattern: restart the service only if the config actually changed.

Handlers are tasks that only run when notified. A task carries a `notify` keyword listing handler names, and those handlers are notified on a task change. By default, handlers run after all the tasks in a particular play have been completed, and notified handlers execute automatically after each of these sections in this order: `pre_tasks`, `roles`/`tasks`, and `post_tasks`.

Three behaviors here trip people up, and all three are documented rather than emergent.

- Handlers execute in the order they are defined in the `handlers` section, not in the order listed in the `notify` statement. Your notify list is a set, not a sequence.
- Notifying the same handler multiple times results in executing the handler only once regardless of how many tasks notify it. Ten tasks touching one config file bounce the daemon once.
- With a loop, handlers are triggered if the task as a whole is changed, and the changed state is set if any of the loop items are changed. Any change triggers all of the handlers.

If you need handlers to run before the end of the play, `meta: flush_handlers` triggers any handlers that have been notified at that point. After a flush, whether automatic or manual, handlers can be notified and run again in later sections of the play.

> [!example] Why the deferral is the right default
> Template out `/etc/frr/frr.conf` and `/etc/frr/daemons` in two tasks, both notifying `Restart frr`. Under naive top-to-bottom execution the daemon bounces twice, and the first bounce reloads a half-updated config. Deferring to the end of the play means the routing process restarts exactly once, against a fully written configuration. The handler is not an event callback; it is a deduplicated task queue drained at a barrier.

## Verification before execution

Because the structure is data rather than code, the whole playbook can be inspected without running it. `ansible-playbook` offers `--check`, `--diff`, `--list-hosts`, `--list-tasks`, and `--syntax-check`. Check mode executes a playbook without applying any alterations, running the playbook normally but reporting on the changes it would have made instead of implementing modifications, including file modifications, command execution, and module calls. That report is only trustworthy because of idempotence: a module that can predict its own effect is a module that can describe it without performing it.

## Related Notes

- [[cs/languages/common/declarative-models-and-idempotence|Declarative Models and Idempotence]] - why re-running a converged playbook is safe, and what the declarative surface hides
- [[cs/languages/Ansible/inventory-and-host-patterns|Inventory and Host Patterns]] - what the `hosts:` line of a play actually resolves against
- [[cs/languages/Ansible/roles-and-reuse|Roles and Reuse]] - the packaging unit a play pulls in instead of an inline task list
- [[cs/pl/modules-signatures-and-separate-compilation|Modules, Signatures, and Separate Compilation]] - the namespacing problem fully-qualified collection names solve
- [[cs/software-engineering/continuous-delivery-and-deployment|Continuous Delivery and Deployment]] - playbooks as the push step in a deployment pipeline

## Sources

- "Ansible playbooks," Ansible Community Documentation. https://docs.ansible.com/ansible/latest/playbook_guide/playbooks_intro.html . Supports the playbook/play/task/module hierarchy and sports analogy, top-to-bottom ordering, the two minimum contents of a play, the multi-play webserver/database/network-infrastructure example, `remote_user` and playbook keywords, FQCN guidance, task-major execution, host removal on failure, the separate unreachable counts, desired state and idempotency, check mode, and the verification flags.
- "Handlers: running operations on change," Ansible Community Documentation. https://docs.ansible.com/ansible/latest/playbook_guide/playbooks_handlers.html . Supports handlers running only when notified, the `notify` keyword, definition-order execution, single execution regardless of notification count, loop-change semantics, the `pre_tasks`/`roles`-`tasks`/`post_tasks` flush order, and `meta: flush_handlers`.
- "Controlling playbook execution: strategies and more," Ansible Community Documentation. https://docs.ansible.com/ansible/latest/playbook_guide/playbooks_strategies.html . Supports the default of running each task on all hosts before the next task with 5 forks, the name `linear` for that default, and the `free` strategy letting each host run to the end of the play independently.

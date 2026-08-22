---
title: Handlers and notify Semantics
description: "A handler is an entry in one global name-keyed table drained at section boundaries, not an event subscription. That explains the shadowing, the listen keyword, and the failure mode where the restart never happens."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-07-16
updated:
aliases:
  - Ansible Handlers
  - notify and listen
---

The pitch for handlers is narrow and convincing: restart the service only if the configuration actually changed. A task carries `notify`, the handler runs at the end of the play, and ten tasks touching one config file bounce the daemon once. That much appears in every tutorial and is developed alongside the play structure in [[cs/languages/Ansible/playbooks-plays-and-tasks|playbooks, plays, and tasks]]. The parts that bite come from what a handler actually is.

> [!note] The idea
> A handler is not an event subscription. It is an entry in one table, keyed by name, scoped to the entire play, and drained at fixed section boundaries. "There is only one global, play-level scope for handlers regardless of where the handlers are defined, either in the `handlers:` section or in roles." Two consequences follow that no amount of careful `notify` writing avoids. Names collide across every role in the play, and on collision "only the last one loaded into the play can be notified and executed, effectively shadowing all of the previous handlers with the same name." And because the table is drained at the end of a section rather than at the moment of the change, a later failure on a host discards that host's pending entries: the deferral that deduplicates your restarts is the same deferral that skips them.

## The insertion order, and why it decides who wins

Since the table is global and last-loaded wins, load order is the whole game. The documented order in which handlers enter a play is:

1. Handlers from roles in the `roles:` section.
2. Handlers from the `handlers:` section.
3. Handlers from roles statically imported with `import_role`.
4. Handlers from roles dynamically included with `include_role`, available only after that task has executed.

A play-level `Restart nginx` therefore shadows one that arrived from a role in `roles:`, and a late `include_role` shadows both. The docs give a disambiguation form, notify `role_name : handler_name`, and follow it with advice that is short and load bearing: "each handler should have a globally unique name."

The `listen` keyword exists to make that survivable. Handlers can subscribe to a topic, several handlers can listen to the same topic, and "notifying the `restart web services` topic results in executing all handlers listening to that topic regardless of how those handlers are named." That decouples the notifier from the handler's name, which the docs point out is what makes handlers shareable between playbooks and roles, especially third-party roles from Galaxy. A publisher naming a topic and subscribers registering against it is a different and better structure than the name-keyed table underneath, bolted on top of it.

## Ordering, and the discipline Ansible declines

Handlers execute in the order they are defined in the `handlers` section, not the order they appear in a `notify` statement. That is worth stating as a design decision rather than a quirk. The engine has, at flush time, a set of notified handler names and a set of definitions. It could sort them by declared dependency, the way the ordering discipline in [[cs/dsa/topological-sorting|topological sorting]] arranges a build. It does not. It walks the definition list in textual order and runs the ones that were notified.

So the sequence in which your services restart is decided by the order you happened to write the handler blocks, and a `notify: [Restart database, Restart app]` gives you the reverse if the handler file lists them the other way around. Anyone who needs a real ordering has to encode it in the definition file and keep it there.

## Where the queue is drained

By default handlers run after all tasks in the play are complete, and notified handlers execute automatically after each of `pre_tasks`, `roles`/`tasks`, and `post_tasks`, in that order. Handlers notified within the `roles` section are automatically flushed at the end of the tasks section. `meta: flush_handlers` drains the queue early at any point you choose, and after a flush, automatic or manual, handlers can be notified and run again in a later section.

That last clause turns a handler into something reusable within a play rather than a once-per-run event, which matters for a rolling configuration change where you want a reload after each stage rather than one at the very end.

> [!warning] The failure mode that costs an outage
> "If a task notifies a handler but another task fails later in the play, by default the handler does not run on that host, which may leave the host in an unexpected state." The documentation's own example is the exact scenario people hit: the configuration file is updated, the restart is queued, an unrelated later task fails, and the service is now running with a config on disk that it has never read. The next unrelated restart, weeks later, applies a change nobody remembers making. The fix is `--force-handlers`, `force_handlers: True` in the play, or `force_handlers = True` in `ansible.cfg`, after which "Ansible will run all notified handlers on all hosts, even hosts with failed tasks." The caveat is honest: certain errors, a host becoming unreachable among them, still prevent the handler from running. Compare a language with unwinding, where the mechanism in [[cs/pl/exceptions-handlers-and-non-local-control|exceptions, handlers, and non-local control]] guarantees deferred cleanup runs on the way out of a failure. Ansible's deferred work is not guaranteed, and the flag that makes it near-guaranteed is off by default.

## What can and cannot be a handler

The restrictions are worth memorizing because each one has cost somebody an afternoon.

- A handler cannot run `import_role` or `include_role`.
- Handlers ignore tags, so tag-based narrowing of a run does not narrow them.
- Notifying a dynamic include such as `include_tasks` as a handler executes every task inside it, and it is not possible to notify a handler defined inside a dynamic include.
- A static `import_tasks` used as a handler is effectively rewritten by the handlers inside that import before execution. The import itself cannot be notified, but the tasks within it can be notified individually.
- Since 2.14 `meta` tasks can be used and notified as handlers, with `flush_handlers` excluded to prevent unexpected behavior.

The rule about variables in handler names belongs in the same list and is the subtlest. Handler names are templated early, so a handler named `Restart {{ web_service_name }}` may be evaluated before that variable has a value, and "if the variable used in the handler name is not available, the entire play fails." Changing the variable mid-play does not create a new handler. The documented approach is to keep variables in the handler's task parameters, where they are resolved at execution time, and to leave the name a literal.

## Notification is a function of changed, and changed is configurable

A handler fires on a change, and a change is whatever the module says it is, which `changed_when` lets you override. Setting `changed_when: true` on a copy task makes it always report changed and therefore always notify. Under a loop the aggregation described in [[cs/languages/Ansible/loops-and-the-item-abstraction|loops and the item abstraction]] applies: the task as a whole is changed if any iteration changed, so one changed item in a fifty-item loop notifies every handler that task lists.

So the "only if it actually changed" guarantee is exactly as strong as the module's change detection and whatever `changed_when` expressions you wrote over it.

## Related Notes

- [[cs/languages/Ansible/playbooks-plays-and-tasks|Playbooks, Plays, and Tasks]] - where handlers sit in the play's execution order
- [[cs/languages/Ansible/roles-and-reuse|Roles and Reuse]] - the packaging boundary that handler names cross whether you want them to or not
- [[cs/languages/Ansible/strategies-linear-free-and-forks|Strategies, linear, free, and forks]] - the barrier that decides when the queue is drained
- [[cs/pl/exceptions-handlers-and-non-local-control|Exceptions, Handlers, and Non-Local Control]] - deferred work with a guarantee, for contrast
- [[cs/languages/Go/defer-panic-and-recover|defer, panic, and recover]] - the same idea at function scope, where the deferral is unconditional
- [[cs/dsa/topological-sorting|Topological Sorting]] - the dependency ordering Ansible declines to compute for notified handlers

## Sources

- "Handlers: running operations on change," Ansible Community Documentation. https://docs.ansible.com/ansible/latest/playbook_guide/playbooks_handlers.html . Supports handlers running only when notified, definition-order execution and single execution regardless of notification count, loop change semantics, the `listen` topic mechanism and its decoupling rationale, the requirement for globally unique handler names and the shadowing rule, the four-step insertion order, the `role_name : handler_name` form, the automatic flush points and `meta: flush_handlers` with re-notification afterwards, role handlers being flushed at the end of the tasks section, the templating problem with variables in handler names, the include and import restrictions, meta tasks as handlers from 2.14, and the limitations on `import_role`, `include_role`, and tags.
- "Error handling in playbooks," Ansible Community Documentation. https://docs.ansible.com/ansible/latest/playbook_guide/playbooks_error_handling.html . Supports handlers not running on a host after a later task failure, the configuration-changed-but-service-not-restarted example, and the `--force-handlers` option with its unreachable-host caveat.

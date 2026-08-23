---
title: Strategies, linear, free, and forks
description: "The strategy plugin is Ansible's scheduler: linear turns every task into a barrier, forks caps the worker pool at five, and the order keyword refuses to promise what most people assume it does."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-08-11
updated:
aliases:
  - Ansible Strategy Plugins
  - serial and throttle
---

Ansible's default execution behavior is one sentence long: "by default, Ansible runs each task on all hosts affected by a play before starting the next task on any host, using 5 forks." Both halves of that are choices, both are replaceable, and neither is what a reader coming from shell scripting expects.

The first half is a strategy. "The default behavior described above is the `linear` strategy," and "all strategies are implemented as strategy plugins," so the rule that a task must finish everywhere before the next one starts is not built into the engine. Swap the plugin and the rule changes. The `free` strategy "allows each host to run until the end of the play as fast as it can," and a `debug` strategy exists for interactive troubleshooting.

> [!note] The idea
> The strategy plugin is a scheduler, and `linear` schedules barriers. Every task boundary is a synchronization point across the whole host set, which means a play's runtime is the sum, over tasks, of the slowest host for that task. `free` removes the barriers and gives the sum, over hosts, of that host's own total, taking the maximum across hosts. The second quantity is never larger than the first, and can be far smaller when different hosts are slow at different steps. What you pay for the faster number is the guarantee that made the barrier worth having: under `linear`, a failure anywhere leaves the whole fleet at a known uniform point in the sequence, and under `free` it leaves each host wherever it happened to be.

## Forks is a pool, not a promise

The number 5 is `DEFAULT_FORKS`, documented as the "maximum number of forks Ansible will use to execute tasks on target hosts," settable in `ansible.cfg` or with `-f` on the command line. It is a worker pool size on the control node, in the sense used by [[cs/systems/processes-and-threads|processes and threads]], and every task against every host has to pass through it.

Getting this backwards is the most common Ansible performance mistake. Running a play against four hundred hosts does not open four hundred connections. It opens five, retires them, opens five more, and repeats eighty times per task, with a barrier at the end of each task under the default strategy. The control node is doing the templating, the module assembly, and the result processing for all of it in one process, so raising forks trades control node CPU and memory against wall clock. The docs frame the choice exactly that way: "if you have the processing power available and want to use more forks."

## The keywords that are not strategies

Four keywords adjust execution without replacing the scheduler, and the documentation is careful to say so: "these keywords are not strategies. They are directives or options applied to a play, block, or task."

`serial` sets a batch size. Ansible "completes the play on the specified number or percentage of hosts before starting the next batch of hosts," so six webservers with `serial: 3` run both tasks on the first three, print a play recap, then run both tasks on the next three. That is the rolling update primitive, and it changes failure semantics along with timing: "setting the batch size with `serial` changes the scope of the Ansible failures to the batch size, not the entire host list." Batches can be given as a number, a percentage, a list, or a mix, which is how a canary pattern is written: `serial: [1, 5, 20%]` proves the change on one host, then five, then a fifth of the fleet at a time. Percentages round in a documented way, with the final pass taking the remainder, and "no matter how small the percentage, the number of hosts per pass will always be 1 or greater."

`throttle` limits the number of workers for a particular task or block, for work that is CPU heavy on the control node or hits a rate-limited API. It only ever narrows: "you can reduce the number of workers with `throttle`, but you cannot increase it," so a `throttle` above your `forks` or `serial` setting does nothing at all.

`order` controls which host goes next, with `inventory`, `reverse_inventory`, `sorted`, `reverse_sorted`, and `shuffle`. The documentation's note on the default is the interesting part, because it withdraws a guarantee most people assume they have.

> [!warning] Inventory order is not file order
> "The 'inventory' order does not equate to the order in which hosts/groups are defined in the inventory source file," but rather the order in which a selection is returned from the compiled inventory. The docs call it backwards compatible and reproducible but "not normally predictable," and explain why: with host patterns, limits, inventory plugins, and multiple sources all feeding one compiled inventory, "it is almost impossible to return such an order. For simple cases, this might happen to match the file definition order, but that is not guaranteed." So a `serial: 1` rollout that appears to follow your inventory file is following it by coincidence. If the first host to receive a change matters, and during a canary deployment it does, `order: sorted` plus a naming convention is the only version of that intent the engine will honor.

`run_once` runs a task on the first host in the current batch and applies its results and facts to all hosts in the same batch, which interacts with `serial` in a way worth knowing before you rely on it, and which is developed in [[cs/languages/Ansible/delegation-run-once-and-local-actions|delegation, run_once, and local actions]].

## Choosing between the two strategies

The tradeoff resolves differently depending on what a play is for.

Use `linear` when tasks are coupled across hosts. Anything where step four on any machine assumes step three finished everywhere (a cluster join, a schema migration followed by an application deploy, a config push followed by a fleet-wide reload) depends on the barrier and breaks quietly without it. The barrier is also what makes the failure story legible, since a fleet stopped uniformly at task seven is a state you can reason about, described further in [[cs/languages/Ansible/playbooks-plays-and-tasks|playbooks, plays, and tasks]].

Use `free` when hosts are genuinely independent and the play is long, which is the classic slow-provisioning case where one machine's package installation should not hold the others at a barrier. The scheduling question is the same one that [[cs/systems/process-scheduling-algorithms|process scheduling]] asks: whether to enforce a global ordering that simplifies reasoning, or to let independent work proceed and accept a less predictable global state.

The pairing that catches people is `free` with handlers or with any task that reads another host's facts. Both assume something has already happened elsewhere, and `free` is precisely the promise that nothing has.

## Related Notes

- [[cs/languages/Ansible/playbooks-plays-and-tasks|Playbooks, Plays, and Tasks]] - the task-major ordering the linear strategy implements
- [[cs/languages/Ansible/delegation-run-once-and-local-actions|Delegation, run_once, and Local Actions]] - what happens to the host loop when a task is pinned to one machine
- [[cs/languages/Ansible/handlers-and-notify-semantics|Handlers and notify Semantics]] - deferred work whose timing depends on the barrier the strategy provides
- [[cs/systems/process-scheduling-algorithms|Process Scheduling Algorithms]] - the general form of the ordering-versus-throughput choice a strategy plugin makes
- [[cs/systems/processes-and-threads|Processes and Threads]] - what a fork actually costs on the control node
- [[cs/languages/Ansible/the-execution-model-and-module-transfer|The Execution Model and Module Transfer]] - the per-task work each of those five workers is doing

## Sources

- "Controlling playbook execution: strategies and more," Ansible Community Documentation. https://docs.ansible.com/ansible/latest/playbook_guide/playbooks_strategies.html . Supports the default of one task across all hosts with 5 forks, the `linear` name for that default, the `free` and `debug` strategies, strategies being implemented as plugins, setting forks in configuration or on the command line, the statement that `serial`, `throttle`, `order`, and `run_once` are directives rather than strategies, `serial` batch behavior including percentages, lists, remainder handling, the one-host minimum, and the change in failure scope, `throttle` limiting but never raising worker counts, the five `order` values, the caveat that inventory order is not source file order, and `run_once` applying results and facts to the batch.
- "Ansible Configuration Settings," Ansible Community Documentation. https://docs.ansible.com/ansible/latest/reference_appendices/config.html . Supports `DEFAULT_FORKS` as the maximum number of forks used to execute tasks on target hosts, with a default of 5.

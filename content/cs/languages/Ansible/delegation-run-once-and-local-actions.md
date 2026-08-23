---
title: Delegation, run_once, and Local Actions
description: "delegate_to changes where a task runs without changing whose task it is, which is why N hosts delegating to one load balancer opens N concurrent connections to it."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-06-13
updated:
aliases:
  - delegate_to
  - local_action
---

"By default, Ansible gathers facts and executes all tasks on the machines that match the hosts line of your playbook." Delegation is the exception, and the motivating case in the documentation is the one everybody meets first: updating webservers requires removing each from a [[cs/networking/load-balancing-l4-and-l7|load-balanced pool]], and "you cannot perform this task on the webservers themselves. By delegating the task to localhost, you keep all the tasks within the same play."

That framing is worth holding onto, because it says what delegation is for. It is not a way to run a task somewhere else. It is a way to keep a task that concerns host A inside host A's iteration of the play, while executing it on host B.

> [!note] The idea
> `delegate_to` changes where a task executes without changing whose task it is. The host loop still runs once per targeted host, so a play across forty webservers with a delegated pool-removal task produces forty separate executions against the load balancer, not one. The engine says so directly: "delegating a task does not change this and does not handle concurrency issues (multiple forks writing to the same file)," and those forks "will still operate in parallel forks (default 5) and overwrite each other." Every surprise in this area comes from expecting delegation to collapse the loop. It does not. `run_once` is the separate keyword that does.

## What travels to the delegate, and what stays behind

Variable resolution splits along a line that is easy to state and easy to forget. Connection-side values come from the delegate. Identity stays with the original host.

The docs list the concrete rule: under delegation "the execution interpreter (normally Python), `connection`, `become`, and `shell` plugin options will now be templated using values from the delegated to host. All variables except `inventory_hostname` will now be consumed from this host and not the original task host." Getting a value from the original host requires `hostvars[inventory_hostname]['varname']`, and the warning attached is that even `inventory_hostname_short` refers to the delegated host. So `ansible_host` and the other connection variables "reflect information about the host a task is delegated to, not the `inventory_hostname`," and "the host to which a task is delegated does not inherit variables from the host that is delegating the task."

A related warning covers delegating to a machine that is not in inventory. You can do it by giving an address or DNS name, but "doing so does not add the host to your inventory and might cause issues," and such hosts do inherit variables from the `all` group. The documented alternative is `add_host` if you genuinely need the machine to exist in inventory.

Some tasks cannot be delegated at all. "Some tasks are always executed on the control node," including `include`, `add_host`, and `debug`, and there is a general test rather than a list to memorize: if a module's connection attribute indicates support is `False` or `None`, the action does not use a connection and cannot be delegated. That is a clean criterion. Delegation redirects a connection, so an action with no connection has nothing to redirect.

`local_action` is shorthand for delegating to the control node, with an `args:` block when the module takes more than a trivial argument. The example the docs give is calling `rsync` locally to copy files recursively to the target, which is the classic case where the tool you need runs better from the control node than from the managed one.

## run_once, and the batch it is scoped to

`run_once` is the keyword that actually collapses the loop. Ansible "executes this task on the first host in the current batch and applies all results and facts to all the hosts in the same batch," which the docs contrast with the naive `when: inventory_hostname == ...` equivalent: the conditional runs the task once too, but only the chosen host gets the results.

Three details decide whether it does what you meant.

- With `serial`, tasks marked `run_once` run once per batch, not once per play. The docs point at a conditional against the play's full host list, `ansible_play_hosts_all`, for genuinely once-per-run behavior.
- Any `when:` on a `run_once` task "will use the variables of the 'first host' to decide if the task runs or not, no other hosts will be tested." One host's facts decide for everyone.
- Combining `run_once: true` with `delegate_to:` pins the single execution to a named machine instead of whichever host happens to be first, and the docs note the usual delegation consequence still applies: the action executes on the delegated host, but the information is still that of the original host in the task.

> [!warning] Delegation plus parallelism is a lost update waiting to happen
> The failure the docs call out by name is updating one file on one delegated host for every host in the play, with `copy`, `template`, or `lineinfile`. Five workers write concurrently and overwrite each other. This is the ordinary interleaving hazard described in [[cs/security/race-conditions-and-toctou|race conditions and TOCTOU]] arriving through a mechanism that looks nothing like a thread. The three documented remedies are the ones you would derive from first principles: serialize the writers with `throttle: 1` or an intermediate play at `serial: 1`, or collapse the loop entirely with `run_once: true` and iterate the host list inside the single task using `loop: "{{ ansible_play_hosts_all }}"`. The last one is the interesting shape. It converts an implicit parallel loop over hosts into one explicit sequential loop over host names, which is exactly the move a programmer makes to fix a data race by giving one writer the whole job.

## Delegating facts

Facts follow the same identity rule as everything else, and the docs justify it with an analogy about groceries belonging to you even when someone else delivers them: "any facts gathered by a delegated task are assigned by default to the `inventory_hostname` (the current host), not to the host that produced the facts."

`delegate_facts: true` flips that, and the worked example is genuinely useful. A play targeting `app_servers` can gather facts from every machine in `dbservers` by delegating `setup` in a loop with `delegate_facts: true`, after which `hostvars['dbhost1']['ansible_default_ipv4']['address']` resolves even though the database servers were never part of the play, or were excluded by `--limit`. That is how one host's configuration file comes to contain a machine's address that this run never targeted, and it pairs with the caching discussed in [[cs/languages/Ansible/fact-gathering-and-caching|fact gathering and caching]].

## Running the whole thing locally

The degenerate case of delegation is a play that never leaves the control node. Setting `hosts: 127.0.0.1` with `--connection=local`, or `connection: local` on a single play, runs the playbook against the local machine, which the docs suggest for putting a playbook in a crontab or running one inside an OS installer such as an Anaconda kickstart. The attached caveat is a real trap: with `connection: local` and no `ansible_python_interpreter` set, modules run under `/usr/bin/python` rather than the interpreter running the playbook, and the recommended alternatives are `local_action` or `delegate_to: localhost`.

## Related Notes

- [[cs/languages/Ansible/strategies-linear-free-and-forks|Strategies, linear, free, and forks]] - the parallelism that delegation inherits and does not manage
- [[cs/languages/Ansible/fact-gathering-and-caching|Fact Gathering and Caching]] - the other route to one host's data while configuring another
- [[cs/languages/Ansible/inventory-and-host-patterns|Inventory and Host Patterns]] - why delegating outside inventory is a warning rather than a feature
- [[cs/systems/processes-and-threads|Processes and Threads]] - the parallel workers whose concurrency delegation explicitly does not manage
- [[cs/security/race-conditions-and-toctou|Race Conditions and TOCTOU]] - the concurrent-writer hazard delegation creates against a shared file
- [[cs/languages/Ansible/the-execution-model-and-module-transfer|The Execution Model and Module Transfer]] - what a redirected connection actually redirects

## Sources

- "Controlling where tasks run: delegation and local actions," Ansible Community Documentation. https://docs.ansible.com/ansible/latest/playbook_guide/playbooks_delegation.html . Supports the default of executing tasks on hosts matching the play, the load balancer motivation, the list of tasks that cannot be delegated and the connection attribute test, `delegate_to` with `serial` and the `local_action` shorthand including the rsync example, the connection variable and non-inheritance rules, the non-inventory host warning and `add_host` alternative, the delegation templating rule and `hostvars[inventory_hostname]` workaround, the parallel execution and overwriting hazard with its three remedies, fact delegation defaults and `delegate_facts: true` with the dbservers example, and local playbook execution with the interpreter caveat.
- "Controlling playbook execution: strategies and more," Ansible Community Documentation. https://docs.ansible.com/ansible/latest/playbook_guide/playbooks_strategies.html . Supports `run_once` executing on the first host in the batch and applying results and facts to the whole batch, the comparison with an equivalent conditional, combining `run_once` with `delegate_to`, once-per-batch behavior under `serial`, and conditionals on a `run_once` task being evaluated with the first host's variables only.

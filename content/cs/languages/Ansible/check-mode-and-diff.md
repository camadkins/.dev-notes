---
title: Check Mode and Diff
description: "Dry run is a flag the engine sets and each module chooses to honor. Support is opt-in and off by default, so a clean check run is partly a report about tasks that were never evaluated."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-06-24
updated:
aliases:
  - ansible-playbook --check
  - Ansible Dry Run
---

Ansible ships two validation modes that can be used separately or together. "In check mode, Ansible runs without making any changes on remote systems," and "in diff mode, Ansible provides before-and-after comparisons." A dry run is a first-class execution mode rather than a linting pass, which is unusual and genuinely useful. It is also weaker than most people assume, and the weakness is structural rather than a set of bugs.

> [!note] The idea
> Check mode is an honor system with an opt-out default. The engine sets a flag and ships it with the task; each module decides what to do with it. A module declares support by passing `supports_check_mode=True` when constructing `AnsibleModule`, and "if `supports_check_mode=False` is specified, which is the default value, the module will exit in check mode with `skipped=True`" and a message saying the module does not support check mode. So the guarantee splits three ways. Modules that support check mode "report the changes they would have made." Modules that do not "report nothing and do nothing." And the second group is the default group. A green check run is partly a claim about what would change and partly a report about what was never evaluated.

## What a module has to implement

The mechanism is small enough to state completely. `supports_check_mode=True` goes in the `AnsibleModule()` call, and inside the module body, "the module can determine whether it is called in check mode by checking the boolean value `module.check_mode`. If it evaluates to `True`, the module must take care not to do any modification."

Read that as a contract with two obligations, only one of which is enforceable. The module must not change anything, and it must still return a truthful `changed` prediction. The framework can do nothing about either. It cannot verify that a module honored the flag, and it cannot check that a prediction was accurate. What makes the arrangement work at all is the property discussed in [[cs/languages/common/declarative-models-and-idempotence|declarative models and idempotence]]: a module that can compare desired state against current state in order to decide whether to act can answer the same question without acting. Prediction and idempotence are the same capability queried differently, which is why the modules that are good at one tend to be good at the other, and why `command` and `shell` are bad at both.

## The three ways the report diverges from reality

The documentation is honest about the first divergence and states it in one line: "check mode is just a simulation. It will not generate output for tasks that use conditionals based on registered variables (results of prior tasks)."

That single sentence contains the whole problem. In a real run, task three registers a result, task seven reads it, and the branch is taken or not. In a check run, task three may have been skipped for lack of check mode support, so its registered result is absent or empty, so task seven's condition evaluates against nothing. The tasks most likely to be missing are the ones a playbook uses to discover state, and the tasks most likely to depend on them are the ones that actually change something. The simulation is least accurate precisely where the playbook is most dynamic.

The second divergence is that skipping cascades. One unsupported module early in a play removes a file, a service, or a package that later tasks assume exists, and every downstream prediction is now made against a machine state that the real run would never produce.

The third is that check mode is per task, adjustable in both directions. Since 2.2, `check_mode: true` forces a task to run in check mode even without `--check`, and `check_mode: false` forces a task to make real changes even during a `--check` run. That second one is used routinely and legitimately, usually for a read-only `command` that gathers state, and it means a `--check` run is not guaranteed to be side-effect free. The docs also suggest `ansible_check_mode`, a magic variable set to true during check mode, for skipping a task with `when: not ansible_check_mode` or softening it with `ignore_errors: "{{ ansible_check_mode }}"`. Every one of those is a place where the dry run and the real run take different paths by design.

> [!warning] What a clean check run does and does not tell you
> It tells you that the playbook parses, that host patterns resolve, that templates render, that variables are defined, and that the supporting modules predict no changes. It does not tell you that the play will succeed, because the tasks that would have failed may not have run. This is the same class of confidence problem as [[cs/software-engineering/code-coverage-and-its-limits|code coverage]]: a high number describes what was exercised, not what was verified, and the untested remainder is not distributed randomly. It clusters in the code nobody could easily exercise, which in Ansible is precisely the imperative escape hatches.

## Diff mode

`--diff` can be used alone or with `--check`. Used with it, "any module that supports diff mode reports the changes made or, if used with `--check`, the changes that would have been made." Diff is most common in modules that manipulate files, `template` being the obvious case, though others such as `user` can show before-and-after information too.

Two operational notes come with it. "Diff mode produces a large amount of output, so it is best used when checking a single host at a time," with the documented invocation combining `--check --diff --limit` against one host. And because "the `--diff` option can reveal sensitive information," a task can suppress its own diff with `diff: false`, which the docs demonstrate on a template writing a secret file with mode `0600`. A rendered secret is exactly the thing a diff would print in full, so the control is necessary, and it is also one more place where the report is quietly incomplete by design.

Support is declared separately from check mode support. Modules advertise `check_mode` and `diff_mode` as distinct attributes, and a module can support one without the other, which is why `--check --diff` sometimes prints a change with no accompanying diff.

## How to use it without trusting it too far

The mode earns its place as a fast structural check rather than a proof. The pairing that works is check mode for the things it is genuinely reliable about, then a real run against one host, then the fleet, with the batching described in [[cs/languages/Ansible/strategies-linear-free-and-forks|strategies, linear, free, and forks]] doing the actual risk management. That sequencing is the ordinary layered approach of [[cs/software-engineering/testing-strategies|testing strategies]], with `--check` occupying the cheap-and-shallow rung rather than standing in for the whole ladder.

The other habit worth building is reading a check run for skips rather than for changes. Every `skipped` line reading "does not support check mode" marks a place where the simulation stopped simulating, and counting those tells you how much of the playbook the dry run actually covered.

## Related Notes

- [[cs/languages/common/declarative-models-and-idempotence|Declarative Models and Idempotence]] - the property that makes accurate prediction possible in the first place
- [[cs/languages/Ansible/the-execution-model-and-module-transfer|The Execution Model and Module Transfer]] - the flag's journey from the command line into the module's parameters
- [[cs/languages/Ansible/fact-gathering-and-caching|Fact Gathering and Caching]] - one of the few things that runs for real during a check run
- [[cs/software-engineering/testing-strategies|Testing Strategies]] - where a dry run belongs relative to real verification
- [[cs/software-engineering/code-coverage-and-its-limits|Code Coverage and Its Limits]] - the same shape of misleading confidence measure
- [[cs/languages/Ansible/why-ansible-has-no-generics|Why Ansible Has No Generics]] - why runtime simulation is the only static analysis available here

## Sources

- "Validating tasks: check mode and diff mode," Ansible Community Documentation. https://docs.ansible.com/ansible/latest/playbook_guide/playbooks_checkmode.html . Supports the definitions of check mode and diff mode, modules that do not support check mode reporting and doing nothing, check mode being a simulation that produces no output for tasks conditioned on registered variables, per-task `check_mode: true` and `check_mode: false` from 2.2 with the earlier `always_run` notation, the `ansible_check_mode` magic variable with its skip and ignore-errors examples, diff mode reporting changes made or that would have been made, the large output and single-host recommendation, and `diff: false` for tasks whose output could reveal sensitive information.
- "Ansible module architecture," Ansible Community Documentation. https://docs.ansible.com/ansible/latest/dev_guide/developing_program_flow_modules.html . Supports declaring check mode support with `supports_check_mode=True`, the `module.check_mode` boolean and the obligation not to modify anything, and the default of `supports_check_mode=False` causing the module to exit as skipped with an explanatory message.
- "setup module," Ansible Community Documentation. https://docs.ansible.com/ansible/latest/collections/ansible/builtin/setup_module.html . Supports check mode and diff mode being advertised as separate module attributes, with the setup module declaring full check mode support and none for diff mode.

---
title: Ansible
description: Landing page for Ansible. Configuration as a declarative language, where the interesting question is what kind of language YAML-with-modules actually is.
draft: false
comments: false
tags:
  - cs
  - languages
date: 2026-07-22
updated:
aliases: []
---

Ansible earns a place among languages because it forces a question the others do not: what kind of language is a configuration tool? You write YAML that describes a desired end state, not a sequence of steps, and the engine reconciles the machine toward that state. Yet each declarative module is imperative Python underneath, so the declarative surface is a thin skin over ordinary procedural code. That tension, declared intent over imperative mechanism, plus idempotence as the property that makes re-running safe, is what the comparative notes examine.

It is also the section's control case in the opposite direction from Racket. Ansible has no generics because it has no type system, no functions, and no compile step, so the problem generics solve never arises. The folder says that plainly rather than stretching an analogy, then goes looking for what does the work instead: an implicit loop over hosts, a role with parameters and defaults, and a library of Jinja2 filters that behave like the functions the language refuses to have.

### The language surface

What you actually write, and what decides what it means.

- [[cs/languages/Ansible/playbooks-plays-and-tasks|Playbooks, Plays, and Tasks]] - three structural levels, task-major execution, and where handlers fit
- [[cs/languages/Ansible/yaml-as-a-programming-surface|YAML as a Programming Surface]] - a data format doing the job of a syntax, and the two things that bought
- [[cs/languages/Ansible/inventory-and-host-patterns|Inventory and Host Patterns]] - static and dynamic sources, groups, and a pattern that resolves as a set expression
- [[cs/languages/Ansible/variables-and-precedence|Variables and Precedence]] - the twenty-two-slot order, and the inventory merge that runs before it
- [[cs/languages/Ansible/jinja2-templating-and-facts|Jinja2 Templating and Facts]] - control-node rendering, which is what lets one host's configuration depend on another host's reality

### The absence, and what stands in for it

- [[cs/languages/Ansible/why-ansible-has-no-generics|Why Ansible Has No Generics]] - no types, no functions, no compile step, so the problem never arises
- [[cs/languages/Ansible/roles-and-reuse|Roles and Reuse]] - a directory layout as a loading convention, and per-play deduplication that behaves like memoization
- [[cs/languages/Ansible/role-parameters-and-defaults-as-an-interface|Role Parameters and Defaults as an Interface]] - the closest thing to a typed interface, checked on the way in and discarded on the way out
- [[cs/languages/Ansible/loops-and-the-item-abstraction|Loops and the item Abstraction]] - `item` as a shared name rather than a binding
- [[cs/languages/Ansible/filters-and-tests-as-transformations|Filters and Tests as Transformations]] - the nearest thing to a function library, all of it running on the control node
- [[cs/languages/Ansible/collections-as-the-packaging-unit|Collections as the Packaging Unit]] - namespaces, fully qualified names, and one installed version at a time

### The execution model

What actually happens when a play runs, which explains most of the surprises above.

- [[cs/languages/Ansible/the-execution-model-and-module-transfer|The Execution Model and Module Transfer]] - a zipfile shipped over the connection, imported as `__main__`, answered with one JSON document
- [[cs/languages/Ansible/strategies-linear-free-and-forks|Strategies, linear, free, and forks]] - the scheduler: every task a barrier, a worker pool capped at five, and what `order` refuses to promise
- [[cs/languages/Ansible/handlers-and-notify-semantics|Handlers and notify Semantics]] - one global name-keyed table drained at section boundaries, not an event subscription
- [[cs/languages/Ansible/delegation-run-once-and-local-actions|Delegation, run_once, and Local Actions]] - changing where a task runs without changing whose task it is
- [[cs/languages/Ansible/fact-gathering-and-caching|Fact Gathering and Caching]] - a cache coherence decision dressed as a configuration setting

### Control flow in a language that claims not to have any

- [[cs/languages/Ansible/conditionals-and-fact-based-branching|Conditionals and Fact-Based Branching]] - a per-host predicate, the `omit` sentinel, and skipped as a third outcome
- [[cs/languages/Ansible/blocks-rescue-and-always|Blocks, Rescue, and Always]] - grouped error handling with no exception objects, and the four ways it diverges from try and catch
- [[cs/languages/Ansible/error-handling-failed-when-and-changed-when|Error Handling: failed_when and changed_when]] - redefining failure and change, and the keyword idempotence claims actually rest on
- [[cs/languages/Ansible/tags-and-selective-execution|Tags and Selective Execution]] - inheritance as a preprocessing pass, and why arbitrary subsetting is unsound by construction
- [[cs/languages/Ansible/check-mode-and-diff|Check Mode and Diff]] - dry run as a flag each module chooses to honor, so a clean run is partly a report about tasks never evaluated

### The plugin surface

Ansible is small and its plugin taxonomy is large. This is where the extensibility actually lives.

- [[cs/languages/Ansible/module-and-plugin-types|Module and Plugin Types]] - the taxonomy sorted by one question: does this run on the control node or the target
- [[cs/languages/Ansible/dynamic-inventory-and-inventory-plugins|Dynamic Inventory and Inventory Plugins]] - inventory as a program, and caching that turns the host list into a stale read
- [[cs/languages/Ansible/connection-plugins-and-transports|Connection Plugins and Transports]] - three operations rather than a protocol, which is why a container works as a transport
- [[cs/languages/Ansible/callback-plugins-and-output|Callback Plugins and Output]] - no print statement, only a rendering of an event stream

### Secrets, testing, and judgment

- [[cs/languages/Ansible/vault-and-secret-management|Vault and Secret Management]] - what it encrypts, the boundary it refuses to defend, and the key problem it moves up a level
- [[cs/languages/Ansible/no-log-and-output-redaction|no_log and Output Redaction]] - a display filter attached to a task, and the three places the value still reaches a human
- [[cs/languages/Ansible/testing-with-molecule-and-assertions|Testing with Molecule and Assertions]] - converging twice, and what a test means when the program's job is to make a claim true
- [[cs/languages/Ansible/ansible-against-terraform-and-puppet|Ansible against Terraform and Puppet]] - push against pull and ordered tasks against a dependency graph, as two independent axes

### Read from the comparative layer

Ansible anchors the configuration-and-tooling end of the [[cs/languages/common/index|Common Concerns]] cluster:

- [[cs/languages/common/declarative-models-and-idempotence|Declarative Models and Idempotence]] - desired state and idempotence over imperative Python modules
- [[cs/languages/common/build-systems-and-dependency-management|Build Systems and Dependency Management]] - the declared-graph-with-an-engine shape Ansible shares with package managers
- [[cs/languages/common/software-supply-chain-and-provenance|Software Supply Chain and Provenance]] - provenance and reproducibility for the artifacts a run deploys
- [[cs/languages/Python/packaging-wheels-and-environments|Packaging, Wheels, and Environments]] - Ansible is Python underneath, and inherits that supply chain

---

*Any pages placed under this folder are auto-listed below by Quartz.*

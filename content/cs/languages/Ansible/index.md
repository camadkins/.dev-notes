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

Ansible earns a place among languages because it forces a question the others do not: what kind of language is a configuration tool? You write YAML that describes a desired end state, not a sequence of steps, and the engine reconciles the machine toward that state. Yet each declarative module is imperative Python underneath, so the declarative surface is a thin skin over ordinary procedural code. That tension, declared intent over imperative mechanism, plus idempotence as the property that makes re-running safe, is what the comparative notes will examine.

Ansible-specific study collects here.

### The language itself

- [[cs/languages/Ansible/playbooks-plays-and-tasks|Playbooks, Plays, and Tasks]] - the three structural levels, task-major execution, and where handlers fit
- [[cs/languages/Ansible/inventory-and-host-patterns|Inventory and Host Patterns]] - static and dynamic sources, groups, and pattern resolution as a set expression
- [[cs/languages/Ansible/variables-and-precedence|Variables and Precedence]] - the twenty-two-slot order and the inventory merge that runs before it
- [[cs/languages/Ansible/jinja2-templating-and-facts|Jinja2 Templating and Facts]] - discovered facts, control-node rendering, and cross-host configuration
- [[cs/languages/Ansible/roles-and-reuse|Roles and Reuse]] - the directory layout as an interface, and per-play deduplication

### Comparative

It anchors the configuration-and-tooling end of the [[cs/languages/common/index|Common Concerns]] cluster. The comparative notes it belongs to, read from Ansible's angle:

- [[cs/languages/common/declarative-models-and-idempotence|Declarative Models and Idempotence]] - desired state, idempotence, and the declarative surface over imperative Python modules
- [[cs/languages/common/build-systems-and-dependency-management|Build Systems and Dependency Management]] - the declared-graph-with-an-engine shape Ansible shares with package managers
- [[cs/languages/common/software-supply-chain-and-provenance|Software Supply Chain and Provenance]] - provenance and reproducibility for the artifacts a configuration run deploys

---

*Any pages placed under this folder are auto-listed below by Quartz.*

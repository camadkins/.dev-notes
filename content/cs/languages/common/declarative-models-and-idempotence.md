---
title: Declarative Models and Idempotence
description: Describe the end state, not the steps. Why Ansible is a language worth studying, what idempotence buys, and how a declarative surface sits on imperative Python underneath.
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-07-22
updated:
aliases:
  - Declarative Models
  - Idempotence
  - Configuration as Code
---

Most of the languages in this cluster tell the machine what to do, step by step. Ansible tells it what the world should look like and lets the tool work out the steps. That inversion is why a configuration tool earns a place among languages: it is a working example of the declarative model, where you write the destination instead of the route. The paradigm distinction itself, imperative versus declarative, is covered abstractly in [[cs/pl/programming-paradigms-models-of-computation|programming paradigms]]; this note is what it looks like when the declarative model is the whole point of a real, widely deployed language.

Ansible describes infrastructure: install this package, ensure this service is running, put this file here with these permissions, across hundreds of machines. Written imperatively in Python, C++, or a shell script, that would be a sequence of commands, each of which you must guard with a check so it does not break on the second run. Ansible removes the guards by making them the default.

> [!note] The idea
> A declarative language states the desired end state; the engine computes the steps to reach it from wherever the system currently is. This only works if the operations are idempotent: applying them when the system is already in the target state changes nothing. Idempotence is what lets you run the same configuration a hundred times safely, and it is the property that turns "a script you run once and pray" into "a description you can converge toward continuously."

## Desired state versus a sequence of steps

Ansible's own glossary draws the line exactly. Its declarative approach, it says, uses a description of the final state rather than a description of the sequence of steps necessary to achieve that state. You do not write "run `apt install nginx`"; you write "nginx is present," and the engine decides whether that means installing it, doing nothing, or something else. The difference matters because the starting state is unknown and varies per machine: some hosts have the package, some do not, some have the wrong version. An imperative script has to branch on all of that. A declarative description does not mention the current state at all, only the target, and pushes the branching into the engine.

## Idempotence: the property that makes it safe

The mechanism that makes desired-state possible is idempotence. Ansible defines it precisely: an operation is idempotent if the result of performing it once is exactly the same as performing it repeatedly without any intervening actions. A well-written Ansible task checks reality before acting, so "ensure nginx is installed" installs it the first run and reports no change on every run after. That is what lets configuration be re-applied on a schedule to correct drift, the slow divergence of a machine from its intended state, without fear that the tenth run undoes the first. The same idea appears in the idempotent HTTP methods of [[cs/software-engineering/api-design|API design]]: `PUT` the same resource twice and the second call is a safe no-op, exactly like re-running a converged playbook.

Ansible makes the property inspectable. Its check mode runs a playbook with `--check` and reports what would change without changing anything, which is only meaningful because each task can predict its own effect. A tool whose operations were not idempotent could not offer a trustworthy dry run.

## The declarative surface sits on imperative code

The tidiest part of Ansible is also the most revealing about what "declarative" actually means. The YAML you write is declarative, but underneath, each task is carried out by a module, and modules are ordinary imperative code. Ansible's developer guide is explicit that modules are typically written in Python, are standalone scripts Ansible runs on your behalf locally or remotely, and return information by printing a JSON string to stdout before exiting. The declarative model is a thin, honest skin: your description of the end state is dispatched to a pile of imperative Python that does the checking-then-acting, gathers facts about the target first (Ansible's word for the properties it discovers about each node), and reports back what it changed.

This is the general shape of declarative systems, not a quirk of Ansible. SQL is declarative at the surface and a procedural query plan underneath; a build tool's dependency graph is declared and an imperative scheduler walks it. Declarative never means the steps vanished. It means someone moved them below the line you write, into an engine, where idempotence and desired-state reasoning can be enforced once instead of re-implemented in every script.

> [!warning] Declarative is a surface, not an absence of procedure
> The temptation is to think declarative code has no control flow. It has plenty; it is just hidden in the engine. When an Ansible run behaves unexpectedly, the fix usually requires understanding the imperative module underneath, which check it runs and which fact it reads, so the abstraction is a convenience, not a wall. Knowing that the declarative surface bottoms out in imperative [[cs/languages/common/c-abi-and-ffi|Python]] is what lets you debug it.

## Related Notes

- [[cs/pl/programming-paradigms-models-of-computation|Programming Paradigms]] - the imperative-versus-declarative distinction as a general model of computation
- [[cs/pl/levels-of-artificial-languages|Levels of Artificial Languages]] - domain-specific languages like Ansible's YAML as a level above general-purpose code
- [[cs/software-engineering/api-design|API Design]] - idempotent HTTP methods, the same safe-to-repeat property in a different setting
- [[cs/languages/common/build-systems-and-dependency-management|Build Systems and Dependency Management]] - another declared-graph-with-an-imperative-engine system in the same cluster

## Sources

- "Ansible Glossary," Ansible Community Documentation. https://docs.ansible.com/ansible/latest/reference_appendices/glossary.html . Supports the definitions of idempotency (performing an operation once gives exactly the same result as performing it repeatedly), the declarative approach (a description of the final state rather than the sequence of steps), check mode (`--check` reports changes without making them), and facts (properties discovered about remote nodes).
- "Ansible module development: getting started," Ansible Community Documentation. https://docs.ansible.com/ansible/latest/dev_guide/developing_modules_general.html . Supports modules being typically written in Python, being standalone scripts Ansible runs locally or remotely, and returning information by printing a JSON string to stdout before exiting.

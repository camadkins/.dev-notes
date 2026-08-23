---
title: "Testing with Molecule and Assertions"
description: "The assert module never touches the machine, Molecule's answer is to build a real one and converge twice, and the question of what a test even means when the program's job is to make a claim true."
draft: false
comments: true
tags:
  - cs
  - languages
  - testing
date: 2026-08-15
updated:
aliases:
  - Molecule
  - Ansible assert
---

Testing a program usually means running it on inputs and comparing outputs. A playbook has no return value and its output is a machine, so the ordinary shape does not transfer. Ansible's answer arrives at two levels, and the smaller one is more revealing than it first appears.

> [!note] The idea
> `ansible.builtin.assert` does not observe the system under test. Its attribute table lists `connection` support as none, and the description of that attribute is "uses the target's configured connection information to execute code on it," so the module is declaring that it does no such thing. An assertion checks variables that are already in the controller's memory, which means every real test is two steps: run something that reads the machine into a variable, then assert about the variable. The assertion is a claim about your beliefs, and the module that gathered the fact is what makes those beliefs true or false.

## assert reuses the conditional language

The module asserts that given expressions are true with an optional custom message. Its required parameter, `that`, is a list of string expressions of the same form that can be passed to the `when` statement.

That is a deliberate and economical decision. Rather than inventing matchers, comparison DSLs, or a fluent assertion API, Ansible reuses the [[cs/languages/Ansible/conditionals-and-fact-based-branching|conditional grammar]] you already know. A list of expressions is joined with an implicit `and`, exactly as it is under `when`, and Jinja2 tests such as `is defined` and `is succeeded` are available without any special support. The vocabulary of testing and the vocabulary of branching are one vocabulary, which is a small piece of language design worth admiring.

The ergonomics were filled in later. `fail_msg` provides the customized message used for a failing assertion, `success_msg` its counterpart, and `quiet` suppresses verbose output. `assert` also has a corresponding action plugin, which the attributes table describes as indicating that some parts of the options can be executed on the controller. This is consistent with the connection support being none: the work is controller-side by design.

So a useful test looks like a `stat` or `command` or `uri` task with `register`, followed by an `assert` over the registered result. Skipping the first half and asserting over variables you set yourself produces a test that checks your playbook against itself, which passes reliably and proves nothing. This is where [[cs/software-engineering/code-coverage-and-its-limits|coverage-style intuitions]] mislead most: a suite where every task ran and every assertion passed can still have observed nothing about the machine.

## Molecule builds the machine

The level above is Molecule, an Ansible testing framework designed for developing and testing Ansible collections, playbooks, and roles. Its premise is that the only honest test of a role is running it on a real system, so it creates one, runs the role, checks the result, and destroys it.

Molecule leverages standard Ansible features including inventory, playbooks, and collections to provide flexible testing workflows. The tests are Ansible, the fixtures are Ansible, and the target definition is inventory. There is no separate test language, which keeps the barrier low and means a test failure is debugged with the same tools as a production failure.

The unit of organization is a scenario, targeted by name with `-s`, and `molecule list` shows information about current scenarios. A scenario is a complete testing configuration: what instance to build, what playbook converges it, what verification runs afterward. Several scenarios per role is the normal arrangement, one per platform or per configuration variant, which is how a role that claims to support three distributions demonstrates the claim.

The command vocabulary maps onto the lifecycle directly. `create` builds the instance, `converge` executes the sequence necessary to converge the instances, `verify` runs the verification playbook, `login` opens an interactive session for inspection, and `destroy` tears it down. `test` executes the sequence necessary to test the instances, chaining the whole thing, and `matrix` displays the subcommand's ordered list of actions so you can see what a given command will do before it does it.

Test scenarios can target any system or service reachable from Ansible, from containers and virtual machines to cloud infrastructure, hyperscaler services, APIs, databases, and network devices. Molecule can also validate inventory configurations and dynamic inventory sources, which closes a gap worth naming: the inventory layer is code too, and a wrong `keyed_groups` rule is as much a defect as a wrong task.

## Idempotence as a test action

The sequence includes an action that no general-purpose test runner has, and it is the single best idea in the tool. `idempotence` is a first-class Molecule action, and its implementation runs the converge step a second time. If no tasks will be marked as changed, the scenario is considered idempotent, and otherwise the run fails and names the offending tasks.

That converts the [[cs/languages/common/declarative-models-and-idempotence|central property]] of the whole paradigm from a claim in the documentation into a check that fails a build. It also catches the exact defect that is hardest to find by reading: a task using `command` without `changed_when`, a template that reorders a dictionary on each render, a `lineinfile` that appends instead of matching. All of them work on the first run and all of them lie about state on the second, and a human reviewing the diff sees nothing wrong.

The second-run check is a property test in the strict sense. The property is that applying the program twice equals applying it once, quantified over the inputs the scenario supplies, and one counterexample is enough. Very little of what [[cs/software-engineering/testing-strategies|conventional test strategy]] recommends transfers to configuration management, and this is the piece that transfers with the most force.

> [!warning] The scenario is a fresh machine, and production is not
> A Molecule run creates an instance, converges it, and destroys it, so the role is proven correct against a clean baseline. Production hosts carry years of prior state: a package installed by hand, a config file edited during an incident, a service left masked. Convergence from clean is the easy direction, and a green scenario says nothing about convergence from a host that has drifted. Testing the harder direction means using the `prepare` action to dirty the instance first, and the failure mode when nobody writes one is a role that passes CI and breaks on the one server that matters.

Two limits worth stating plainly. Molecule needs infrastructure to run, so a suite is measured in minutes rather than milliseconds and is not a thing you run on every keystroke. And a container is not a virtual machine: init systems, kernel modules, and anything touching the network stack behave differently or not at all, so a scenario can pass against a container and fail against the host it was standing in for. That is not an argument against the container scenario, which catches most defects cheaply. It is an argument for knowing which class of defect it cannot catch, and for pairing it with [[cs/languages/Ansible/check-mode-and-diff|check mode]] against something closer to the real thing.

## Related Notes

- [[cs/software-engineering/testing-strategies|Testing Strategies]] is the general frame, and the contrast that shows how little of it transfers intact.
- [[cs/languages/common/declarative-models-and-idempotence|Declarative Models and Idempotence]] is the property Molecule's second converge run exists to prove.
- [[cs/software-engineering/code-coverage-and-its-limits|Code Coverage and Its Limits]] explains why a fully executed playbook with all assertions passing can still test nothing.
- [[cs/languages/Ansible/conditionals-and-fact-based-branching|Conditionals and Fact-Based Branching]] is the expression language `assert` borrows wholesale.
- [[cs/languages/Ansible/check-mode-and-diff|Check Mode and Diff]] is the other verification mechanism, and the one that works against real hosts.

## Sources

- [ansible.builtin.assert module](https://docs.ansible.com/ansible/latest/collections/ansible/builtin/assert_module.html) backs the module's purpose, the `that` parameter's relationship to `when`, the message parameters, and the attribute table showing no connection support and a corresponding action plugin.
- [About Ansible Molecule](https://ansible.readthedocs.io/projects/molecule/) backs the framework definition, its reuse of standard Ansible features, and the range of systems a scenario can target including inventory validation.
- [Molecule command line reference](https://ansible.readthedocs.io/projects/molecule/usage/) backs the action list including `idempotence` and `prepare`, the converge and test sequences, scenario targeting, and the `matrix` command.
- [molecule/command/idempotence.py](https://raw.githubusercontent.com/ansible/molecule/main/src/molecule/command/idempotence.py) backs what the idempotence action does and how it decides the scenario failed.

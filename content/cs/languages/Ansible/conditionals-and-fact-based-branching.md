---
title: "Conditionals and Fact-Based Branching"
description: "when as a per-host Jinja2 predicate, the omit sentinel that deletes an argument rather than defaulting it, and why a skipped task is a third outcome that is neither success nor failure."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-07-02
updated:
aliases:
  - Ansible when
  - Ansible Conditionals
---

Every language that runs on more than one machine has to answer a question about where the branch lives. Does the program decide once and send different programs to different machines, or does it send one program everywhere and let each machine decide locally? Ansible picks the second, and `when` is the entire mechanism.

There is no `if` in a playbook. There is a key you attach to a task whose value is a predicate, and the predicate is not YAML at all.

> [!note] The idea
> `when` is a raw Jinja2 expression evaluated once per host, which means a playbook is not a branching program but a single straight-line program filtered independently on each target. That filtering produces a third task outcome that most languages do not have. A task can succeed, fail, or be **skipped**, and skipped is a first-class result that gets registered, tested against, and reported, which is why "did the task run" and "did the task work" are separate questions in Ansible and the same question almost everywhere else.

## The predicate is Jinja2, not YAML

Ansible uses Jinja2 tests and filters in conditionals. The `when` clause is a raw Jinja2 expression written without the double curly braces you would use in a [[cs/languages/Ansible/jinja2-templating-and-facts|template]], because the value of the key is already known to be an expression and does not need a delimiter to say so. Writing `when: "{{ ansible_facts['os_family'] == 'Debian' }}"` works by accident and is discouraged, since you are asking Jinja2 to render a boolean into a string that then gets coerced back.

Everything Jinja2 offers is available. Comparison operators, `and` and `or`, parentheses for grouping, and the filter pipeline. If a fact is a string and you need a numeric comparison, you pipe it through `int` first, because the fact came off a remote machine as text and nothing in the pipeline typed it for you. This is the practical cost of a language with no type system: coercion is a thing you remember to write, not a thing the compiler demands.

A convenience worth knowing: a list of conditions under `when` is an implicit `and`. Four lines of separate expressions read better than one line joined by `and` operators, and Ansible treats them identically.

## Evaluated for all hosts, decided per host

When you run the task or playbook, Ansible evaluates the test for all hosts. On any host where the test passes, meaning it returns a value of `True`, Ansible runs that task. On every other host the task is skipped and execution continues.

That per-host evaluation is the whole design. The play is a fixed sequence of tasks and the [[cs/languages/Ansible/inventory-and-host-patterns|host set]] is fixed at play start, so the shape of the program does not vary. What varies is which of its tasks each host actually performs. A playbook that installs `apt` packages on Debian and `dnf` packages on Red Hat is not two programs joined by a branch. It is one program with two tasks, and each host runs exactly one of them and skips the other.

The comparison to a language with ordinary [[cs/pl/booleans-conditionals-semantics|conditional semantics]] is instructive because of what is missing. There is no `else`. There is no short-circuit across tasks. There is no way for one host's evaluation to influence another's inside the same task. You get a filter, applied N times independently, and if you want an `else` you write a second task with the negated predicate.

## Skipped is not failed

Ansible always registers something in a registered variable for every host, even on hosts where a task fails or Ansible skips a task because a condition is not met. That sentence carries more weight than it looks like it does. A skipped task still produces a result object, so a later task can ask `when: result is skipped` and get a meaningful answer, distinct from `is failed` and from `is succeeded`.

Treating skipped as a normal outcome is what lets the filter model work at all. If a skipped task counted as a failure, every conditional task would abort the play on the majority of hosts that did not match. If it counted as a success, you could not distinguish "the package was already installed" from "this host is not the kind of host that gets that package." Ansible needs all three states, and the `is skipped` test is the reader for the third.

The reporting cost is visible. Applying a condition to `import_playbook` returns a skipped message for every task on every host that does not match the criteria, creating repetitive output. The docs suggest `group_by` as the more streamlined alternative, which is Ansible's way of saying that if you find yourself branching a whole playbook on a fact, build the fact into group membership instead and let the host pattern do the filtering.

## The omit sentinel

By default, Ansible requires values for all variables in a templated expression, but you can make specific module variables optional. To make a module variable optional, set the default value to the special variable `omit`.

This is a genuinely different operation from defaulting. `default(5)` supplies a value. `default(omit)` removes the argument from the call. A task that touches files with `mode: "{{ item.mode | default(omit) }}"` sends no `mode` at all for items that do not specify one, and the default mode for those files is determined by the umask of the system. The module never sees the parameter, so the module's own default, or the operating system's, applies.

Without `omit`, expressing "leave this alone" in a language with no null and no optional types would require a separate task per shape of arguments. The sentinel collapses that combinatorial mess into one task, and it is the closest thing Ansible has to an optional parameter. It also fits the [[cs/languages/common/declarative-models-and-idempotence|declarative contract]] cleanly: not sending an argument is different from sending the value you guess it currently has.

> [!warning] The import trap
> When you add a conditional to an import statement, Ansible applies the condition to all tasks within the imported file. Ansible applies the condition to every task and evaluates each task separately. So `import_tasks: other.yml` with `when: x is not defined`, where `other.yml` sets `x` and then prints it, does not do what it reads like. The conditional evaluates to true for the `set_fact` task, which defines the variable and causes the debug conditional to evaluate to false. The condition was copied onto each task, not wrapped around the group. Use `include_*` when you want the condition applied only to the include statement itself, since the [[cs/pl/evaluation-order-and-strictness|moment of evaluation]] is exactly what separates the two forms.

## Related Notes

- [[cs/languages/Ansible/jinja2-templating-and-facts|Jinja2 Templating and Facts]] provides the expression language `when` is written in and the facts most conditions test against.
- [[cs/pl/booleans-conditionals-semantics|Booleans and Conditionals: Semantics and Evaluation]] is the general account of what a conditional means, useful as a contrast to a language whose conditional is a filter with no `else`.
- [[cs/pl/evaluation-order-and-strictness|Evaluation Order and Strictness]] explains why import-time and include-time evaluation give different answers to the same expression.
- [[cs/languages/Ansible/inventory-and-host-patterns|Inventory and Host Patterns]] is the other filtering mechanism, and often the better one when the condition is really about what kind of host this is.
- [[cs/languages/common/declarative-models-and-idempotence|Declarative Models and Idempotence]] frames why "send no value" and "send the current value" have to be distinguishable operations.

## Sources

- [Conditionals, Ansible playbook guide](https://docs.ansible.com/ansible/latest/playbook_guide/playbooks_conditionals.html) backs the `when` semantics, per-host evaluation, registered-variable behavior on skip, and the import versus include conditional expansion.
- [Using filters to manipulate data](https://docs.ansible.com/ansible/latest/playbook_guide/playbooks_filters.html) backs the `omit` sentinel and the umask consequence in the optional-mode example.

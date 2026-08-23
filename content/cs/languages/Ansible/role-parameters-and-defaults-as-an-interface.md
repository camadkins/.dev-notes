---
title: Role Parameters and Defaults as an Interface
description: "How close a role gets to a typed interface: defaults versus vars, the argument spec added in 2.11, and why declared types are checked on the way in but discarded on the way out."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-06-27
updated:
aliases:
  - Ansible Role Argument Validation
  - defaults vs vars
---

A role is the only thing in Ansible that accepts named parameters and has an official place to write down what it accepts. That makes it the closest the language comes to a declared interface, and the gap between "closest" and "actual" is where the useful detail lives.

Two directories carry the parameter surface, and they sit at opposite ends of the resolution order. `defaults/main.yml` holds "very low precedence values for variables provided by the role," so low that "a role's own defaults will take priority over other role's defaults, but any/all other variable sources will override this." `vars/main.yml` holds "high precedence variables provided by the role to the play." Same file format, same loading convention, opposite meaning: one is a value you are inviting the caller to replace, the other is a value you are refusing to let the caller replace by ordinary means. Nothing in the syntax marks the difference. The directory name is the entire declaration, and the ranking it implies is set out in [[cs/languages/Ansible/variables-and-precedence|variable precedence]].

> [!note] The idea
> Role argument validation is a gate, not a contract. Enabling it inserts "a new task at the beginning of role execution that will validate the parameters supplied for the role against the specification," so the check runs inside the ordinary host loop, at the ordinary time, after every task before it in the play has already changed the machine. And the declared types leak in only one direction. Validation is coercive on the way in, but "at runtime roles receive the original uncoerced values," so passing the integer 1 where the spec says `str` passes validation and hands your tasks an integer anyway. The spec therefore tells you what will not abort the role. It does not tell you what your tasks will be holding.

## The argument spec

Beginning with version 2.11, a role can carry `meta/argument_specs.yml`, and if the supplied parameters fail validation, the role fails execution. The file is keyed by entry point, and the entry point name "will be the base name of the tasks file to execute, with no .yml or .yaml file extension," with `main` standing for the unspecified case. That detail matters more than it looks: it means a role is not one interface but a family of them, one per tasks file a caller can invoke, which is the closest structural analogue Ansible has to overloading.

Each option gets the vocabulary you would expect from a small schema language: `type` (defaulting to `str`), `required`, `default`, `choices`, `elements` for list members, and a nested `options` block when the value is a dict or a list of dicts. The nested case is the interesting one, because it means the spec can describe a shape several levels deep, which YAML itself has no way to constrain.

There is a subtlety in the `default` field that catches role authors. The spec's `default` is documentation, not behavior: "the actual default for the role variable will always come from the role defaults." Write a default in `argument_specs.yml` and forget the matching entry in `defaults/main.yml` and you have documented a value that does not exist. Two files now have to agree, by hand, with nothing checking them against each other. That is the shape of every hand-maintained interface described in [[cs/software-engineering/api-design|API design]], and it is why declarations derived from the implementation beat declarations written beside it.

Validation ordering is documented and worth knowing. When a role with dependencies is validated, "validation on those dependencies will run before the dependent role, even if argument validation fails for the dependent role," so a caller who got the top-level parameters wrong still watches the whole dependency chain get checked first. The inserted validation task is tagged `always`, which means the usual tag-based narrowing of a run does not skip it, and skipping it requires `--skip-tags` against a statically imported role.

> [!example] The coercion trap in one pass
> A role declares `app_port` with `type: int`. The caller passes the string `"8080"` from a `group_vars` file. Validation coerces it, sees a valid integer, and passes. The role's tasks then receive the original string `"8080"`, because the coerced value is not what gets handed back at runtime. A later task doing `when: app_port > 1024` compares a string against an integer and behaves differently than the author expected. The documented fix is to coerce explicitly in the role body, with a filter such as `| int`, rather than trusting the spec to have done it. The spec proved the value was convertible. It did not convert it.

## What it still is not

Set the whole apparatus against a real module signature, in the sense used in [[cs/pl/modules-signatures-and-separate-compilation|modules, signatures, and separate compilation]]. A signature is checked before anything runs, applies to every use site, and lets the compiler reject a caller without executing a line of it. Role argument validation is checked at the moment of use, only on the path actually taken, and only for the hosts that reached that point in the play. A role that is never reached is never validated. A parameter misspelled by the caller is not a type error at all; it simply defines a variable nobody reads, and the role quietly falls back to its default.

The comparison worth drawing is not to a signature but to a runtime contract in the sense of [[cs/languages/Racket/contracts-and-blame|contracts and blame]]. Both check at the boundary, both check only the calls that happen, and both turn a silent wrong answer into a loud failure. What Ansible lacks is the blame half. When validation fails, the role fails, and the message names the offending option, but there is no notion of which party is at fault carried through a chain of roles calling roles. In practice the role that declared the spec is the one that dies, even when the value came from three layers up.

There is also nothing in the other direction. A role has no declared outputs. Whatever it leaves behind, it leaves behind as ordinary variables, facts, and handlers in shared scope, so the caller's only way to consume a result is to know a name the role author happened to use. An interface with typed inputs, no typed outputs, and a global namespace for results is a real interface, but it is an interface in the sense a shell script has one, not in the sense a module system has one.

## Related Notes

- [[cs/languages/Ansible/roles-and-reuse|Roles and Reuse]] - the directory layout, dependency handling, and once-per-play deduplication behind this interface
- [[cs/languages/Ansible/why-ansible-has-no-generics|Why Ansible Has No Generics]] - why parameters here are not type parameters, and what that costs
- [[cs/pl/modules-signatures-and-separate-compilation|Modules, Signatures, and Separate Compilation]] - what a checked-before-execution interface buys that this one cannot
- [[cs/languages/Racket/contracts-and-blame|Contracts and Blame]] - the runtime-checked boundary Ansible's validation resembles, including the blame tracking it lacks
- [[cs/software-engineering/coupling-and-cohesion|Coupling and Cohesion]] - why a role that exports results through shared variable scope is more coupled than its parameter list suggests
- [[cs/languages/Ansible/collections-as-the-packaging-unit|Collections as the Packaging Unit]] - the layer above, where roles get namespaced and versioned

## Sources

- "Roles," Ansible Community Documentation. https://docs.ansible.com/ansible/latest/playbook_guide/playbooks_reuse_roles.html . Supports the precedence descriptions of `defaults/main.yml` and `vars/main.yml`, argument validation from version 2.11 with the inserted validation task and role failure on invalid parameters, the entry point naming rule, the option vocabulary including type, required, default, choices, elements, and nested options, the coercive-validation note and uncoerced runtime values, the rule that the actual default comes from role defaults, dependency validation ordering, and the `always` tag on the inserted task.
- "Ansible module architecture," Ansible Community Documentation. https://docs.ansible.com/ansible/latest/dev_guide/developing_program_flow_modules.html . Supports `str` as the default argument type that role specs inherit from the module argument spec vocabulary.

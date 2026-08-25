---
title: Filters and Tests as Transformations
description: "Jinja2 filters and tests are the nearest thing Ansible has to a function library, they all run on the control node, and the split between them is a grammatical rule rather than a semantic one."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-08-04
updated:
aliases: []
---

If a playbook needs to reshape a value before handing it to a module, the reshaping happens in a filter. Filters "let you transform JSON data into YAML data, split a URL to extract the hostname, get the SHA1 hash of a string, add or multiply integers, and much more," and you can use the Ansible-specific ones, any standard Jinja2 filter, or Python methods on the value. That inventory is the function library of a language that has no functions, and reading the catalogue tells you what the language expects you to need: type coercion, dictionary and list surgery, set operations, path manipulation, IP address arithmetic, hashing, and date formatting.

> [!note] The idea
> Every filter and every test runs on the control node, never on the target. "Because templating happens on the Ansible control node, not on the target host, filters execute on the control node and transform data locally," and tests "always execute on the Ansible control node, not on the target of a task, as they test local data." That single placement decision explains the whole design. A filter cannot inspect the remote machine, so anything it computes about a host has to have arrived earlier as a fact or a registered result. It also means the control node is where the CPU goes: transforming a large data structure for four hundred hosts is four hundred evaluations in one Python process, not four hundred parallel evaluations on four hundred machines.

## The split between filters and tests

The two families look interchangeable and are not. "The main difference between tests and filters are that Jinja tests are used for comparisons, whereas filters are used for data manipulation." A filter takes a value and gives back a value, written `variable | filter`. A test takes a value and gives back true or false, written `variable is test_name`, as in `result is failed`.

Historically Ansible registered tests as both, so `failed(result)` in filter syntax worked. That ended deliberately: using a Jinja test as a filter has produced a deprecation warning since 2.5, and since 2.9 the test syntax is required. Two spellings for one operation were collapsed into one, which is the kind of cleanup a language does when it decides its grammar means something.

The place they meet is list processing. Tests "can also be used in list processing filters, like `map()` and `select()` to choose items in the list," so `{{ hosts | selectattr('state', 'defined') | list }}` is a filter consuming a test as an argument. That composition is the closest Ansible comes to passing a predicate to a higher-order function, and the resemblance is worth noticing precisely because it is bounded: the predicate is named by a string inside a filter call, not bound to a variable, and there is nowhere to put a filter chain you might want to reuse. A comparison to the pipeline in [[cs/languages/Java/streams-and-the-collector-abstraction|streams and the collector abstraction]] holds for shape and fails for first-classness.

## Undefined, and the filter that carries the most weight

`default` is the filter you meet first and use most, and its behavior is more subtle than "supply a fallback." If a variable is not defined, `{{ some_variable | default(5) }}` yields 5 instead of raising an undefined-variable error. Since 2.8, accessing an attribute of an undefined value returns another undefined value rather than throwing immediately, which is what lets `{{ foo.bar.baz | default('DEFAULT') }}` work without knowing whether the intermediate levels exist. A falsy value is not the same as an absent one, so a defined but empty variable still wins unless you pass the second parameter: `default('admin', true)` also substitutes for false and the empty string.

Read together, those three rules describe an option type with a very forgiving unwrap operation, propagating absence through attribute access and collapsing it at the point of use. There is no way to declare that a variable might be undefined, and no check that you handled the case. The discipline is entirely on the author, which is the tradeoff described in [[cs/pl/type-systems-goals-guarantees|type systems, goals and guarantees]] resolved in favor of never having to write a declaration.

## Where types briefly appear

`type_debug` reports the underlying Python type of a value, and the docs immediately steer you away from using it for logic: "you should often prefer type tests, which will allow you to test for specific data types." The type tests themselves are a genuine little type lattice, and the doc's own worked example spells out the overlaps. A string counts as `iterable` and `sequence` but not `mapping`. A dictionary is not a `string` but is `iterable`, `sequence`, and `mapping`. A list is neither a string nor a mapping but is `iterable` and `sequence`. A float and an integer are both `number` while each also has its own test, and `'1'` in quotes is a `string` and not a `number`.

That is a structural classification of runtime values, checked when the expression is evaluated, on the control node, for the one value in hand. It is the same information a static type would give you, arriving too late to prevent anything and available only where you thought to ask. Coercion filters (`| int`, `| bool`, `| float`) then convert, which the docs demonstrate with a `when: some_string_value | bool` guard for a `vars_prompt` answer that arrives as a string.

> [!warning] Filters that touch secrets still run locally
> The hashing filters, `hash`, `checksum`, and `password_hash`, run in the same place as every other filter, which means the plaintext exists in control node memory and in any template rendered there. `password_hash('sha512')` generates a random salt unless you supply one, and supplying a fixed salt is what makes a run idempotent at the cost of the property described in [[cs/security/password-hashing-and-salting|password hashing and salting]]. Choosing a constant salt to stop a user module reporting changed every run is a real tradeoff between convergence and security, made silently in one line of a template.

## Custom filters

You can create custom Ansible filters as plugins, which puts them in the same category as connection plugins and callback plugins: Python code loaded by the control node, addressed by name from a template. This is the escape hatch for the missing function definition, and it has the shape you would expect. To add a named computation to the language, you leave the language.

## Related Notes

- [[cs/languages/Ansible/jinja2-templating-and-facts|Jinja2 Templating and Facts]] - the templating layer these transformations run inside, and the data they consume
- [[cs/languages/Ansible/loops-and-the-item-abstraction|Loops and the item Abstraction]] - filters as the way iteration inputs get built
- [[cs/languages/Ansible/yaml-as-a-programming-surface|YAML as a Programming Surface]] - why expressions have to live inside quoted strings at all
- [[cs/pl/type-systems-goals-guarantees|Type Systems: Goals and Guarantees]] - what the type tests are a runtime approximation of
- [[cs/security/password-hashing-and-salting|Password Hashing and Salting]] - the salt decision hidden inside a one-line filter call
- [[cs/languages/Python/comprehensions-and-generator-expressions|Comprehensions and Generator Expressions]] - the host language's own expression-level data transformation, for comparison

## Sources

- "Using filters to manipulate data," Ansible Community Documentation. https://docs.ansible.com/ansible/latest/playbook_guide/playbooks_filters.html . Supports the description of what filters do, filters executing on the control node because templating happens there, custom filters as plugins, the `default` filter semantics including undefined attribute propagation from 2.8 and the second parameter for falsy values, `type_debug` and the recommendation to prefer type tests, coercion with the `bool` filter, and the hashing and `password_hash` filters with their salt behavior.
- "Tests," Ansible Community Documentation. https://docs.ansible.com/ansible/latest/playbook_guide/playbooks_tests.html . Supports tests returning true or false, the filter-versus-test distinction, tests executing on the control node, the `variable is test_name` syntax, the deprecation of test-as-filter syntax in 2.5 and its requirement from 2.9, tests used inside `map()` and `select()`, and the type test classifications for strings, dictionaries, lists, floats, and integers.

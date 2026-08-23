---
title: "Module and Plugin Types"
description: "The full plugin taxonomy sorted by the one question that explains it: does this code run on the control node or on the target, and what does that force about the language it is written in."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-06-16
updated:
aliases:
  - Ansible Plugins
  - Ansible Plugin Types
---

Eighteen plugin types is a lot of vocabulary to hold, and the list Ansible publishes is alphabetical, which is the worst possible order for learning it. Sorted by where the code executes, the same list becomes almost self-explanatory, and several apparently unrelated rules turn out to be one rule.

> [!note] The idea
> The control node and the target are two different machines with two different requirements, and every plugin type sits firmly on one side of that line. You must write a plugin in Python so it can be loaded by the `PluginLoader`, and since your plugin executes on the control node, it must be a Python version the controller supports. A module is different in kind: a reusable, standalone script that Ansible runs on your behalf, either locally or remotely, and when you write one for local use you can choose any programming language and follow your own rules. One category extends the engine and inherits the engine's runtime. The other is shipped across a boundary and only has to satisfy a wire contract.

## Modules are not plugins in the way that matters

Ansible's own list files Modules under plugin types, which is defensible as bookkeeping and misleading as a mental model. A module provides a defined interface, accepts arguments, and returns information to Ansible by printing a JSON string to stdout before exiting.

That sentence is a complete specification, and it is the only thing a module must satisfy. Read arguments, do work, print JSON, exit. Nothing in it mentions Python, imports, or Ansible's object model, which is exactly why a module can be written in any language and a plugin cannot. The relationship is a process boundary with a [[cs/languages/common/serialization-and-wire-formats|serialized wire format]] across it rather than a function call inside one runtime, which is why the [[cs/languages/Ansible/the-execution-model-and-module-transfer|transfer step]] exists at all.

The practical consequences follow from the boundary. A module cannot see your playbook's variables except as arguments it was handed. A module cannot log to your terminal except by returning data that a callback then renders. A module that crashes without printing valid JSON produces a parse error rather than a stack trace, because the controller is reading a pipe, not catching an exception. Anyone who has debugged this recognizes the failure signature of an ordinary [[cs/systems/inter-process-communication|inter-process channel]] with a strict output contract.

The Python-in-practice caveat matters too. The interpreter question for modules is about the target's Python, chosen by interpreter discovery, and the interpreter question for plugins is about the controller's Python. They are separate constraints on separate machines and get confused constantly.

## The controller-side plugins

Everything else in the taxonomy runs on the control node, loaded by the `PluginLoader` into the running `ansible-playbook` process. Plugins are pieces of code that augment Ansible's core functionality, and Ansible uses a plugin architecture to enable a rich, flexible and expandable feature set. The loader is a discovery mechanism over a search path rather than a declared import graph, so a plugin is found by being in the right directory under the right name, which puts it in a different family from [[cs/languages/Python/the-import-system|Python's own import machinery]] even though it is built on top of it.

Sorted by what they touch:

**Data going in.** Inventory plugins parse inventory sources and form an in-memory representation of the inventory. Vars plugins inject additional variable data into Ansible runs that did not come from an inventory source, playbook, or command line, and are the mechanism behind `host_vars` and `group_vars`. Lookup plugins pull in data from external data stores, on demand, during templating. Cache plugins store gathered facts and data retrieved by inventory plugins, which is why the same cache backend serves both fact gathering and dynamic inventory.

**Data being transformed.** Filter plugins manipulate data and test plugins verify data. Both are features of Jinja2 rather than Ansible inventions, and both are available in Jinja2 templates used by the `template` module. That shared lineage is why a filter works identically in a template, in a `when` clause, and in a variable definition: the same Jinja2 environment is evaluating all three.

**Execution and transport.** Connection plugins allow Ansible to connect to target hosts so it can execute tasks on them, and Ansible ships with many, but only one can be used per host at a time. Shell plugins handle command-line quoting and path conventions for the target's shell family. Become plugins implement privilege escalation. Strategy plugins decide the order in which hosts advance through tasks. Action plugins let you integrate local processing and local data with module functionality, which makes them the hinge between the two halves of this note.

**Output.** Callback plugins add new behaviors to Ansible when responding to events, and by default, callback plugins control most of the output you see when running the command line programs.

**Network device support.** Cliconf, httpapi, netconf, and terminal plugins exist because network gear does not run a general-purpose operating system. Cliconf, httpapi, and netconf plugins indirectly piggy back on connection plugins, layering device-specific protocol handling on the transport.

**Support types.** Module utilities are shared Python libraries that ship to the target alongside modules, and docs fragments are reusable documentation blocks.

## Action plugins are the interesting case

The action plugin is where the boundary is negotiated, and understanding it retires most of the confusion about what a task actually does. Action plugins let you integrate local processing and local data with module functionality, running on the controller as the task's entry point.

The mechanism is explicit in the developer docs. An action plugin subclasses `ActionBase`, and from there you execute the module using the `_execute_module` method to call the original module. After successful execution of the module, you can modify the module return data. So the action plugin sits between the task and the module, free to do controller-side work first, to alter the result afterward, or to skip the module entirely.

The documentation's worked example is a good illustration of why the split has to exist. If you wanted to check the time difference between your Ansible control node and your target machines, you could write an action plugin to check the local time and compare it to the return data from Ansible's `setup` module. The comparison needs both clocks, and only the controller side of the pair can read the controller's clock. No module could do it, because a module runs somewhere else.

A task name in a playbook therefore does not reliably tell you where the work happens. It names a resolution path that may run controller-side code, target-side code, or both, and the balance between them is an implementation detail the task syntax hides.

> [!warning] The taxonomy is a search path, not a type system
> Nothing declares which plugin types a collection provides or what interface each satisfies. The loader looks in directories, matches names, and instantiates. There is no signature check, no versioned interface, and no error until the plugin is loaded and called with arguments it does not understand. Compared to a language with [[cs/pl/modules-signatures-and-separate-compilation|module signatures]], the whole plugin surface is late-bound and unverified, which is what makes it easy to extend and hard to know is correct.

## Related Notes

- [[cs/languages/Ansible/the-execution-model-and-module-transfer|The Execution Model and Module Transfer]] is the concrete mechanism the module side of this split implies.
- [[cs/systems/inter-process-communication|Inter-Process Communication]] is the general form of the JSON-on-stdout contract between controller and module.
- [[cs/pl/modules-signatures-and-separate-compilation|Modules, Signatures, and Separate Compilation]] is the checked alternative to a name-and-directory plugin loader.
- [[cs/languages/Python/the-import-system|The Import System]] is the machinery the `PluginLoader` is built on and deliberately does not use as-is.
- [[cs/languages/common/serialization-and-wire-formats|Serialization and Wire Formats]] frames why the module contract is a format rather than an interface.

## Sources

- [Working with plugins](https://docs.ansible.com/ansible/latest/plugins/plugins.html) backs the plugin-architecture framing and the list of shipped plugin types.
- [Developing plugins](https://docs.ansible.com/ansible/latest/dev_guide/developing_plugins.html) backs the Python and control-node requirement, the `PluginLoader`, and the per-type descriptions of action, cache, callback, connection, filter, inventory, lookup, test, and vars plugins.
- [Developing modules](https://docs.ansible.com/ansible/latest/dev_guide/developing_modules_general.html) backs the module definition, the JSON-on-stdout contract, and the free choice of language for a local module.

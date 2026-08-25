---
title: "Callback Plugins and Output"
description: "Ansible has no print statement: every line on your terminal is a rendering of an event stream by a plugin, which is why there can be only one stdout callback and why logging and metrics are the same mechanism."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-06-11
updated:
aliases: []
---

Nothing in Ansible's core writes to your terminal. Callback plugins enable adding new behaviors to Ansible when responding to events, and by default, callback plugins control most of the output you see when running the command line programs. Take the callbacks away and a playbook run would execute correctly and print nothing.

> [!note] The idea
> Ansible's engine emits typed events and never formats them, so the console is a rendering rather than the output itself. That single decision explains the whole surface: the same event stream that draws green and yellow task lines can also be marshalled to a storage backend, mailed on failure, or read aloud, with no change to the engine and no change to your playbook. It also explains the one hard constraint in the system. A terminal is a single shared byte stream with no way to interleave two formatters coherently, so exactly one plugin may own it, while any number may observe.

## The engine emits, plugins render

A callback plugin subclasses `CallbackBase` and overrides the specific methods it wants to provide a callback for. Each method corresponds to an event: a play started, a task returned ok, a task failed, a host became unreachable, the run finished. The engine calls them and moves on, indifferent to what any of them do.

This is the [[cs/software-engineering/design-patterns|observer pattern]] applied to a whole program's output rather than to one object's state, and the payoff is the range of things the shipped plugins do with the same events. The `log_plays` callback records playbook events to a log file. The `mail` callback sends email on playbook failures. The `say` callback responds with computer-synthesized speech in relation to playbook events. Three entirely different output media, no engine changes, no playbook changes.

The consequence for anyone writing a module is that a module cannot print. A module returns structured data over the [[cs/languages/Ansible/module-and-plugin-types|controller boundary]] and a callback decides whether any of it reaches a human. Debugging output that "disappears" is usually a module writing to a stream nobody renders, which is a different problem from the one it appears to be.

## Only one can own stdout

You can only have one plugin be the main manager of your console output. To replace the default you define `CALLBACK_TYPE = stdout` in the subclass and configure `stdout_callback` in `ansible.cfg`, and setting it to `yaml`, `dense`, `minimal`, or something you wrote replaces the entire look of a run.

The docs sort callbacks into three types, and the sort is by relationship to that shared resource. Stdout callbacks handle the main console output, only one can be active, and they always get the event first, with the rest of the callbacks getting the event in the order they are configured. Aggregate callbacks can add additional console output next to a stdout callback, whether that is a summary at the end of a run or extra per-task detail. Notification callbacks inform other applications, services, or systems, from logging to databases to messaging on errors to email when a server is unreachable.

Exclusivity applies to the first category only, and it is a resource constraint rather than a design preference. Two formatters writing to one file descriptor produce interleaved garbage, especially since [[cs/languages/Ansible/strategies-linear-free-and-forks|forked workers]] are generating events concurrently and the ordering guarantee is only that the stdout plugin sees each event before the observers do. Anything that merely reacts to events has no such conflict, so you can run a dozen notification callbacks at once.

Two configuration details catch people. Most callbacks shipped with Ansible are disabled by default and need to be enabled in `ansible.cfg` to function, so `callbacks_enabled = timer, profile_roles` is a required step rather than an optimization. And the `ansible` ad hoc command specifically uses a different callback plugin for stdout, which is why a custom stdout callback that works under `ansible-playbook` appears to be ignored on the command line until you set `bin_ansible_callbacks = True`.

Load order is worth knowing for anyone stacking several. Plugins are loaded in alphanumeric order, which is why callback files in the wild carry numeric prefixes, a convention shared with the ordering problem in inventory directories.

## Logging and metrics are the same mechanism

Callbacks can be used to add additional output, integrate with other tools, and marshal the events to a storage backend. That last clause is the one that changes what the feature is for.

Because every task result passes through the callback interface as structured data before any human sees it, a notification callback is positioned to do things no log scraper can do reliably. It has the task name, the host, the module, the changed and failed flags, and the timing, as fields rather than as text it had to parse back out of a rendered line. Shipping that to a time-series database gives you per-role duration across a fleet. Shipping it to a [[cs/security/siem-and-security-logging|SIEM]] gives you an audit record of which operator changed which host and when, generated by the automation itself rather than reconstructed afterward.

The comparison that makes the point is with a tool whose output is text. Getting structured telemetry out of a shell script means parsing its stdout, which means your monitoring depends on the exact wording of messages the script author never promised to keep stable. Ansible inverts that: the stable interface is the event, and the text is the unstable projection.

There is a real cost, and it is the reason this is worth a warning rather than only a recommendation.

> [!warning] Callbacks see everything, including secrets
> A callback receives task results before any rendering, which includes fields that `no_log` and the vault machinery keep off your screen. A notification callback that forwards raw results to a chat channel or a log aggregator has moved data across a trust boundary that the playbook author believed was closed. Treat an enabled callback as a component with full read access to every task result in the run, and audit what a third-party one transmits before enabling it.

Two further limits are structural rather than accidental. A callback observes, it does not decide: there is no return value the engine acts on, so a callback cannot fail a task, retry it, or alter a result. And callbacks run in the controller process, so slow work inside one, such as a synchronous HTTP post per task, adds latency to the run it is reporting on. The correct shape for a heavy notification callback is to enqueue and return, which is the same conclusion any [[cs/software-engineering/observability-logging-metrics-tracing|instrumentation layer]] reaches once it stops being free.

## Related Notes

- [[cs/software-engineering/design-patterns|Design Patterns]] names the observer arrangement the whole output layer is built on.
- [[cs/security/siem-and-security-logging|SIEM and Security Logging]] is what a notification callback is actually good for, and why structured events beat parsed text.
- [[cs/software-engineering/observability-logging-metrics-tracing|Observability, Logging, Metrics, and Tracing]] frames the cost of in-band instrumentation in the process being instrumented.
- [[cs/languages/Ansible/module-and-plugin-types|Module and Plugin Types]] places callbacks among the controller-side plugins and explains why a module cannot print.
- [[cs/languages/Ansible/strategies-linear-free-and-forks|Strategies: Linear, Free, and Forks]] is the source of the concurrent event ordering a stdout callback has to cope with.

## Sources

- [Callback plugins](https://docs.ansible.com/ansible/latest/plugins/callback.html) backs the definition, the example callbacks, alphanumeric load order, the enablement requirement, the single-stdout rule, the three callback types and their event ordering, and the ad hoc command's separate stdout callback.
- [Developing plugins](https://docs.ansible.com/ansible/latest/dev_guide/developing_plugins.html) backs the `CallbackBase` subclassing and method-override model.

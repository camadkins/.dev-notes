---
title: "Error Handling: failed_when and changed_when"
description: "Redefining what counts as failure and what counts as change, the narrow scope of ignore_errors, and why changed_when is the keyword that idempotence claims actually rest on."
draft: false
comments: true
tags:
  - cs
  - languages
  - error-handling
date: 2026-08-04
updated:
aliases: []
---

A module returns a dictionary. Two of its keys, `failed` and `changed`, are not really data about the world. They are the module author's opinion about the data, and Ansible gives you two keywords to overrule that opinion per task. Understanding which one matters more than the other is the whole point.

> [!note] The idea
> `failed_when` and `changed_when` both replace a module's self-report with an expression you write, but they are not symmetric in consequence. Overriding `failed` changes whether the play stops. Overriding `changed` changes whether a handler fires, whether the recap reports work was done, and therefore whether your entire idempotence claim is true or merely typed. `changed` is the only status in Ansible that feeds another control-flow mechanism, which makes `changed_when` the load-bearing one and its absence on any `command` or `shell` task a silent lie in the run report.

## The default and why it needs overriding

When Ansible receives a non-zero return code from a command or a failure from a module, by default it stops executing on that host and continues on other hosts. Per-host abort, global continue. That default is right for the majority of tasks and wrong for a specific and common minority: programs whose exit codes carry information rather than a verdict.

`diff` exits 0 when files match, 1 when they differ, and 2 or more on trouble. `grep` exits 1 on no match. A packaged check tool might exit 3 to mean "drift detected," which is the answer you asked for. Ansible cannot know any of this, so it applies the POSIX convention and you correct it.

Ansible lets you define what failure means in each task using the `failed_when` conditional. The expression is a raw Jinja2 predicate over the registered result, so `failed_when: diff_cmd.rc == 0 or diff_cmd.rc >= 2` says the two-file comparison fails when the files are identical or when `diff` itself broke, and succeeds on the one exit code that would normally be a failure. Like every conditional in Ansible, lists of multiple `failed_when` conditions are joined with an implicit `and`, meaning the task only fails when all conditions are met, so writing four lines when you meant `or` inverts the logic quietly.

## ignore_errors is narrower than it sounds

The blunt instrument is `ignore_errors: true`, and its scope is much smaller than the name promises. The `ignore_errors` directive only works when the task can run and returns a value of `failed`. It does not make Ansible ignore undefined variable errors, connection failures, execution issues such as missing packages, or syntax errors.

The pattern is identical to the [[cs/languages/Ansible/blocks-rescue-and-always|rescue exclusions]], and for the same reason. All three mechanisms are readers of a `failed` key in a returned dictionary. If no module ran, no dictionary came back, and there is nothing for the keyword to suppress. Connection failure is handled by a separate keyword, `ignore_unreachable`, because it is a separate condition: if Ansible cannot connect to a host, it marks that host `UNREACHABLE` and removes it from the list of active hosts for the run.

Two failure channels, two keywords, no overlap. The mental model that survives contact with production is that `failed` is data returned by a module and `unreachable` is a property of the transport, and no amount of task-level configuration lets one keyword speak for both.

## changed_when carries the weight

Ansible lets you define when a particular task has changed a remote node using the `changed_when` conditional. The consequence sentence is where the interesting part lives: this lets you determine, based on return codes or output, whether a change should be reported in Ansible statistics and whether a handler should be triggered or not.

Two outputs from one flag. One is reporting and one is control flow, and the control-flow half is what makes the keyword load-bearing. [[cs/languages/Ansible/handlers-and-notify-semantics|Handlers]] fire on notification, and a task notifies only when it reports changed. A task with a wrong `changed` value does more than misreport: it either fires a service restart that was not warranted or fails to fire one that was.

The idempotence problem is concrete and unavoidable. The `command` module runs an arbitrary program, and an arbitrary program has no declared end state Ansible can compare against. The module's own documentation concedes the point when describing check mode: the command itself is arbitrary and cannot be subject to check mode semantics, so the module adds `creates` and `removes` options as a workaround. Absent those, a `command` task reports changed every run because running the command is the only thing it knows happened.

So a playbook full of `command` tasks with no `changed_when` produces a recap that says work was done on every run, forever. It never converges to a clean run, which means the [[cs/languages/common/declarative-models-and-idempotence|idempotence property]] the tool is sold on is not being delivered by the tool. It is being delivered by whoever wrote `changed_when: "'already exists' not in result.stderr"` on each of those tasks. The declarative model holds at the module layer and stops at the shell-out boundary, and `changed_when` is the manual patch across that boundary.

The two useful constants deserve their own mention. `changed_when: false` marks a task as read-only, which is the correct annotation for any `command` that only inspects. `changed_when: true` forces a change report unconditionally. Both are single-line ways of telling the truth about a task the module cannot describe.

> [!warning] The escape hatches are check-then-act
> `creates` takes a filename or glob pattern, and if a matching file already exists, the step will not be run. That is a check followed by an action with a window in between, which is the shape of a [[cs/security/race-conditions-and-toctou|TOCTOU]] bug. On a single-admin box the window is uninteresting. On a host where two automation runs can overlap, or where the marker file is on shared storage, the guard is advisory rather than a lock, and treating it as mutual exclusion is a mistake the syntax invites.

## What the recap is measuring

Once you accept that `changed` is author-defined rather than observed, the end-of-run summary becomes an artifact of your annotations instead of an [[cs/software-engineering/observability-logging-metrics-tracing|observation of the system]]. "Zero changed" means nothing changed only to the extent that every task's `changed_when` is honest. A team that reflexively writes `changed_when: false` to quiet a noisy recap has made the number look good by deleting its information content.

This is worth stating plainly because the changed count is the number people actually watch. It gates promotion in pipelines, it is the signal in drift-detection runs, and under `--check` it is the whole output. A knob that rewrites your primary metric, available per task, with no audit trail, is a knob to use deliberately.

The failure side has a coarser sibling worth knowing for the same reason. If you set `any_errors_fatal` and a task returns an error, Ansible finishes the fatal task on all hosts in the current batch and then stops executing the play on all hosts. That converts the default per-host abort into a global one, which is what you want when a partial rollout is worse than no rollout.

## Related Notes

- [[cs/languages/common/declarative-models-and-idempotence|Declarative Models and Idempotence]] is the property `changed_when` either upholds or quietly fakes.
- [[cs/languages/Ansible/handlers-and-notify-semantics|Handlers and Notify Semantics]] is the control-flow consumer of the changed flag, and the reason getting it wrong is not merely cosmetic.
- [[cs/languages/Ansible/blocks-rescue-and-always|Blocks, Rescue, and Always]] shares the same failed-key mechanism and the same blind spots.
- [[cs/security/race-conditions-and-toctou|Race Conditions and TOCTOU]] names the hazard in the `creates` and `removes` guards.
- [[cs/software-engineering/observability-logging-metrics-tracing|Observability, Logging, Metrics, and Tracing]] frames why an operator-editable status field is a compromised metric.

## Sources

- [Error handling in playbooks](https://docs.ansible.com/ansible/latest/playbook_guide/playbooks_error_handling.html) backs the default failure behavior, the scope of `ignore_errors`, the unreachable-host handling, the definitions of `failed_when` and `changed_when`, and `any_errors_fatal`.
- [ansible.builtin.command module](https://docs.ansible.com/ansible/latest/collections/ansible/builtin/command_module.html) backs the check-mode concession and the behavior of the `creates` parameter.

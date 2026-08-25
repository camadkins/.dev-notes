---
title: "Tags and Selective Execution"
description: "Tag inheritance as a preprocessing pass, the reserved always and never tags, and why selecting an arbitrary subset of a dependency-ordered task list is unsound by construction."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-07-19
updated:
aliases:
  - skip-tags
---

Tags answer a practical complaint. A playbook that takes twenty minutes is a bad edit-test loop when you are working on one task in the middle of it, so Ansible lets you label tasks and then run or skip by label. The mechanism is simple enough to describe in a paragraph and produces failure modes that take a while to recognize.

> [!note] The idea
> Tag selection is a preprocessing filter, applied before execution begins and outside every other control mechanism in the language. The tags keyword is part of preprocessing the playbook and has high precedence when deciding what tasks are available to consider for execution. That precedence is the whole story: because tags decide the task list before any conditional, block, or handler logic can weigh in, tag selection supersedes most other logic, including block error handling. Ansible has no model of which task depends on which, so an arbitrary tag subset is an arbitrary cut through a [[cs/dsa/topological-sorting|dependency ordering]] the language never recorded, and nothing checks whether the cut is coherent.

## Defining and selecting are separate operations

The `tags` keyword always defines tags and adds them to tasks. It does not select or skip tasks for execution. Selection happens only at the command line, through `--tags` and `--skip-tags`. That split is worth internalizing because it means a playbook's tags carry no behavior on their own. They are metadata that an operator's invocation later interprets.

Five command-line options exist rather than the two you would guess. `--tags all` is the default and runs everything tagged and untagged, except `never`. `--tags tag1,tag2` runs only matching tasks, plus anything tagged `always`. `--skip-tags` runs everything except the named tags. The two less common ones select on the presence of tags at all: `--tags tagged` runs only tasks with at least one tag, and `--tags untagged` runs only tasks with none.

Precedence between the two main flags is fixed and one-directional. Skipping always takes precedence over explicit tags, so if you specify both `--tags` and `--skip-tags`, the latter has precedence. Passing `--tags tag1,tag3,tag4 --skip-tags tag3` runs tasks tagged `tag1` or `tag4` but not `tag3`, even when a task carries `tag3` alongside one of the others.

## Inheritance is copying, not scoping

If you define tags at the level of a play, block, role, or static import, Ansible applies the tags down the dependency chain to all child tasks. With roles and imports, Ansible appends the tags set by the roles section or import to any tags set on individual tasks or blocks within the role or imported file. This is tag inheritance, and it is the reason you do not have to tag two hundred tasks by hand.

The sentence that follows in the docs is the one that matters: tag inheritance is convenient because you do not have to tag every task, however, the tags still apply to the tasks individually. Inheritance is a copy operation performed during preprocessing, not a scope that persists at runtime. The parent construct does not exist by the time selection is evaluated. This is the same mechanism [[cs/languages/Ansible/blocks-rescue-and-always|block directives]] use, and it produces the same class of surprise: what looks like a container is a distribution operator that pushes attributes onto children and vanishes.

Inheritance also travels further than the role you tagged. When adding a tag at the role level, not only are all tasks tagged, but the role's dependencies also have their tasks tagged. Tagging one role can therefore tag several, and a `--tags` run can pull in work you did not name.

Handlers sit outside the system entirely. Handlers are a special case of tasks that only execute when notified, so they ignore all tags and cannot be selected for nor against. This is coherent given that a handler runs because something notified it, not because it appeared in the selected task list, but it means the tagged view of a play is not a complete view of what will run.

## The reserved tags

Ansible reserves several tag names for special behavior, two of which are `always` and `never`. A task tagged `always` runs regardless of the tag selection, unless you specifically skip it with `--skip-tags always` or another tag defined on that task. A task tagged `never` is skipped unless you specifically request it, which is the idiom for expensive diagnostics that should exist in the playbook but never run by default.

Two implicit tasks carry `always` and are worth knowing about because they are invisible in your source. The internal fact gathering task is tagged `always` by default, and the role argument specification validation task is tagged `always` by default. Both can still be lost: the docs warn that fact gathering can be skipped if you apply a tag to the play and then skip it directly with `--skip-tags`, or indirectly by using `--tags` and omitting it. Argument spec validation is skipped by `--skip-tags always`.

That is the first sharp edge in miniature. Tagging a whole play, which feels like a purely organizational act, moves the implicit fact-gathering task into the tag system alongside your own tasks, where a selective run can drop it. Every `when: ansible_facts[...]` in the play then evaluates against facts that were never gathered.

> [!warning] Tags cut across error handling
> Setting a tag on a task in a block but not in the rescue or always section will prevent those from triggering if your tag selection does not cover the tasks in those sections. The documentation's example is a block whose task fails deliberately, with `rescue` and `always` sections that normally both run. Called with no tags, all three run. Called with `--tags example`, matching only the block task, only the first task runs: the failure happens and neither recovery nor cleanup is selected. A tag filter that reads like "run only this part" silently disabled the error handling around that part.

## Why the subset can be incoherent

The deeper problem is that Ansible has no dependency graph. Task order is the order you wrote, and any relationship between task three and task eleven lives in the author's head. Tag selection lets an operator take an arbitrary subset of that sequence and run it as if it were a program.

The concrete version is familiar to anyone who has done it. A `set_fact` task early in a role is tagged `setup`. A template task later is tagged `config` and interpolates that fact. Running `--tags config` skips the fact and the template task fails on an undefined variable, because the selection cut an edge that the language was never told about. Nothing detects it in advance, because from the preprocessor's view the two tasks are unrelated strings.

A well-behaved [[cs/software-engineering/feature-flags-and-trunk-based-development|feature flag]] guards a self-contained change and the surrounding code stays correct with the flag off. Tags are used the same way and offer none of that discipline. The practical mitigations are to tag at the block or role level so that a functional unit is selected together, to tag prerequisite tasks with every tag that consumes them, and to keep genuinely mandatory setup tagged `always`.

Previewing helps and has a documented blind spot. `--list-tags` shows the available tags and `--list-tasks` combined with a tag selection previews what would run. These command-line flags cannot show tags or tasks within dynamically included files or roles, because a dynamic include has not been expanded at the time the [[cs/pl/compilation-vs-interpretation|preprocessing pass]] runs. The preview is accurate about the static half of your playbook and silent about the rest.

## Related Notes

- [[cs/dsa/topological-sorting|Topological Sorting]] is the structure a task list implicitly has and that tag selection ignores.
- [[cs/languages/Ansible/blocks-rescue-and-always|Blocks, Rescue, and Always]] shares the inherit-by-copy mechanism, and is the construct tags most visibly break.
- [[cs/software-engineering/feature-flags-and-trunk-based-development|Feature Flags and Trunk-Based Development]] is the discipline tags resemble and lack.
- [[cs/pl/compilation-vs-interpretation|Compilation vs Interpretation]] frames why a preprocessing pass cannot see through a dynamic include.
- [[cs/languages/Ansible/roles-and-reuse|Roles and Reuse]] explains the role structure that tag inheritance walks, including dependencies.

## Sources

- [Tags, Ansible playbook guide](https://docs.ansible.com/ansible/latest/playbook_guide/playbooks_tags.html) backs preprocessing precedence, the define-versus-select split, inheritance and its reach into role dependencies, handler exclusion, the reserved tags and the implicit tasks that carry them, the block error-handling interaction, tag precedence, and the preview limitation.

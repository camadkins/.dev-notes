---
title: "Roles and Reuse"
description: "The seven-directory role layout as a loading convention, where Ansible searches for roles, static versus dynamic application, and the per-play deduplication that makes a role behave like a memoized call."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-01-19
updated:
aliases:
  - Ansible Roles
  - Role Directory Structure
---

Roles let you automatically load related vars, files, tasks, handlers, and other Ansible artifacts based on a known file structure. The operative word is *automatically*. A role has no manifest, no export list, and no import statements. Put a file in the right directory and it is loaded; put it elsewhere and it is not.

That is a design choice with consequences, and the consequences are what make a role different from an include.

> [!note] The idea
> A role is convention-as-interface: the directory layout is the entire declaration of what the unit provides. There is no place to state a contract, which is why Ansible added argument validation as a *separate* opt-in file rather than deriving it from the structure. The genuinely surprising behavior sits one level up. Ansible only executes each role once in a play, even if you define it multiple times, unless the parameters defined on the role are different for each definition. A role invocation is therefore closer to a memoized function call keyed on its arguments than to a textual include, and the memo table is scoped to the play: deduplication happens only at the play level, so multiple plays in the same playbook may rerun the roles.

## The seven directories

An Ansible role has a defined directory structure with seven main standard directories. You must include at least one of them, and you can omit any the role does not use. Ansible looks in most role directories for a `main.yml` (also `main.yaml` and `main`):

- `tasks/main.yml` is the list of tasks the role provides to the play for execution.
- `handlers/main.yml` holds handlers imported into the parent play for use by the role or other roles and tasks in the play.
- `defaults/main.yml` holds very low precedence values. A role's own defaults take priority over another role's defaults, but any and all other variable sources override them.
- `vars/main.yml` holds high precedence variables provided by the role to the play.
- `files/` holds files available to the role and its children.
- `templates/` holds templates for the role or child roles, ending in `.j2`.
- `meta/main.yml` holds metadata including role dependencies and optional Galaxy metadata such as supported platforms, required for uploading a standalone role to Galaxy but not for using the role in a play.

The `defaults` and `vars` split is the whole reusability story compressed into two directories, and the gap between "easily overridden" and "hard to override" is 15 rows apart in the [[cs/languages/Ansible/variables-and-precedence|precedence order]]. Both are imported into play scope unless disabled via the `public` option in `import_role`/`include_role`.

None of these files are required. Providing just `files/something.txt` or `vars/for_import.yml` is a valid role. A standalone role, meaning one that is not part of a collection but is individually installable content, can also carry `library/`, `module_utils/`, and plugin directories such as `lookup_plugins/`.

The path convenience is the practical payoff of the convention: any `copy`, `script`, `template`, or `include` task in the role can reference files in `roles/x/{files,templates,tasks}/` without having to path them relatively or absolutely. Move the role directory and nothing breaks, because nothing recorded an absolute location.

Two structural extras are worth knowing. Other YAML files can live in these directories but will not be used by default; they can be included or imported directly, or named with `tasks_from` when loading the role, which bypasses the `main.yml` files. And `defaults` and `vars` may be directories rather than files, in which case Ansible reads all variables files and directories inside in alphabetical order, reading directories first when a nested directory contains both.

## Where Ansible looks

By default Ansible looks for roles in collections (if you are using them), in a `roles/` directory relative to the playbook file, in the configured `roles_path` whose default search path is `~/.ansible/roles:/usr/share/ansible/roles:/etc/ansible/roles`, and in the directory where the playbook file is located. Roles stored elsewhere need `roles_path` set, and checking shared roles into a single location makes them easier to use in multiple playbooks. A role can also be called by fully qualified path (`- role: '/path/to/my/roles/common'`).

This is an ordinary search-path resolution scheme, with the ordinary hazard: a role named `common` in `roles/` next to your playbook shadows a `common` installed system-wide, silently. The same category of problem as any [[cs/languages/common/module-systems-and-namespacing|module system without explicit namespacing]], which is what collections and fully-qualified names exist to fix.

## Three ways to apply one

**At the play level** with the `roles:` option, the classic form. Ansible treats these as static imports and processes them during playbook parsing.

**Dynamically** with `include_role` in the tasks section. Roles added in a `roles:` section run before any other tasks in the play, while included roles run in the order they are defined, so tasks written before an `include_role` run first. A dynamic include can carry a `when`, which is how you make role application conditional on a fact.

**Statically** with `import_role` in the tasks section, whose behavior is the same as using the `roles` keyword.

A role can also arrive as a dependency of another role via the `dependencies` keyword in `meta/main.yml`.

The distinction that matters operationally is tagging. When you add a tag to the `roles` option, Ansible applies the tag to all tasks within the role. When you add a tag to an `include_role` task, Ansible applies the tag only to the include itself, so `--tags` runs selected tasks from the role only if those tasks carry the same tag as the include statement. Static application tags everything; dynamic application tags one node.

## The play's actual execution order

With the `roles:` option in play, Ansible executes each play in this order:

1. Any `pre_tasks` defined in the play.
2. Any handlers triggered by `pre_tasks`.
3. Each role listed in `roles:`, in the order listed, with any role dependencies from the role's `meta/main.yml` running first, subject to tag filtering and conditionals.
4. Any tasks defined in the play.
5. Any handlers triggered by the roles or tasks.
6. Any `post_tasks` defined in the play.
7. Any handlers triggered by `post_tasks`.

That ordering is the reason `pre_tasks` exists at all. It is the only place guaranteed to run before every role, which is where you pull a device out of a [[cs/networking/load-balancing-l4-and-l7|load balancer]] or open a maintenance window. The docs flag the matching hazard directly: if using tags with tasks in a role, tag your `pre_tasks`, `post_tasks`, and role dependencies too and pass those along, especially if the pre/post tasks and role dependencies are used for monitoring outage window control or load balancing. A tag filter that skips your drain step but keeps your config-push step is a live-traffic outage.

## Dependencies and duplicate runs

Role dependencies let you automatically pull in other roles when using a role, and they are stored in `meta/main.yml`. The docs are careful about what they are: role dependencies are prerequisites, not true dependencies, and the roles do not have a parent/child relationship. Ansible loads all listed roles, runs the ones listed under `dependencies` first, then runs the role that lists them, with the play object as the parent of all roles including those called by a dependencies list.

Resolution is recursive with the `roles` keyword. If `foo` lists `bar` as a dependency and `bar` lists `baz`, Ansible executes `baz`, then `bar`, then `foo`. [[cs/dsa/topological-sorting|Depth-first post-order]], the same walk a build system uses on its [[cs/languages/common/build-systems-and-dependency-management|dependency graph]].

Deduplication applies to dependencies exactly as it does to direct listings: if two roles both list a third as a dependency, Ansible runs that dependency once, unless you pass different parameters, tags, or `when` clause, or use `allow_duplicates: true` in the role you want to run multiple times. Two escape hatches exist for deliberate repetition:

- **Different parameters.** `- { role: foo, message: "first" }` and `- { role: foo, message: "second" }` run `foo` twice. Providing different variable values is not the same as passing different role parameters, and this requires the `roles` keyword, since `import_role` and `include_role` do not accept role parameters.
- **`allow_duplicates: true`** in the role's own `meta/main.yml`. With dependencies you must specify it for the role listed under `dependencies`, not for the role that lists it.

> [!warning] Two ways the dedup rule bites
> Role deduplication does not consult the invocation signature of parent roles, so a shared dependency can be skipped on the basis of its own arguments even though the parents differ. Separately, using `vars:` instead of role params changes variable scoping: `vars:` results in those variables being scoped at the play level, which the docs illustrate with a value ending up defined throughout the entire play, including roles called before it. Prefer role params when you intend a value to belong to one invocation.

## When to reach for one

The honest trigger is repetition across playbooks rather than length within one. A role earns its structure when the same bundle of tasks, handlers, templates, and defaults is applied by more than one playbook, because that is when the loading convention and the `defaults`/`vars` overridability split start paying for themselves. Below that, a task file included directly does the same work with less ceremony.

Two capabilities push in favor of a role once you are sharing it. Beginning with version 2.11 you can enable role argument validation based on an argument specification defined in `meta/argument_specs.yml`, defined in a top-level `argument_specs` block with all fields lowercase, which recovers the explicit contract the directory convention does not provide. And a standalone role can embed custom modules and plugins: a module placed in the role's `library/` directory is usable in the role itself as well as any roles called after it, which is how you ship an internal module without telling everyone in the organization to configure their Ansible library path.

For distribution beyond your own repository, Ansible Galaxy is a free site for finding, downloading, rating, and reviewing community-developed roles, and the `ansible-galaxy` client included in Ansible downloads roles and provides a default framework for creating your own.

## Related Notes

- [[cs/languages/Ansible/variables-and-precedence|Variables and Precedence]] - why `defaults/` and `vars/` sit at opposite ends of the override order
- [[cs/languages/Ansible/playbooks-plays-and-tasks|Playbooks, Plays, and Tasks]] - the play whose ordering `pre_tasks`, roles, and `post_tasks` divide
- [[cs/languages/Ansible/jinja2-templating-and-facts|Jinja2 Templating and Facts]] - the `templates/` directory's contents and the facts they render against
- [[cs/languages/common/module-systems-and-namespacing|Module Systems and Namespacing]] - search paths, shadowing, and what collections fix
- [[cs/languages/common/build-systems-and-dependency-management|Build Systems and Dependency Management]] - recursive prerequisite resolution and deduplicated targets, the same shape
- [[cs/software-engineering/coupling-and-cohesion|Coupling and Cohesion]] - the packaging judgment a role is making

## Sources

- "Roles," Ansible Community Documentation. https://docs.ansible.com/ansible/latest/playbook_guide/playbooks_reuse_roles.html . Supports the definition of a role and automatic loading by known file structure, the seven standard directories and their `main.yml` contents, the defaults-versus-vars precedence note and the `public` option, roles being valid with any single directory, standalone roles and embedded `library/` modules, relative file references inside a role, `tasks_from` and non-default YAML files, `vars`/`defaults` as directories read alphabetically, the four default role search locations and `roles_path` default, fully qualified role paths, the four ways to apply a role, static-versus-dynamic ordering and tagging differences, the seven-step play execution order and the tagging warning about outage windows and load balancing, role dependencies as prerequisites with recursive `baz`/`bar`/`foo` resolution, once-per-play deduplication and its play-level scope, different parameters and `allow_duplicates: true` as the two escape hatches, deduplication not consulting parent invocation signatures, the `vars:` play-level scoping side effect, `meta/argument_specs.yml` argument validation from version 2.11, and Ansible Galaxy plus the `ansible-galaxy` client.

---
title: "Variables and Precedence"
description: "The twenty-two-slot precedence order, the separate inventory merge that runs before it, and why a variable's value is decided by where you wrote it rather than when it is read."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-02-02
updated:
aliases: []
---

You can define variables in inventory, in playbooks, in reusable files, in roles, and at the command line. Ansible loads every possible variable it finds, then chooses the variable to apply based on variable precedence rules. Read that sentence twice, because it is doing more work than it looks like it is.

Nothing is shadowed and nothing is skipped. There is no scope chain being walked, no innermost binding winning by virtue of being innermost. Every definition of `ntp_server` in your entire project is loaded into a pile, and then [[cs/cisco/static-routing-and-administrative-distance|a fixed ranking]] decides which one survives.

> [!note] The idea
> Ansible resolves a variable by source rank, not by lexical nesting or evaluation time. The winner is a function of *which file the definition lives in*, which is the opposite of how [[cs/pl/scoping-binding-and-closures|lexical scoping]] works in a normal language, where the enclosing structure of the code decides. The practical consequence is that "why is this value wrong" is never a control-flow question. You do not trace execution. You enumerate the places the name is defined and read off the highest-ranked one. That makes the bug findable by grep, which is a real property, and it is also why moving a file between `group_vars/` directories can silently change behavior with no diff in any playbook.

## The order, from least to greatest

Ansible's own list, from least to greatest, where the last listed variables override all other variables:

1. Command-line values (for example, `-u my_user`, these are not variables)
2. Role defaults
3. Inventory file or script group vars
4. Inventory `group_vars/all`
5. Playbook `group_vars/all`
6. Inventory `group_vars/*`
7. Playbook `group_vars/*`
8. Inventory file or script host vars
9. Inventory `host_vars/*`
10. Playbook `host_vars/*`
11. Host facts and cached `set_facts`
12. Play `vars`
13. Play `vars_prompt`
14. Play `vars_files`
15. Role `vars`
16. Block vars (for tasks in block only)
17. Task vars (for the task only)
18. `include_vars`
19. Registered vars and `set_facts`
20. Role (and `include_role`) params
21. `include` params
22. Extra vars (for example, `-e "user=my_user"`), which always win precedence

Four things in that list reward a second look.

**Command-line values sit at the bottom, extra vars at the top.** The same command line holds both the weakest and the strongest sources. `-u my_user` is a connection setting that anything can override; `-e "ansible_user=my_user"` cannot be overridden by anything. The parenthetical in the docs explains why they differ: command-line values are not variables at all.

**Playbook-adjacent group vars outrank inventory-adjacent ones.** Rows 4 through 7 alternate: inventory `group_vars/all`, then playbook `group_vars/all`, then inventory `group_vars/*`, then playbook `group_vars/*`. Two `group_vars/` directories exist in a normal project, one beside the inventory and one beside the playbook, and the playbook's copy wins at each tier. Anyone who has moved a file "to tidy up" and changed behavior has met this row.

**All host-level sources outrank all group-level sources.** Rows 3 through 7 are group scope, rows 8 through 10 are host scope, and the boundary is clean. [[cs/networking/routing-and-longest-prefix-match|Specific beats general]], which is the property that makes the group hierarchy usable at all.

**Facts sit in the middle.** Host facts and cached `set_facts` land at row 11, above every inventory source and below everything written inside a play. Discovered reality overrides your inventory's guess, and your play's explicit statement overrides discovered reality. See [[cs/languages/Ansible/jinja2-templating-and-facts|Jinja2 templating and facts]] for what facts are.

Within any section, redefining a var overrides the previous instance. If multiple groups have the same variable, the last one loaded wins. If you define a variable twice in a play's `vars:` section, the second one wins. All of that describes the default config `hash_behavior=replace`; switching to `merge` overwrites only partially.

## The inventory merge is a separate, earlier pass

The 22-row list is not the whole story, and the missing half explains most confusion about group variables.

Before it runs a play, Ansible merges and flattens variables to the specific host. This process keeps Ansible focused on the host and task, so groups do not survive outside of inventory and host matching. By the time the play begins, there is no such thing as a group variable. There are only host variables, some of which happened to come from groups.

That flattening has its own precedence, from lowest to highest: the `all` group (because it is the parent of all other groups), then parent group, then child group, then host. Depth in the hierarchy is what makes a group specific.

Sibling groups are the ambiguous case, and the tiebreak is alphabetical. Ansible merges groups at the same parent/child level in alphabetical order, and variables from the last group loaded overwrite variables from the previous ones, so merging `a_group` with `b_group` lets matching variables from `b_group` overwrite `a_group`. Depending on alphabetical accident is not a design, which is why `ansible_group_priority` exists: it overrides the alphabetical sorting for groups of the same level after parent/child order is resolved, the larger number merging later and therefore winning, defaulting to 1. It can be set only in an inventory source, not in `group_vars/`, because Ansible uses it when it loads the `group_vars/` directory.

Load order of inventory sources matters for the same reason. When you pass multiple inventory sources at the command line, Ansible merges variables in the order you pass those parameters. If `[all:vars]` in staging defines `myvar = 1` and production defines `myvar = 2`, then `-i staging -i production` runs with `myvar = 2` and `-i production -i staging` runs with `myvar = 1`.

> [!example] One NTP server, three levels
> The docs' own worked case, which is the shape almost every network fleet ends up in. `group_vars/all` sets the site-wide default `ntp_server: default-time.example.com`. All groups are children of the `all` group, so `group_vars/boston` setting `ntp_server: boston-time.example.com` overrides it for that location. A single host that needs something else gets `host_vars/xyz.boston.example.com` with `ntp_server: override.example.com`, which overrides the group variable. Three files, no conditionals, and the specificity ordering does the branching.

## Where to put a variable

The docs' guidance is stated as a design rule rather than a workaround: teams and projects that agree on guidelines for defining variables usually avoid variable precedence concerns, and you should define each variable in one place. The precedence table is a tiebreak, not a feature to build on.

Three placement decisions carry most of the weight.

- **Role defaults** (`roles/x/defaults/main.yml`) exist to avoid undefined-variable errors and are meant to be overridden; other users can rely on the reasonable defaults or easily override them in inventory or at the command line.
- **Role vars** (`roles/x/vars/main.yml`) ensure a value is used in that role and is not overridden by inventory variables. Sharing a role and putting variables here makes them harder to override, though a role parameter or `-e` still wins.
- **Role parameters** passed at the call site give maximum clarity, flexibility, and visibility, and override any defaults that exist for a role. They also let the same role run several times with different values in one play.

Variables set in one role are available to later roles, with protections that avoid the need to namespace them: with `common_settings` running first and `something` invoked with `foo: 12`, tasks in `something` see `foo` as 12 even if `common_settings` set it to 20.

Ansible also frames scope directly, in three levels: **global**, set by config, environment variables, and the command line; **play**, meaning each play and contained structures, `vars` entries (`vars`, `vars_files`, `vars_prompt`), role defaults and vars; and **host**, meaning variables directly associated to a host, like inventory, `include_vars`, facts, or registered task outputs.

> [!tip] The escape hatch, and its cost
> The docs' closing advice is to think about how easily or how often you want to override a value rather than memorizing the table, and if you are unsure what other variables are defined and need a particular value, use `--extra-vars` (`-e`) to override all other variables. That works precisely because row 22 always wins. It is also unconditional and invisible to anyone reading the repository later, so it belongs in an operator's hands, not in a committed wrapper script.

## Related Notes

- [[cs/languages/Ansible/inventory-and-host-patterns|Inventory and Host Patterns]] - the group hierarchy that the inventory merge flattens
- [[cs/languages/Ansible/roles-and-reuse|Roles and Reuse]] - `defaults/` versus `vars/` as the two ends of the overridability spectrum
- [[cs/languages/Ansible/jinja2-templating-and-facts|Jinja2 Templating and Facts]] - where facts enter the precedence order and how templates consume the result
- [[cs/pl/scoping-binding-and-closures|Scoping, Binding, and Closures]] - lexical scope as the contrast case, where structure rather than source rank decides
- [[cs/pl/language-design-values-variables-environments|Values, Variables, and Environments]] - the environment as a mapping from names to values, which is what the flattening pass produces

## Sources

- "Using Variables," Ansible Community Documentation. https://docs.ansible.com/ansible/latest/playbook_guide/playbooks_variables.html . Supports Ansible loading every variable and choosing by precedence, the full 22-entry precedence list from least to greatest, the redefinition and last-group-loaded notes and `hash_behavior=replace`, the three scopes (global, play, host), the `group_vars/all` to `group_vars/boston` to `host_vars` NTP example, the defaults-versus-vars-versus-parameters guidance, variables from one role being available to later roles with the `foo: 12` example, and the `--extra-vars` advice.
- "How to build your inventory," Ansible Community Documentation. https://docs.ansible.com/ansible/latest/inventory_guide/intro_inventory.html . Supports the pre-play merge and flatten to the specific host, groups not surviving outside inventory and host matching, the `all` to parent to child to host ordering, alphabetical sibling merging with the `a_group`/`b_group` example, `ansible_group_priority` semantics and its inventory-source-only restriction, and the multi-source `-i staging -i production` load-order outcomes.

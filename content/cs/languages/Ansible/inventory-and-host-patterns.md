---
title: "Inventory and Host Patterns"
description: "Static and dynamic inventory sources, groups and parent/child relationships, and how a host pattern resolves as a set expression with fixed operator precedence."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-05-06
updated:
aliases:
  - Ansible Inventory
  - Host Patterns
---

Ansible automates tasks on managed nodes by using a list or group of lists known as inventory, composed from one or more inventory sources. The `hosts:` line of a play is a pattern evaluated against that inventory. Two separate mechanisms, then: something that builds a set of named hosts, and something that selects a subset of them.

Keeping them separate is the whole trick. The pattern language never touches the network. It is a set expression over names that already exist in a data structure, which is why a typo in a pattern gives you a warning and an empty run rather than a connection attempt to a machine that may or may not be yours.

> [!note] The idea
> Patterns depend on inventory: if a host or group is not listed in your inventory, you cannot use a pattern to target it. That closed-world assumption is a safety property, not a limitation. The universe of machines Ansible can act on is bounded by a file you control and can review, so the blast radius of any run is auditable before it starts. The corollary bites when you forget it: because `inventory_hostname` is the unique identifier for a host and can be a bare alias, the pattern matches the name in the inventory, never the address behind it. Define a host with `ansible_host: 127.0.0.2` and a pattern of `127.0.0.2` matches nothing.

## What an inventory source can be

The simplest inventory is a single file containing a list of hosts and groups, defaulting to `/etc/ansible/hosts`, overridable with `-i <path or expression>`. The most common formats are INI and YAML because Ansible includes built-in support for them. Headings in brackets are group names in INI; the YAML form nests hosts under a group key.

Past a few dozen devices, one file stops working, and there are three escape hatches.

**A directory of sources.** Consolidating multiple inventory sources in a single directory makes the directory your single inventory source, and Ansible aggregates the multiple sources it finds there. Ansible reads and loads files from the top directory down in alphabetically sorted order. Inside such a directory, executable files are treated as dynamic inventory sources and most other files as static sources, with files ending in `~`, `.orig`, `.bak`, `.ini`, `.cfg`, `.retry`, `.pyc`, or `.pyo` ignored.

**Multiple sources at once.** You can target multiple inventory sources at the same time (`ansible-playbook get_logs.yml -i staging -i production`), which is useful when you want to target normally separate environments at the same time for a specific action.

**Dynamic inventory.** Ansible supports two ways to connect with external inventory: inventory plugins and inventory scripts, and the docs recommend plugins over scripts. The mental model is worth stating plainly: dynamic inventory is a function from an external system of record to the same host-and-group structure a static file would have declared. Their own worked example uses Cobbler as a lightweight CMDB, where a system carrying management classes `webserver` and `atlanta` becomes addressable under those group names in Ansible. If your source of truth for what exists on the network is NetBox, a CMDB, or a cloud API, dynamic inventory is how that truth reaches the play without a human retyping it.

Mixing is explicitly supported: in an inventory directory you can combine static and dynamic hosts and manage them as one inventory.

## Groups, and the two that always exist

Groups allow you to reference multiple associated hosts to target for your automation or to define variables in bulk. Both halves of that sentence matter, and the second half is the one that shapes how you design an inventory, because a group is also a variable scope (see [[cs/languages/Ansible/variables-and-precedence|variables and precedence]]).

Even if you define no groups, Ansible creates two: `all` contains every host, and `ungrouped` contains all hosts that do not belong to any other group. Every host always belongs to at least two groups.

A host can be in more than one group, and the docs suggest organizing along three axes: **what** (an application, stack, or microservice), **where** (a datacenter or region, to talk to local DNS or storage), and **when** (the development stage, to avoid testing on production resources). A host lands in the intersection of all three. That is the design that makes patterns expressive later: `core:&east:!maintenance` only means something if `core`, `east`, and `maintenance` are independent axes rather than a single hierarchy.

Groups nest. Parent groups are also known as nested groups or groups of groups, built with the `:children` suffix in INI or a `children:` entry in YAML. Four properties govern them:

- Any host that is a member of a child group is automatically a member of the parent group.
- A group can have multiple parents and children, but not [[cs/dsa/topological-sorting|circular relationships]].
- A host can be in multiple groups, but Ansible processes only one instance of the host at runtime, merging the data from multiple groups.
- Hosts and groups are always global. Defining a host or group more than once either adds new information to it or overwrites conflicting information with the latest definition.

That third property is the one people get wrong. Membership in six groups does not mean six executions. It means one host with a merged variable set.

For a fleet with regular naming, ranges compress the file: `www[01:50].example.com` in either format, with an optional stride so `www[01:50:2].example.com` matches www01, www03, www05 through www49. Ranges are inclusive, leading zeros are optional, and alphabetic ranges work too (`db-[a:f].example.com`).

## The pattern language

In a playbook, the pattern is the content of the `hosts:` line for each play. In an ad hoc command it is the only element with no flag, usually the second one.

| Description | Pattern |
|---|---|
| All hosts | `all` (or `*`) |
| One host | `host1` |
| Multiple hosts | `host1:host2` (or `host1,host2`) |
| One group | `webservers` |
| Multiple groups | `webservers:dbservers` |
| Excluding groups | `webservers:!atlanta` |
| Intersection of groups | `webservers:&staging` |

Either a comma or a colon separates a list of hosts, with the comma preferred when dealing with ranges and IPv6 addresses, which is the obvious consequence of colons already meaning something inside an [[cs/networking/ipv6-essentials|IPv6 address]].

Combined, `webservers:dbservers:&staging:!phoenix` targets all machines in webservers and dbservers that are also in staging, except any in phoenix. Wildcards work against FQDNs or IP addresses as long as the hosts are named in your inventory by FQDN or IP address, and can mix with groups (`one*.com:dbservers`). A pattern starting with `~` is a regular expression.

The part that separates people who use patterns from people who trust them is the [[cs/pl/grammar-ambiguity-parse-trees|evaluation order]]. Processing happens in this order: first `:` and `,`, then `&`, then `!`. Positioning only accounts for processing order inside each operation, so `a:b:&c:!d:!e`, `&c:a:!d:b:!e`, and `!d:a:!e:&c:b` all resolve identically to: host in (a or b) AND host in c AND host not in (d, e). Union first, then narrow, then subtract. Writing the exclusion first does not make it happen first.

> [!warning] The pattern is not a filter on reality
> Two failure modes both surface as the same warning, `Could not match supplied host pattern, ignoring:`. One is that the host genuinely is not in inventory. The other is that it is in inventory under a different identifier, because you used the IP where the inventory declared an alias. Neither is a connectivity problem, and no packet was sent. Check inventory before you check the device.

## Narrowing a run without editing the playbook

`--limit` intersects with whatever the playbook already declared and does reference your inventory, so `ansible-playbook site.yml --limit datacenter2` runs a `hosts: all` playbook against one site. Negated limits need single quotes to prevent bash interpolation (`--limit 'all:!host1'`). A limit can be read from a file by prefixing the filename with `@`, which pairs with retry files: if `RETRY_FILES_ENABLED` is set to True, a `.retry` file is created after the run containing a list of failed hosts from all plays, and it is overwritten each time `ansible-playbook` finishes.

There is also `-i 127.0.0.2,` with a trailing comma, which works even if the host is not defined in your inventory. The tradeoff is documented and sharp: this method will not read your inventory for variables tied to this host, and any variables the playbook requires must be specified manually at the command line.

## Related Notes

- [[cs/languages/Ansible/playbooks-plays-and-tasks|Playbooks, Plays, and Tasks]] - the play whose `hosts:` line consumes these patterns
- [[cs/languages/Ansible/variables-and-precedence|Variables and Precedence]] - groups as variable scopes, and what happens when a host inherits from several
- [[cs/languages/Ansible/jinja2-templating-and-facts|Jinja2 Templating and Facts]] - `inventory_hostname` and group membership as template inputs
- [[cs/networking/ipv6-essentials|IPv6 Essentials]] - why colon-separated addresses force the comma form
- [[cs/networking/sdn-software-defined-networking|Software-Defined Networking]] - centralizing network state in a controller, the same separation of source-of-truth from device

## Sources

- "How to build your inventory," Ansible Community Documentation. https://docs.ansible.com/ansible/latest/inventory_guide/intro_inventory.html . Supports the definition of inventory and inventory sources, the `/etc/ansible/hosts` default and `-i` override, INI and YAML as built-in formats, the `all` and `ungrouped` default groups, hosts in multiple groups and the what/where/when axes, parent/child groups with `:children` and `children:` plus their four properties, host ranges and strides, multiple `-i` sources, inventory directories and alphabetical load order, and `inventory_hostname` as the unique identifier with aliases.
- "Patterns: targeting hosts and groups," Ansible Community Documentation. https://docs.ansible.com/ansible/latest/inventory_guide/intro_patterns.html . Supports the pattern's position in ad hoc commands and the `hosts:` line, the common-pattern table, the comma-versus-colon guidance, the combined `webservers:dbservers:&staging:!phoenix` example, wildcards and `~` regexes, the inventory-dependence limitation and its warning text, the `:`/`,` then `&` then `!` processing order with the equivalent-orderings example, `--limit` and its quoting and `@file` forms, retry files under `RETRY_FILES_ENABLED`, and the `-i 127.0.0.2,` caveat about variables.
- "Working with dynamic inventory," Ansible Community Documentation. https://docs.ansible.com/ansible/latest/inventory_guide/intro_dynamic_inventory.html . Supports inventory plugins and scripts as the two ways to connect external inventory with plugins recommended, Cobbler as a lightweight CMDB whose management classes become Ansible groups, mixing dynamic and static sources in one directory, and the executable-versus-static rule with the ignored-extension list.

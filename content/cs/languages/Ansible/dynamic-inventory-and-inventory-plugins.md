---
title: "Dynamic Inventory and Inventory Plugins"
description: "Inventory as a program rather than a file: the two mechanisms Ansible offers, why caching turns the host list into a stale read, and how constructed groups depend on parse order you cannot configure."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-08-11
updated:
aliases: []
---

A static inventory file is a literal. You write down the hosts, Ansible reads them, and the set of machines your play targets is exactly what is in the file. That works until the machines stop being written down.

If your Ansible inventory fluctuates over time, with hosts spinning up and shutting down in response to business demands, the static inventory solutions will not serve your needs. Ansible integrates all of the alternatives, cloud providers, LDAP, CMDB systems, through a dynamic external inventory system.

> [!note] The idea
> Dynamic inventory replaces a literal with a computation, and every property of a computation follows it in. The host list is now the return value of code that ran on the control node moments before the play started, which means it can fail, it can be cached and therefore stale, it can produce different answers on consecutive runs, and it depends on evaluation order. [[cs/languages/Ansible/inventory-and-host-patterns|Host patterns]] then select over a set that no longer exists anywhere as text, which is why `ansible-inventory --graph` is not a convenience but the only way to see the value your play is actually operating on.

## Two mechanisms, one recommended

Ansible supports two ways to connect with external inventory: inventory plugins and inventory scripts. Inventory plugins take advantage of the most recent updates to the Ansible Core code, and the docs recommend plugins over scripts for dynamic inventory. Scripts remain supported because when inventory plugins were implemented, backwards compatibility was ensured through the `script` inventory plugin, so the older mechanism became a special case of the newer one.

The script interface is the crude version and worth understanding because it makes the model obvious. A script is any executable that prints JSON describing hosts, groups, and variables. In an inventory directory, executable files are treated as dynamic inventory sources and most other files as static sources. That is the entire dispatch rule: the executable bit decides whether Ansible parses your file or runs it.

Two things follow. The first is that mixing works. When you point `-i` at a directory, it is possible to mix both dynamic and statically managed inventory sources in the same run, so a cloud query and a hand-written file of on-premises hosts merge into one inventory. The second is a trust question. Anything with the executable bit in that directory is code that Ansible executes on the control node with your credentials and your network position, before any play has begun. There is no sandbox and no declaration of intent, so an inventory directory is a [[cs/security/privilege-separation-and-least-privilege|privilege boundary]] that does not look like one.

Plugins are the structured replacement. Inventory plugins allow users to point at data sources to compile the inventory of hosts that Ansible uses to target tasks. Instead of an executable, you write a small YAML file naming a plugin and its options, and the plugin does the querying with configuration, documentation, and caching handled by the framework. The file naming is load-bearing: inventory plugins have required name patterns to which they must conform, so a config file must match the plugin's documented pattern to be picked up by the `auto` plugin at all.

## Constructed groups

The interesting capability is not fetching hosts, it is deriving structure from them. You can create dynamic groups using host variables with the `constructed` `keyed_groups` option, and the `groups` option creates groups from arbitrary Jinja2 conditions while `compose` creates and modifies host variables.

The AWS example in the docs is the canonical shape. A `keyed_groups` entry on `tags.Name` mints one group per distinct tag value. A `groups` entry with a condition like `public_ip_address is not defined` collects every host without a public address into `private_only`. A `compose` entry sets `ansible_host` to the public address falling back to the private one, so the connection layer targets whichever exists.

This is a projection over the fetched data, computed on the controller, that turns cloud metadata into the group [[cs/dsa/graphs|graph]] your plays already know how to address. Nobody maintains the `role_Webserver` group; it exists because a tag exists. The failure mode is quiet by design: if a host does not have the variables named in the configuration, the host is not added to groups other than those the inventory plugin creates, and `ansible_host` is not modified. A typo in a key name produces smaller groups rather than an error.

> [!warning] Order matters and you cannot set it
> The `constructed` plugin only operates on hosts already in inventory, so it must be parsed after the sources that supply those hosts. Ansible parses an inventory directory recursively and alphabetically. You cannot configure the parsing approach, so you name your files to make it work predictably, which is why real repositories contain inventory files with numeric prefixes. The alternative is passing multiple `-i` flags in the order you want. A dependency between two configuration files, resolved by filename sorting, is exactly the kind of ordering hazard a build system exists to remove.

The same ordering constraint shows up between static and dynamic sources. When defining groups of groups in the static inventory file, the child groups must also be defined in the static inventory file, otherwise Ansible returns an error. To build a static group whose children are dynamic groups, you declare those dynamic groups as empty in the static file so the reference resolves, and let the dynamic source populate them later.

## Caching makes the host list a stale read

Inventory plugins that support caching can use the general settings for the fact cache defined in the `[defaults]` section of `ansible.cfg`, or define inventory-specific settings in the `[inventory]` section, and individual plugins can set their own cache plugin, timeout, and connection. The shared machinery with [[cs/languages/Ansible/fact-gathering-and-caching|fact caching]] is not a coincidence: both are expensive queries against remote systems whose answers are usable for a while.

Caching is close to mandatory in practice, because cloud APIs are slow and rate-limited and a large inventory query in front of every play is not workable. Accepting it changes what a run means. The play no longer executes against the current fleet, it executes against a snapshot with a timeout on it. A machine terminated four minutes ago is still in a cache with a two-hour timeout, and the play will try to reach it and record it as unreachable. A machine created two minutes ago is not in the inventory at all and is silently not configured.

That second case is the one that hurts, because nothing reports it. An unreachable host is a visible failure. A host that was never in the inventory produces no output of any kind, and the run is green. In [[cs/systems/consistency-models|consistency]] terms the inventory offers a stale read with a bounded staleness window and no read-your-writes guarantee, and the correct operational response is to treat post-provisioning configuration as needing an explicit cache refresh rather than assuming the next scheduled run will catch up.

One more inherited property is worth flagging. Variables from an external inventory source override same-named variables from other sources at the same level of the precedence order, so an inventory plugin is not only supplying the host list but also injecting variables that can quietly replace values you set elsewhere.

## Related Notes

- [[cs/languages/Ansible/inventory-and-host-patterns|Inventory and Host Patterns]] covers the selection language that operates on whatever the inventory produced.
- [[cs/systems/consistency-models|Consistency Models]] names what a cached host list actually guarantees, which is less than operators assume.
- [[cs/security/privilege-separation-and-least-privilege|Privilege Separation and Least Privilege]] is the frame for a directory whose executable files run as you before the play starts.
- [[cs/dsa/graphs|Graphs]] is the structure constructed groups build, and the reason group membership is a derived rather than declared property.
- [[cs/languages/Ansible/fact-gathering-and-caching|Fact Gathering and Caching]] shares the cache plugin machinery and the same staleness tradeoff.

## Sources

- [Working with dynamic inventory](https://docs.ansible.com/ansible/latest/inventory_guide/intro_dynamic_inventory.html) backs the motivation, the plugin-versus-script split, the executable-bit dispatch rule, mixing sources, the static-group-of-dynamic-groups requirement, and inventory variable override.
- [Inventory plugins](https://docs.ansible.com/ansible/latest/plugins/inventory.html) backs the plugin definition, file naming patterns, `constructed` groups and their ordering requirement, alphabetical directory parsing, missing-variable behavior, and inventory caching configuration.

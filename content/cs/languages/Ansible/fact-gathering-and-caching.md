---
title: Fact Gathering and Caching
description: "The setup module is a task like any other, so discovery costs a full round trip per host, and the three gathering policies are a cache coherence decision dressed as a configuration setting."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-08-14
updated:
aliases: []
---

Fact gathering is the one step in an Ansible run that nobody writes. "By default, Ansible gathers facts at the beginning of each play," and the thing doing it is an ordinary module: `setup` "is automatically called by playbooks to gather useful variables about remote hosts that can be used in playbooks." What the facts are and how you read them is covered in [[cs/languages/Ansible/jinja2-templating-and-facts|Jinja2 templating and facts]]. What they cost, and what the caching options actually promise, is a separate question with a more interesting answer.

> [!note] The idea
> Gathering is a task, so it pays a task's price. Because the mechanism in [[cs/languages/Ansible/the-execution-model-and-module-transfer|the execution model]] assembles and ships a module for every invocation, an implicit `gather_facts` against four hundred hosts is four hundred module transfers and four hundred remote executions before the first line of your playbook runs, throttled by the same worker pool as everything else. The three gathering policies are then not a convenience setting but a cache coherence choice: `implicit` ignores the cache and rescans per play, `smart` scans each host once per run, and `explicit` refuses to scan unless asked. Choosing one is choosing how stale you are willing for your view of a machine to be.

## What setup actually collects

The module's `gather_subset` parameter is the inventory of what discovery means, and reading the list is instructive. Among the possible values are `all`, `architecture`, `cmdline`, `date_time`, `devices`, `distribution`, `dns`, `env`, `hardware`, `interfaces`, `iscsi`, `kernel`, `mounts`, `network`, `pkg_mgr`, `platform`, `processor`, `python`, `selinux`, `service_mgr`, `ssh_host_pub_keys`, `systemd`, `user`, `virtual`, and `virtualization_type`. That is an operating system inventory, a hardware inventory, a network inventory, and a package manager probe, all in one call.

Subsets compose with an explicit exclusion syntax. Values can be given as a list to widen the collection, and prefixing a value with `!` excludes it, as in `!hardware,!network,!virtual,!ohai,!facter`. Two special cases anchor the scheme: "if `!all` is specified then only the `min` subset is collected. To avoid collecting even the `min` subset, specify `!all,!min`." So there is a floor set of facts that survives every exclusion until you name it directly, which is the sensible default for a system that needs to know at least what kind of machine it is talking to.

`gather_timeout` sets "the default timeout in seconds for individual fact gathering," defaulting to 10. That timeout is per fact gathering operation, not per host, which is why a single wedged mount point or an unresponsive `ip` command shows up as one slow host rather than a hung run.

There is also a dependency worth knowing before you debug an empty variable: "you may see missing fact values or facts set to default values because the packages that support gathering those facts are not installed by default," and the documented example is that Linux network fact gathering "depends on the `ip` binary, commonly included in the `iproute2` package." A fact is not a property of a machine. It is the output of a program that has to be present on that machine.

The `filter` parameter trims what comes back using shell-style patterns, with one restriction the docs state plainly: "the `filter` option filters only the first level subkey below `ansible_facts`." Filtering reduces what you receive, not what the module collects, so it is an output control rather than a cost control. The cost control is `gather_subset`.

## Turning it off, and what that implies

Disabling gathering is one line, `gather_facts: false`, and the documentation's rationale is scale: turning it off at the play level improves scalability, "particularly in push mode with very large numbers of systems," or when you already know everything about your systems centrally.

That last clause names the real tradeoff. Ansible assumes the truth about a machine lives on the machine and must be fetched, so an authoritative inventory elsewhere makes the fetch redundant. Skip gathering, though, and every conditional written against `ansible_facts` breaks, which couples a performance switch to the correctness of unrelated tasks.

## The caching layer

"Like registered variables, facts are stored in memory by default. However, unlike registered variables, facts can be gathered independently and cached for repeated use." The independence is the whole point: with cached facts "you can refer to facts from one system when configuring a second system, even if Ansible executes the current play on the second system first," which removes the ordering constraint that otherwise binds cross-host templating.

Caching is handled by cache plugins. The default is the memory plugin, which "stores facts in memory for the duration of the current playbook run," and the configuration reference is blunter still: "by default, no cache is used and facts do not persist between runs." Selecting a persistent plugin makes them survive, with `CACHE_PLUGIN_TIMEOUT` giving an expiration for the cached data, defaulting to 86400 seconds. That is a time-to-live cache with a one-day default, the same structure as any other layer in [[cs/systems/memory-hierarchy-and-caching|the memory hierarchy]], sitting between the control node and a fleet instead of between a core and DRAM.

The operational pattern the docs suggest follows directly: "if you manage thousands of hosts, you can configure fact caching to run nightly, and then manage configuration on a smaller set of servers periodically throughout the day."

## The three gathering policies

`DEFAULT_GATHERING` selects between three, and both `smart` and `explicit` use the cache plugin.

- `implicit` (the default): "the cache plugin will be ignored and facts will be gathered per play unless `gather_facts: False` is set."
- `explicit`: "facts will not be gathered unless directly requested in the play."
- `smart`: "each new host that has no facts discovered will be scanned, but if the same host is addressed in multiple plays it will not be contacted again in the run."

Read as caching policy, `implicit` is a no-cache read-through that revalidates on every play, `smart` is a per-run memo table keyed on host, and `explicit` is a manual load. The default is the most conservative and the most expensive, which is the correct default for a tool whose entire value depends on acting on the machine as it currently is.

> [!warning] Cached facts are a claim about the past
> A persistent cache means a template can render `ansible_default_ipv4` for a host that has not been contacted in twenty-three hours, and nothing in the run announces that. The difference between what the cache says and what is true on the box is exactly the staleness window that [[cs/systems/consistency-models|consistency models]] exist to name, and Ansible offers no read-your-writes guarantee across it. A machine reimaged this morning, a NIC added at lunch, or a host that failed its last gather all read as fine. The mitigations are the ordinary ones: keep the timeout shorter than your rate of change, re-run `setup` explicitly for facts you are about to depend on, and remember that facts gathered by a delegated task land under the delegating host unless you say otherwise, as described in [[cs/languages/Ansible/delegation-run-once-and-local-actions|delegation, run_once, and local actions]].

One last detail closes the loop with dry runs: the `setup` module declares full support for check mode and no support for diff mode. Gathering facts changes nothing, so it runs normally under `--check`, which is why a check-mode run still produces accurate conditionals even though almost nothing else about it is real.

## Related Notes

- [[cs/languages/Ansible/jinja2-templating-and-facts|Jinja2 Templating and Facts]] - what the gathered data looks like and how templates consume it
- [[cs/languages/Ansible/the-execution-model-and-module-transfer|The Execution Model and Module Transfer]] - why one implicit gather costs a full module round trip per host
- [[cs/languages/Ansible/variables-and-precedence|Variables and Precedence]] - where facts sit relative to every other source of a value
- [[cs/systems/memory-hierarchy-and-caching|Memory Hierarchy and Caching]] - the general shape of a time-to-live cache in front of an expensive read
- [[cs/systems/consistency-models|Consistency Models]] - the vocabulary for what a stale fact cache does and does not promise
- [[cs/languages/Ansible/check-mode-and-diff|Check Mode and Diff]] - the mode in which gathering is one of the few things that still really happens

## Sources

- "setup module," Ansible Community Documentation. https://docs.ansible.com/ansible/latest/collections/ansible/builtin/setup_module.html . Supports the module being automatically called by playbooks to gather variables about remote hosts, the `gather_subset` value list and exclusion syntax including the `min` subset behavior, `gather_timeout` defaulting to 10 seconds per fact gathering operation, the `filter` parameter and its first-level subkey restriction, and the module's full check mode support with no diff mode support.
- "Discovering variables: facts and magic variables," Ansible Community Documentation. https://docs.ansible.com/ansible/latest/playbook_guide/playbooks_vars_facts.html . Supports gathering at the beginning of each play, disabling gathering for scalability in push mode, facts being stored in memory by default but gatherable independently and cacheable, cross-host reference with cached facts, cache plugins with memory as the default, the nightly caching pattern for thousands of hosts, and the package dependency note including `iproute2` for network facts.
- "Ansible Configuration Settings," Ansible Community Documentation. https://docs.ansible.com/ansible/latest/reference_appendices/config.html . Supports `CACHE_PLUGIN` defaulting to memory with no persistence between runs, `CACHE_PLUGIN_TIMEOUT` defaulting to 86400, and the `DEFAULT_GATHERING` policy definitions for implicit, explicit, and smart along with both non-default policies using the cache plugin.

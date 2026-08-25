---
title: "Jinja2 Templating and Facts"
description: "Facts as discovered variables, Jinja2 rendering on the control node, and why central rendering is what makes one host's configuration depend on another host's reality."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-06-18
updated:
aliases: []
---

Ansible uses Jinja2 templating to enable dynamic expressions and access to variables and facts. A template is a configuration file with holes in it; facts are data about the remote systems that fill the holes. Both halves are ordinary enough. The load-bearing detail is *where* the filling happens.

All templating happens on the Ansible control node before the task is sent and executed on the target machine. The device never sees a template. It receives a finished file.

> [!note] The idea
> Rendering centrally inverts what a configuration file can depend on. A script running on a switch can only see that switch. The control node has already gathered facts from every host in the play, so a template rendered there can reference any of them: `hostvars` lets you access variables defined for any host in the play, at any point in a playbook. That is how one device's config file comes to contain another device's discovered address, which is exactly the shape of a firewall rule, a routing peer statement, or a load balancer backend list. The cost is a hard ordering constraint, stated plainly in the docs: you must either cache facts or gather facts for those hosts before the task that fills out the template.

Ansible's stated reasons for control-node rendering are practical rather than architectural. It minimizes the package requirements on the target, since Jinja2 is only required on the control node, and it limits the amount of data Ansible passes to the target machine, because Ansible parses templates on the control node and passes only the information needed for each task rather than shipping all the data and parsing it remotely. The cross-host capability falls out of the design as a consequence. On network gear that cannot run a template engine at all, the first reason is the one that matters.

## Facts: what gets discovered, and how to read it

Variables related to remote systems are called facts; variables related to Ansible itself are called magic variables. Ansible facts are data related to your remote systems, including operating systems, IP addresses, attached filesystems, and more, accessible in the `ansible_facts` variable. By default you can also access some facts as top-level variables with the `ansible_` prefix, which can be disabled with `INJECT_FACTS_AS_VARS`.

The two forms confuse people, so the docs are explicit: the `ansible_` prefix shown in the `setup` module output is not used when addressing these variables. The dictionary access is `ansible_facts['nodename']` for the system hostname, or `ansible_facts['devices']['xvda']['model']` for a disk model. Inside the raw output you would see `ansible_nodename`.

Fact gathering runs by default at the beginning of each play, and the `setup` module automatically discovers a standard set of facts about each host. To see everything available for a host, `ansible <hostname> -m ansible.builtin.setup` prints the raw structure. It is worth actually running once, because the shape is deeper than most people assume: `ansible_default_ipv4` is a dictionary carrying `address`, `alias`, `broadcast`, `gateway`, `interface`, `macaddress`, `mtu`, `netmask`, `network`, and `type`. An [[cs/networking/mtu-and-fragmentation|MTU]] and a default gateway are already sitting in your variable namespace before you write a line of template.

Facts are not free and not always complete. On some distributions you may see missing fact values or facts set to default values because the packages that support gathering those facts are not installed by default, and a documented dependency is Linux network fact gathering, which depends on the `ip` binary commonly included in the `iproute2` package. Where facts are unnecessary, `gather_facts: false` at the play level turns gathering off to improve scalability, which the docs note may particularly improve performance in push mode with very large numbers of systems.

One fact is a documented trap. Because `ansible_date_time` is created and cached when Ansible gathers facts before each playbook run, it can get stale with long-running playbooks; for a current timestamp, use the pipe lookup or `now()` in a Jinja2 template instead.

## Caching, and the reason it exists

Like registered variables, facts are stored in memory by default, but unlike registered variables, facts can be gathered independently and cached for repeated use. With cached facts you can refer to facts from one system when configuring a second system, even if Ansible executes the current play on the second system first.

Caching is controlled by cache plugins. The default memory cache plugin stores facts in memory for the duration of the current playbook run, and retaining facts for repeated use means selecting a different plugin. The operational payoff is stated concretely: if you manage thousands of hosts, you can configure fact caching to run nightly and then manage configuration on a smaller set of servers periodically throughout the day, retaining access to variables and information about all hosts even when managing only a few.

That is a fleet-wide inventory of discovered state, refreshed on a schedule, queryable from any play. It is the same idea as an observability pipeline pushing state into a store you later query (see [[cs/software-engineering/observability-logging-metrics-tracing|observability]]), with the difference that here the store feeds back into configuration generation rather than dashboards.

## Magic variables: the view of Ansible itself

Magic variable names are reserved, and the docs say directly not to set variables with these names. The variable `environment` is also reserved. The most commonly used are `hostvars`, `groups`, `group_names`, and `inventory_hostname`.

`hostvars` reaches other hosts, including their facts, but only after you have gathered or cached facts. Variables defined at play objects are not defined for specific hosts and are therefore not mapped to `hostvars`.

`group_names` is a list of all the groups the current host is in, which turns [[cs/languages/Ansible/inventory-and-host-patterns|group membership]] into a template conditional: `{% if 'webserver' in group_names %}` guards a section of a configuration file that only applies to webservers. One template, several device classes, no duplicated files.

`inventory_hostname` is the name of the host as configured in your inventory, usable as an alternative to `ansible_hostname` when fact-gathering is disabled, with `inventory_hostname_short` giving the part up to the first period. Others worth knowing: `ansible_play_hosts` is the list of all hosts still active in the current play, `ansible_play_batch` is the hostnames in scope for the current batch as defined by `serial`, `playbook_dir` is the playbook base directory, `role_path` is the current role's pathname and only works inside a role, and `ansible_check_mode` is a boolean set to True when running with `--check`.

`ansible_play_hosts` deserves a second look next to the failure semantics from [[cs/languages/Ansible/playbooks-plays-and-tasks|playbook execution]]. It holds hosts *still active*, so a template rendered late in a play sees the survivors, not the original target set.

> [!example] Rendering a peer list from the fleet
> The docs' own pattern for pointing a frontend proxy at every host in a group, which is structurally identical to generating firewall rules or routing peers:
>
> ```jinja
> {% for host in groups['app_servers'] %}
> {{ hostvars[host]['ansible_facts']['eth0']['ipv4']['address'] }}
> {% endfor %}
> ```
>
> `groups` supplies membership from inventory, `hostvars` supplies each peer's discovered address, and the loop runs on the control node where both are in hand. The docs attach the precondition directly to this example: you must either cache facts or gather facts for those hosts before the task that fills out the template. Skip that and you get an empty or half-populated list rather than an error, which is the failure mode to actually watch for.

## Custom facts

Beyond the standard set, there are three ways to add values: write a custom facts module, set temporary facts with an `ansible.builtin.set_fact` task, or provide permanent custom facts using the `facts.d` directory.

`facts.d` is the interesting one because it puts the host in charge of describing itself. Create `/etc/ansible/facts.d` on the remote host (or another directory named by the `fact_path` play keyword) and add files ending in `.fact`, which can be JSON, INI, or executable files returning JSON. Static files supply static facts and executable scripts supply dynamic ones, so a script can report something only the device knows, such as the list of users present on it. A static `.fact` file must not be executable, as that breaks the `setup` module.

Results land in the `ansible_local` namespace, which separates custom facts created by `facts.d` from system facts or variables defined elsewhere in the playbook so that variables will not override each other. Namespacing by origin is the same defense the [[cs/languages/Ansible/variables-and-precedence|precedence rules]] provide against accidental collision, applied at the discovery layer instead.

One ordering caveat: fact gathering runs once at the beginning of each play by default, so a custom fact created by a playbook is available in the next play that gathers facts. Using it in the same play requires explicitly re-running the `setup` module. If you find yourself doing that often, the docs say a custom facts module would be more efficient than `facts.d`.

## Related Notes

- [[cs/languages/Ansible/variables-and-precedence|Variables and Precedence]] - where host facts and cached `set_facts` sit in the precedence order
- [[cs/languages/Ansible/inventory-and-host-patterns|Inventory and Host Patterns]] - the groups that `groups` and `group_names` expose to templates
- [[cs/languages/Ansible/playbooks-plays-and-tasks|Playbooks, Plays, and Tasks]] - the play boundary at which facts are gathered and handlers flush
- [[cs/pl/macros-and-metaprogramming|Macros and Metaprogramming]] - templating as program generation, evaluated before the target ever runs
- [[cs/software-engineering/observability-logging-metrics-tracing|Observability: Logging, Metrics, Tracing]] - discovered state collected centrally and reused, the fact cache's closest analogue

## Sources

- "Templating (Jinja2)," Ansible Community Documentation. https://docs.ansible.com/ansible/latest/playbook_guide/playbooks_templating.html . Supports Jinja2 enabling dynamic expressions and access to variables and facts, the `template` module and the deploy-to-multiple-environments use case, standard Jinja2 filters and tests plus Ansible's specialized filters and lookup plugins, and control-node rendering with its two stated motivations (Jinja2 required only on the control node, and passing only the information needed per task).
- "Discovering variables: facts and magic variables," Ansible Community Documentation. https://docs.ansible.com/ansible/latest/playbook_guide/playbooks_vars_facts.html . Supports the facts-versus-magic-variables split, `ansible_facts` and the `ansible_` prefix with `INJECT_FACTS_AS_VARS`, the `ansible.builtin.setup` ad hoc command and the `ansible_default_ipv4` field list, the prefix-not-used addressing note, `iproute2` as a fact-gathering dependency, `gather_facts: false`, the stale `ansible_date_time` caveat, fact caching and cache plugins with the nightly-caching guidance, `hostvars`/`groups`/`group_names`/`inventory_hostname` and the other magic variables, the `groups`-plus-`hostvars` peer-list example and its gather-or-cache precondition, and custom facts via `facts.d` including `.fact` file types, the `ansible_local` namespace, and the same-play re-run caveat.

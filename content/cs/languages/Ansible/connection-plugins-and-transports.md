---
title: "Connection Plugins and Transports"
description: "What the connection layer actually abstracts is not a protocol but three operations, which is why containers work as a transport and why network devices broke the model badly enough to need a different one."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-07-27
updated:
aliases: []
---

Ansible is described as agentless and SSH-based, and both halves of that description are approximations. Connection plugins allow Ansible to connect to the target hosts so it can execute tasks on them, and Ansible ships with many, though only one can be used per host at a time. SSH is the default and the most common, not the mechanism.

> [!note] The idea
> The connection layer does not abstract a network protocol. It abstracts three operations: run this command over there, put this file over there, get that file back. Any medium that can do those three things qualifies as a transport, which is why a local subprocess, a container exec, and a WinRM session are all connection plugins on equal footing with SSH. The abstraction is narrow enough to be portable and load-bearing enough that when a class of device cannot satisfy it, as network gear cannot, Ansible does not extend the transport. It relocates the work to the control node and leaves the transport alone.

## The interface, read off the implementations

The `local` plugin makes the shape obvious by removing the network. It executes commands as subprocesses on the controller and copies files with ordinary filesystem operations, and it is a first-class connection type alongside `paramiko` SSH and native `ssh`. If "connection" meant "network protocol," a connection plugin that does no networking would be a contradiction.

The container plugins confirm it from the other direction. The `community.docker.docker` connection plugin runs commands or puts and fetches files to an existing Docker container, using the Docker CLI to execute commands in the container. There is no socket to a listening daemon inside the container, no SSH server, and no agent. The transport is a local process invocation that happens to cross a namespace boundary, and Ansible neither knows nor cares that [[cs/systems/virtualization-vms-and-containers|the isolation boundary]] is a kernel feature rather than a wire.

Read together, the three operations are the whole contract. The [[cs/languages/Ansible/the-execution-model-and-module-transfer|module transfer sequence]] is written against exactly these primitives, which is why the same execution machinery runs unchanged over SSH, over a container exec, and over nothing at all.

## Selection is a variable, which makes it inventory data

You can set the connection plugin globally with configuration, at the command line with `-c` or `--connection`, as a keyword in your play, or by setting a variable, most often in your inventory. The last option is the interesting one, because it means transport is a property of the host rather than of the task.

That is the right factoring. Whether a machine is reached by SSH, WinRM, or a container exec is a fact about the machine, and putting `ansible_connection` in a group's variables lets one playbook target a mixed fleet with no conditionals in the tasks. The play says what should be true; the inventory says how to get there.

Most connection plugins can operate with minimal configuration, and by default they use the inventory hostname and defaults to find the target host. The escape hatch matters more than it looks: `ansible_host` is the name of the host to connect to, if different from the inventory hostname. So the identifier you address a host by and the address you reach it at are separate, which is what lets inventory names be stable and meaningful while the routable address changes underneath, and what lets a `compose` rule in a dynamic inventory set the connection address from cloud metadata.

Because SSH is the default protocol used in system administration and the protocol most used in Ansible, [[cs/security/secure-shell-ssh|SSH]] options are included in the command line tools directly. The rest of the transports have no such privilege and configure themselves through plugin-specific variables.

## Network devices broke the model

The exception is worth studying because it shows exactly where the abstraction ends. Unlike most Ansible modules, network modules do not run on the managed nodes. Because the majority of network devices cannot run Python, the Ansible network modules are executed on the Ansible control node, where `ansible` or `ansible-playbook` runs.

The transport is fine here. Most switches and routers speak SSH perfectly well. What fails is the second half of Ansible's normal arrangement: you can open a session, but you cannot copy a Python file to the device and execute it, because there is no general-purpose runtime to execute it with. A [[cs/cisco/console-ssh-and-device-access|network device CLI]] is a command interpreter for one vocabulary, not a shell over a filesystem.

Two consequences follow directly. Network modules use the control node as a destination for backup files, because network modules do not update configuration files on the managed nodes: network configuration is not written in files. And because network modules execute on the control node instead of on the managed nodes, they can support multiple communication protocols. The communication protocol, XML over SSH, CLI over SSH, or API over HTTPS, selected for each network module depends on the platform and the purpose of the module.

That second point inverts the usual constraint. On a Linux host the transport is nearly free to vary because the module is a self-contained program that runs anywhere; the module is portable and the connection is interchangeable. On a network device the module is stuck on the controller and the protocol becomes part of the module's design, so `ansible.netcommon.network_cli`, `ansible.netcommon.netconf`, and `ansible.netcommon.httpapi` are different connection types carrying genuinely different semantics rather than different pipes for the same payload. All three are persistent connections, and the docs deprecate the older `local` provider pattern in favor of them, so that hosts and credentials are defined once rather than in every task.

Privilege escalation follows the same pattern of relabeling rather than reimplementing. Several network platforms support privilege escalation where certain tasks must be done by a privileged user, and on network devices this is called enable mode, the equivalent of `sudo` in Unix administration. Ansible exposes it through the same `become` keyword with `become_method: enable`, so the playbook vocabulary stays constant while the mechanism underneath is completely different.

> [!warning] One connection per host, and it is not negotiated
> Only one connection plugin can be used per host at a time, and nothing detects a mismatch in advance. Point a play at a network device with the default SSH connection and the transport succeeds, the login succeeds, and the failure arrives later and looks unrelated, because Ansible tried to run a shell command on something that has no shell. Transport selection is configuration, not discovery, and a wrong value produces a confusing error rather than a clear one.

## Related Notes

- [[cs/security/secure-shell-ssh|The Secure Shell Protocol (SSH)]] is the default transport and the one whose options are wired into the command-line tools.
- [[cs/systems/virtualization-vms-and-containers|Virtualization: VMs and Containers]] explains why a container exec satisfies the same three-operation contract a network connection does.
- [[cs/cisco/console-ssh-and-device-access|Console, SSH, and Device Access]] is the device-side view of why a switch cannot host a transferred module.
- [[cs/languages/Ansible/the-execution-model-and-module-transfer|The Execution Model and Module Transfer]] is the sequence written against the connection interface.
- [[cs/languages/Ansible/dynamic-inventory-and-inventory-plugins|Dynamic Inventory and Inventory Plugins]] is where `ansible_connection` and `ansible_host` are usually set for a mixed fleet.

## Sources

- [Connection plugins](https://docs.ansible.com/ansible/latest/plugins/connection.html) backs the definition, the one-per-host rule, the common plugin list, the four ways to select a connection, and the `ansible_host` and related connection variables.
- [How Network Automation is Different](https://docs.ansible.com/ansible/latest/network/getting_started/network_differences.html) backs control-node execution of network modules, controller-side backups, multiple communication protocols, the persistent connection types, and enable mode via `become`.
- [community.docker.docker connection plugin](https://docs.ansible.com/ansible/latest/collections/community/docker/docker_connection.html) backs the container transport and its use of the Docker CLI.

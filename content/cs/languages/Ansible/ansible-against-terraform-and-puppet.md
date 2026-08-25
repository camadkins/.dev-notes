---
title: "Ansible against Terraform and Puppet"
description: "Push versus pull and ordered-tasks versus dependency-graph, read as two independent axes rather than one argument, with an honest account of what each of the three models gets wrong."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-06-29
updated:
aliases: []
---

The three tools get compared constantly and usually badly, because the comparison collapses several independent choices onto one axis and then declares a winner. Two axes actually matter, they are orthogonal, and each tool sits somewhere different on both.

> [!note] The idea
> The first axis is who initiates: a controller reaching out, or an agent asking for work. The second is how the plan is built: an ordered list the author wrote, or a graph the tool derived from declared dependencies. All three tools describe themselves as declarative about the end state, so the real disagreement is not declarative versus procedural. It is whether the *order of operations* is authored or computed, and that single difference explains almost everything else, including which tool can tell you what it is about to do before it does it.

## The three positions

Ansible is agentless by design principle: low maintenance overhead by avoiding the installation of additional software across IT infrastructure, and decentralization, using SSH with existing OS credentials to access remote machines. The [[cs/languages/Ansible/the-execution-model-and-module-transfer|controller reaches out]] and pushes code, and between runs nothing on the target is thinking about configuration.

Puppet inverts it. Puppet follows a client-server architecture where the client is an agent and the server is a master. Agents communicate with the server and fetch configuration instructions, the agent applies the configuration on the system, and it sends a status report back. Initiative sits on the managed node, so a machine nobody is thinking about still converges.

Terraform is on a different plane. It is an infrastructure as code tool that lets you build, change, and version cloud and on-prem resources, and it creates and manages resources on cloud platforms and other services through their application programming interfaces. It does not connect to machines to configure them, it calls APIs to bring resources into existence. Its workflow is write, plan, apply: Terraform creates an execution plan describing the infrastructure it will create, update, or destroy based on the existing infrastructure and your configuration, then on approval performs the proposed operations in the correct order, respecting any resource dependencies.

## Everyone claims to be declarative

The vocabulary is worn smooth by marketing, and what each project says about itself is clarifying, because all three say the same thing. Ansible: you declare the desired state of a local or remote system in your playbook, and Ansible ensures the system remains in that state, so when the system is already in that state Ansible does not change anything, even if the playbook runs multiple times. Puppet consists of a custom declarative language to describe system configuration and is designed to manage Unix-like and Windows systems declaratively. Terraform: configuration files are declarative, meaning they describe the end state of your infrastructure, and you do not need to write step-by-step instructions.

So "declarative versus procedural" is not the dividing line. Each *resource* in all three is a desired-state assertion honoring the same [[cs/languages/common/declarative-models-and-idempotence|idempotence]] contract. The difference appears one level up, in how resources relate to each other.

A playbook is a sequence. Tasks run top to bottom, and if task nine depends on task four, that dependency exists only because four is written above nine. Terraform builds a resource graph to determine resource dependencies and creates or modifies non-dependent resources in parallel, which means the dependencies are declared as references between resources and the execution order is derived by [[cs/dsa/topological-sorting|topological sort]]. Puppet takes the graph approach too, at the level of resources and their explicit ordering relationships.

That produces the capability gap people notice. Terraform can show a plan because it holds a model of both current and desired state and can diff them before acting. Ansible cannot, because in the general case it does not know what task nine will do until task four has run and returned. A playbook's effects depend on its own earlier results, and no analysis short of executing it settles the question.

## What each one gets wrong

**Ansible's ordered list does not scale as a dependency model.** Order is implicit and unchecked. Moving a task is a semantic change with no declaration of what it might break, and correctness rests on the author's memory, which is why reordering a large role is risky in a way reordering Terraform resources is not.

**Ansible has no model of prior runs.** There is no concept of a resource that used to be managed and no longer is, so deleting a task leaves whatever it created in place until someone writes a task to remove it. Deleting a Terraform resource block plans a destroy.

**Terraform's state file is the price of the plan.** It keeps track of your real infrastructure in a state file which acts as a source of truth for your environment, and uses that file to determine the changes needed so reality matches your configuration. "Source of truth" is doing heavy lifting: the file is a cached model, reality is authoritative, and the two diverge whenever anything changes infrastructure outside Terraform. The state file is a [[cs/systems/consistency-models|stale replica]] that must be locked, shared, backed up, and reconciled, and losing it is a far worse day than losing any Ansible artifact, because Ansible keeps nothing between runs.

**Terraform's immutability is a poor fit for configuration.** It takes an immutable approach to infrastructure, and the docs' own example shows the constraint: update the properties of a VPC and change the number of virtual machines in it, and Terraform recreates the VPC before scaling the machines. Replacing a resource to change it is excellent for cloud primitives and unacceptable for a database server that must keep its data.

**Puppet's pull model costs determinism about time.** Agents fetch and apply on their own schedule, so "the change is deployed" is a distribution over time rather than an event, and an operation with a required order between hosts is awkward to express in a system designed around each node converging independently.

**Puppet's agent is software you now own.** It must be installed, upgraded, secured, and kept running everywhere, including on appliances that may not accept it at all. That burden is what Ansible's agent-less principle reacts to.

> [!warning] The push model needs reachability, and that is a network fact
> Ansible's controller must open a connection to every managed node, which means it must have a route, a permitted path through every firewall in between, and credentials. A Puppet agent behind [[cs/networking/nat-and-port-translation|NAT]] or a restrictive egress-only firewall polls outward and works fine; a push controller cannot reach in. Choosing push over pull is therefore partly a network topology decision, not only a philosophical one, and it is the reason large fleets across many segments tend toward agents regardless of what anyone prefers about the tooling.

## The honest summary

Terraform is strongest where resources are created and destroyed through APIs and the dependency graph is complex. Puppet is strongest where a large fleet must stay converged with nobody driving, and continuous drift correction matters more than knowing when a change lands. Ansible is strongest where the work is a sequence of steps against machines that already exist, a human wants to run it now and watch, and installing anything on the targets is not an option. These are different problems, which is why all three persist and why most production estates run more than one.

## Related Notes

- [[cs/languages/common/declarative-models-and-idempotence|Declarative Models and Idempotence]] is the property all three claim and implement at the resource level.
- [[cs/dsa/topological-sorting|Topological Sorting]] is what a dependency graph buys and what an ordered task list does without.
- [[cs/systems/consistency-models|Consistency Models]] frames the Terraform state file as a replica of reality rather than reality.
- [[cs/networking/nat-and-port-translation|NAT and Port Translation]] explains why reachability, not preference, often decides push versus pull.
- [[cs/languages/Ansible/the-execution-model-and-module-transfer|The Execution Model and Module Transfer]] is the mechanism behind Ansible's side of the push column.

## Sources

- [Introduction to Ansible](https://docs.ansible.com/ansible/latest/getting_started/introduction.html) backs Ansible's stated design principles: agent-less architecture, decentralization over SSH with existing OS credentials, desired state, and idempotence.
- [What is Terraform](https://developer.hashicorp.com/terraform/intro) backs the API-driven model, the write-plan-apply workflow, the state file as source of truth, the declarative end-state framing, the resource graph and parallelism, and the immutable approach.
- [Puppet (software), Wikipedia](https://en.wikipedia.org/wiki/Puppet_%28software%29) backs the client-server architecture, the agent fetch-apply-report cycle, and Puppet's declarative language.

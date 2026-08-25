---
title: Cloud Computing and Virtualization
description: How the hypervisor turned one physical machine into many rentable virtual ones, and made computing something you meter rather than own.
draft: false
comments: true
tags:
  - cs
  - history
date: 2026-05-24
updated:
aliases:
  - cloud computing
  - virtualization
  - hypervisor
---

For most of computing history, to run programs at scale you bought and racked the machines. Cloud computing replaced that with something stranger: rent exactly the computing you need, by the hour, from a pool you never see. The idea that makes it possible is virtualization.

> [!note] The idea
> Virtualization. A hypervisor multiplexes one physical machine into many isolated virtual machines, so computing can be sliced, rented, and scaled on demand instead of bought and owned.

## On demand and metered

Cloud computing provides a scalable, elastic pool of computing resources with self-service provisioning on demand. [[cs/geopolitics/compute-as-a-governable-resource|Providers typically bill on a utility basis]], where the cost reflects the resources allocated and consumed. You pay for what you use, the way you pay for electricity, rather than buying a power plant.

## The hypervisor

![A hypervisor multiplexes one physical machine into several isolated virtual machines.](cs/history/assets/hypervisor-vms.svg)

[[cs/systems/virtualization-vms-and-containers|A hypervisor runs virtual machines as guests]], and pools of hypervisors support large numbers of virtual machines that scale up and down with demand. This is the layer that decouples computation from any one physical box: a virtual machine can be created, moved, and destroyed in seconds, on hardware its user never touches.

## The commercial turn

In 2006 Amazon released S3 for storage and EC2 for compute, [[cs/software-engineering/the-twelve-factor-app|letting developers build applications on rented infrastructure]] with no servers of their own. That moment turned virtualization from a data-center technique into the defining infrastructure of the modern era, the substrate under a large fraction of the [[cs/history/history-of-the-internet|internet]] you use every day.

## Related Notes

- [[cs/systems/distributed-consensus|Distributed Consensus]], keeping many cloud machines agreed
- [[cs/systems/virtual-memory|Virtual Memory]], an older virtualization of one resource
- [[cs/systems/network-protocols|Network Protocols]], how cloud services are reached
- [[cs/history/history-of-the-internet|History of the Internet]], the network cloud runs over
- [[cs/history/index|History of Computing]], the section index

## Sources

- "Cloud computing," Wikipedia. https://en.wikipedia.org/wiki/Cloud_computing . Supports cloud computing as on-demand, self-service, elastic resources billed on a utility basis, the hypervisor running virtual machines as guests with pools that scale, and Amazon's 2006 release of S3 and EC2 as an early commercial cloud.

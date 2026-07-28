---
title: Cisco
description: Practitioner notes on Cisco IOS, switching, routing, and security appliances, written to be more useful than the documentation.
draft: false
comments: false
tags:
  - cs
  - cisco
date: 2026-07-27
updated:
aliases:
  - Cisco
---

Notes on running Cisco gear, written for the person who has to make the box work rather than for the person studying for a test. Each one leads with when you reach for the thing and why, names the gotcha that actually bites, and shows the command alongside what it does to the device.

Every command and behavior here is verified against Cisco's own public documentation or the underlying RFC. Where a fact could not be sourced, it was left out rather than guessed, and the note says so.

The protocol theory underneath all of this lives in [[cs/networking/index|Networking]], and the security concepts in [[cs/security/index|Security]]. This section is the vendor-specific layer on top.

### Foundations and IOS

- [[ios-cli-modes|IOS CLI Modes]] - user EXEC, privileged EXEC, global config, and interface config, and how you move between them
- [[running-vs-startup-config|Running vs Startup Config]] - the two configurations, why changes vanish on reload, and the config register
- [[show-and-debug-methodology|Show and Debug Methodology]] - a disciplined approach to both, and why debug can take a production box down
- [[console-ssh-and-device-access|Console, SSH, and Device Access]] - console against VTY lines, enabling SSH correctly, and refusing Telnet
- [[tacacs-vs-radius|TACACS+ vs RADIUS]] - what each protocol actually protects on the wire, TCP against UDP, and command authorization

### Switching

- [[vlans-and-vlan-design|VLANs and VLAN Design]] - the broadcast domain as the unit of segmentation, access ports, and the management VLAN
- [[trunking-and-802-1q|Trunking and 802.1Q]] - carrying many VLANs on one link, the tag, and the native-VLAN mismatch that bites
- [[spanning-tree-protocol|Spanning Tree Protocol]] - why a switched loop is catastrophic, root election, port states, and RSTP convergence
- [[portfast-and-bpdu-guard|PortFast and BPDU Guard]] - skipping listening and learning on access ports, and the guard that must come with it
- [[etherchannel-and-lacp|EtherChannel and LACP]] - bundling links, LACP against PAgP and static, and how traffic is distributed

---

*The full file listing follows below, generated automatically by Quartz.*

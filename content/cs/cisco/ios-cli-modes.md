---
title: IOS CLI Modes
description: "Why the IOS prompt keeps changing shape: user EXEC, privileged EXEC, global configuration, and interface configuration, what each one is actually allowed to do, and how you move between them."
draft: false
comments: true
tags:
  - cs
  - cisco
date: 2026-03-08
updated:
aliases: []
---

The first thing to read on a Cisco box is not the banner, it is the prompt. `Switch>` and `Switch#` differ by one character and by everything you are permitted to do. A command that "does not exist" on a device almost always exists fine, one mode up. Learning the mode ladder is the difference between fighting the parser and driving the box.

> [!note] The idea
> IOS does not have one command namespace with permission checks bolted on. It has a hierarchy of *modes*, each exposing a different command set, and your position in that hierarchy is encoded in the prompt itself. Cisco built this as a security feature: EXEC sessions are separated into two access levels, where user EXEC gives only basic monitoring commands and privileged EXEC gives access to all router commands. Everything else, global config and its submodes, hangs off the privileged level.

## The two EXEC levels

When you land on a device you are automatically in user EXEC mode. The prompt is the device name followed by an angle bracket, `Router>`. The commands available here are a subset of those available at the privileged level, meant for temporarily changing terminal settings, performing basic tests, and listing system information. You can look around a little. You cannot change the device.

`enable` moves you to privileged EXEC and the prompt becomes the device name followed by the pound sign, `Router#`. Cisco's own framing is worth internalizing: because many of the privileged commands configure operating parameters, [[cs/security/authentication-vs-authorization|privileged access should be password-protected]] to prevent unauthorized use. The privileged command set contains everything user EXEC had, plus the `configure` command through which you reach every remaining mode. `disable` drops you back down.

Two habits pay for themselves immediately. First, `?` at any prompt lists the commands available *in that mode*, which is the fastest way to discover what the current mode can do rather than guessing. Second, if a command is rejected, check the prompt before checking your memory.

## Global configuration and its submodes

`configure terminal` from privileged EXEC opens global configuration mode, and the prompt gains a parenthesized qualifier, `Router(config)#`. Global configuration commands apply to features that affect the device as a whole.

A detail most people never see because they type the full command: `configure` on its own asks where the configuration should come from.

```
Switch# configure
Configuring from terminal, memory, or network [terminal]?
```

You can specify either the terminal or NVRAM as the source of configuration commands. `configure terminal` is just the answer typed up front, and IOS confirms with `Enter configuration commands, one per line. End with CNTL/Z.`

From global config, more specific modes open beneath it, each one advertised by the prompt:

| Prompt | Mode | Entered by |
|---|---|---|
| `Router(config)#` | global configuration | `configure terminal` from privileged EXEC |
| `Router(config-if)#` | interface configuration | `interface` plus an interface identifier |
| `Router(config-line)#` | line configuration | `line` plus a line number, for example `line vty 0 7` |
| `Router(config-router)#` | routing process configuration | a routing process command |
| `Switch(config-vlan)#` | VLAN configuration | `vlan` plus a VLAN ID |

Interface configuration commands modify the operation of one interface, and they always follow a global configuration command that defines the interface type. That ordering is the whole logic of the hierarchy: a command lives in the mode that supplies its missing context. `switchport mode trunk` means nothing without an interface selected, so it lives one level below the command that selects one. See [[cs/networking/vlans-and-802-1q-trunking|VLANs and 802.1Q trunking]] for what those interface-level commands are actually doing to frames.

## Moving back up: exit is not end

The two ways out of a submode are not interchangeable, and confusing them is a real source of "why did my next five commands go somewhere strange."

From interface configuration mode, `exit` returns you to global configuration mode, one level up. `end`, or pressing Ctrl-Z, returns you all the way to privileged EXEC. The same rule holds for line configuration and VLAN configuration mode. From global configuration mode, `end` and `exit` both land at privileged EXEC because there is nowhere in between.

So `exit` is a single step up the ladder and `end` is a jump to the top. When you are three modes deep and paste in a block of commands ending in `exit`, you are still in config mode. When it ends in `end`, you are not.

> [!example] The full climb and back
> ```
> Router> enable
> Router# configure terminal
> Enter configuration commands, one per line.  End with CNTL/Z.
> Router(config)# interface GigabitEthernet0/1
> Router(config-if)# exit
> Router(config)# line vty 0 4
> Router(config-line)# end
> Router#
> ```
> Four prompts, four command namespaces. `exit` stepped back to `(config)`, and `end` from `(config-line)` skipped the intermediate level entirely.

> [!warning] The console password can hand out privileged access
> If no `enable secret` is set and a password is configured for the console tty line, the console password can be used to receive privileged access, even from a remote virtual tty (vty) session. That is almost certainly unwanted, and it is a good reason to always configure an `enable secret`. Cisco is explicit that `enable secret` must be used rather than the older `enable password`, which uses a weak encryption algorithm. On the authorization side, keep the number of users with privilege level 15 to a minimum, since level 15 is the full privileged command set. See [[cs/security/privilege-separation-and-least-privilege|privilege separation]] for the general principle this is an instance of.

## Related Notes

- [[cs/cisco/running-vs-startup-config|Running vs Startup Config]] - what the config mode you just left actually changed, and why it can vanish
- [[cs/cisco/console-ssh-and-device-access|Console, SSH, and Device Access]] - the lines you configure from `(config-line)` mode
- [[cs/cisco/show-and-debug-methodology|show and debug Methodology]] - the privileged EXEC tools for looking at a live box
- [[cs/security/privilege-separation-and-least-privilege|Privilege Separation and Least Privilege]] - the security model behind two EXEC levels
- [[cs/security/authentication-vs-authorization|Authentication vs Authorization]] - proving who you are versus what you may run

## Sources

- "Cisco IOS Command Hierarchy," Cisco E-Learning. https://www.cisco.com/E-Learning/bulk/public/tac/cim/cib/using_cisco_ios_software/02_cisco_ios_hierarchy.htm . Backs EXEC sessions being separated into two access levels as a security feature, user EXEC allowing only basic monitoring commands while privileged EXEC allows all router commands, privileged EXEC being password-protectable, and the prompt table (`Router>`, `Router#`, `Router(config)#`, `Router(config-if)#`, `Router(config-router)#`, `Router(config-line)#`).
- "Using the Command-Line Interface," Cisco IE 3000 Switch Command Reference, Release 12.2(55)SE. https://www.cisco.com/c/en/us/td/docs/switches/lan/cisco_ie3000/software/release/12-2_55_se/command/reference/ie3000_cr/intro.pdf . Backs the main command mode list, landing automatically in user EXEC, user EXEC commands being a subset of privileged, `enable` and `disable`, the pound-sign privileged prompt, `configure` prompting for terminal/memory/network, the `configure terminal` confirmation text, interface configuration commands following a global command that defines the interface type, `line vty` for line configuration mode, `vlan vlan-id` for config-vlan mode, `?` listing commands per mode, and the `exit` versus `end`/Ctrl-Z exit behavior for each mode.
- "Cisco Guide to Harden Cisco IOS Devices," Cisco. https://www.cisco.com/c/en/us/support/docs/ip/access-lists/13608-21.html . Backs `enable secret` being required over the weakly encrypted `enable password`, the console-password-grants-privileged-access hazard including from a remote vty session, and keeping privilege level 15 users to a minimum.

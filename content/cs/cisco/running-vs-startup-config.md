---
title: Running vs Startup Config
description: "Why a working change vanishes on reload, what copy running-config startup-config actually moves and where, the merge-versus-replace trap, and the configuration register bit that makes a router ignore its own saved config."
draft: false
comments: true
tags:
  - cs
  - cisco
date: 2026-02-19
updated:
aliases:
  - copy running-config startup-config
  - startup-config
  - configuration register
  - "0x2142"
---

The single most common way to lose an afternoon on Cisco gear is to fix something, verify it works, walk away, and have the box reload. Nothing you typed survives. This is not a bug and it is not a quirk of one platform. A Cisco device holds two distinct configuration files in two distinct kinds of memory, and every command you enter lands in only one of them.

> [!note] The idea
> The running configuration is the live state of the software and lives in volatile DRAM. The startup configuration is a file in NVRAM that the device reads at boot. `copy running-config startup-config` is a *file copy* between two storage locations, not a "save" in the application sense, and that framing explains every behavior that follows: partial copies merge, full copies to NVRAM do not take effect until reload, and a single hardware register bit can make the device skip the NVRAM file entirely.

## Two files, two memories

Cisco's own statement of the split is precise: "Startup configuration files are used during system startup to configure the software. Running configuration files contain the current configuration of the software. The two configuration files can be different." The storage locations follow: "The running configuration is saved in DRAM; the startup configuration is stored in the NVRAM section of flash memory."

[[cs/systems/memory-hierarchy-and-caching|DRAM loses its contents when the box loses power]]. That is the whole mechanism behind the vanished change.

Cisco frames divergence between the two as a feature rather than an accident, and this is the habit worth building. If you want a change to be temporary, change the running configuration and simply do not save it. A maintenance window with a risky ACL change becomes much less frightening when the rollback plan is "power cycle it." The documentation names this use case directly: "you might want to change the configuration for a short time period rather than permanently. In this case, you would change the running configuration but not save the configuration."

## What the save command actually does

`copy running-config startup-config` is documented as an instance of the general `copy source-url destination-url` privileged EXEC command, where `running-config` and `startup-config` are keyword shortcuts for URLs. The effect: it "saves the currently running configuration file to the NVRAM section of flash memory to be used as the configuration during system initialization."

Two consequences fall out of that being a file copy.

First, it runs from privileged EXEC, not from configuration mode. If you are sitting at `Router(config)#` after a change, you have to leave configuration mode first. See [[ios-cli-modes|IOS CLI modes]] for the ladder.

Second, the direction matters enormously, and the two directions are not symmetric.

## The merge trap

Copying *into* the running configuration does not wipe what is there. Cisco is explicit: loading a configuration file into `system:running-config` works "as if you were entering the commands at the command line. The switch does not erase the existing running configuration before adding the commands." A conflicting command replaces its counterpart, but "some commands in the existing configuration might not be replaced or negated. In this case, the resulting configuration file is a mixture of the existing configuration file and the copied configuration file, with the copied configuration file having precedence."

Read that again if you have ever restored a config from TFTP and ended up with two IP addresses, a stale ACL entry, or a route that should not exist. You did not restore a config. You *merged* one on top of the running state.

The documented way to actually restore is to bypass the running configuration entirely: "To restore a configuration file to an exact copy of a file stored on a server, copy the configuration file directly to the startup configuration (by using the `copy {ftp: | rcp: | tftp:} nvram:startup-config` privileged EXEC command), and reload the switch." The reload is the point. Writing to NVRAM changes nothing about the live device until the device reads NVRAM again.

The modern alternative avoids the reload. `configure replace` "replaces the running configuration with any saved configuration file. When you enter the `configure replace` command, the running configuration is compared with the specified replacement configuration, and a set of configuration differences is generated. The resulting differences are used to replace the configuration." It runs iteratively, "usually completed in no more than three passes," capped at five to prevent looping. The distinction Cisco draws against `copy` is exactly the merge problem:

- `copy source-url running-config` "is a merge operation and preserves all the commands from both the source file and the running configuration. This command does not remove commands from the running configuration that are not present in the source file."
- `configure replace target-url` "removes commands from the running configuration that are not present in the replacement file and adds commands to the running configuration that are not present."
- A partial file is legal as a `copy` source. The replacement file for `configure replace` "must" be complete.

That last bullet is the operational gotcha: feeding a snippet to `configure replace` is not a partial update, it is an instruction to delete everything the snippet does not mention.

`configure replace` also gives you rollback. Save the running configuration to a file before you start changing things, and [[cs/software-engineering/version-control-fundamentals|that file becomes your undo]], with no fixed limit on how many rollbacks you keep.

> [!example] Two ways to undo an afternoon
> ```
> Router# copy running-config flash:pre-change.cfg
> Router# configure terminal
> Router(config)# ...changes...
> Router(config)# end
> Router# configure replace flash:pre-change.cfg
> ```
> Versus the older path, which does not exist as a live operation at all:
> ```
> Router# copy tftp: nvram:startup-config
> Router# reload
> ```
> The first converges the live device toward the file. The second rewrites the file the device will read at boot and leaves the live device untouched until it reboots.

## Clearing NVRAM

To wipe the saved configuration, "use the `erase nvram:` or the `erase startup-config` privileged EXEC command." Cisco pairs it with a caution that is worth taking literally: "You cannot restore the startup configuration file after it has been deleted." A device rebooted with no startup configuration "enters the setup program so that you can reconfigure the switch with all new settings."

Note the asymmetry one more time. Erasing NVRAM does not clear the running configuration. The box keeps running exactly as it was until something makes it reboot.

## The configuration register

The startup configuration is only authoritative because the boot process chooses to read it. That choice is controlled by a 16-bit configuration register, and it is the layer beneath the two-file model.

`show version` prints the current value on its last line. Cisco documents the default: "The factory-default setup for the configuration register is 0x2102. This indicates that the router must attempt to load a Cisco IOS software image from Flash memory, and load the startup configuration."

The bits that matter most:

| Bit | Hex | Significance |
|---|---|---|
| 00-03 | 0x0000-0x000F | boot field: `0x0` stays at the bootstrap (ROMmon) prompt; `0x1` boots the first image in onboard flash; `0x2`-`0xF` specify a default netboot filename and enable `boot system` commands |
| 06 | 0x0040 | ignore NVRAM contents |
| 08 | 0x0100 | break disabled |
| 13 | 0x2000 | boot default ROM software if network boot fails |

Bit 6 is the one people know by its resulting value. `0x2142` behaves like `0x2102` except that it also "Ignores the contents of Non-Volatile RAM (NVRAM) (ignores configuration)," and Cisco notes directly that "configuration register 0x2142 is used for Password Recovery procedures as it can ignore the contents of NVRAM."

That is worth sitting with as a security fact rather than a trivia item. Physical access to the console port plus a reboot equals a device that boots with no configuration and therefore no passwords, after which the intact startup configuration can be copied into the running configuration and edited. Every password on a Cisco device is a control against remote access, not against someone standing at the rack. See [[secure-boot-and-the-chain-of-trust|secure boot and the chain of trust]] for what an actual defense against that class of attack requires, and [[console-ssh-and-device-access|console and device access]] for the console port's privileged position.

The boot field is the other half. Set it to `0x0` and "at the next power cycle or reload, the router boots to the ROMmon (bootstrap program)," where "you must use a terminal or PC that is connected to the router console port" and manually boot an image. Set it to anything from `0x1` to `0xF` and the router "sequentially processes each `boot system` command in global configuration mode that is stored in the configuration file until the system boots successfully," falling back to the first image in flash.

The register is set from global configuration mode with `config-register`:

```
Router# configure terminal
Enter configuration commands, one per line. End with CNTL/Z.
Router(config)# config-register 0x2102
Router(config)# end
Router# show version
```

From ROMmon, the equivalent is `confreg`.

> [!warning] Console speed is a register field, and getting it wrong locks you out
> Bits 5, 11, and 12 encode the console line speed, from 1200 through 115200 baud, with 9600 as all-zeros. Cisco warns that "if the baud rate is set different than the default rate, odd characters are seen on CLI." A garbled console after a register change is not a dead box, it is a terminal-speed mismatch, and it is the failure mode with the worst recovery ergonomics because the console is the tool you would use to fix it. On IOS XE, `config-register` no longer changes console baud rate at all: "In legacy Cisco IOS, the `config-register` command was indeed used to change console baud rate, however, for Cisco IOS XE, you need to configure the line console speed to change the baud rate." The supported path is `line console 0` then `speed`.

## Related Notes

- [[ios-cli-modes|IOS CLI Modes]] - why the save command runs from privileged EXEC and not from config mode
- [[console-ssh-and-device-access|Console, SSH, and Device Access]] - the console port that the configuration register hands total control to
- [[show-and-debug-methodology|show and debug Methodology]] - `show version` and the rest of the read-only toolkit
- [[secure-boot-and-the-chain-of-trust|Secure Boot and the Chain of Trust]] - what it takes to make a boot sequence actually trustworthy
- [[version-control-fundamentals|Version Control Fundamentals]] - the discipline `configure replace` rollback is a crude approximation of

## Sources

- "Working with the Cisco IOS File System, Configuration Files, and Software Images," Catalyst 2960 and 2960-S Switch Software Configuration Guide. https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst2960/software/release/12-2_55_se/configuration/guide/scg_2960/swiosfs.pdf . Backs the running/startup split and their DRAM and NVRAM locations, `copy running-config startup-config` as a `copy source-url destination-url` instance saving to NVRAM for system initialization, the temporary-change use case, the merge behavior when copying into the running configuration, restoring via `copy ... nvram:startup-config` plus reload, `configure replace` semantics including the three/five pass behavior and the merge-versus-replace comparison, the complete-file requirement, configuration rollback, and `erase nvram:` / `erase startup-config` with the setup-program consequence.
- "Understand Configuration Register Usage on all Routers," Cisco, Document ID 50421, updated October 14, 2025. https://www.cisco.com/c/en/us/support/docs/routers/10000-series-routers/50421-config-register-use.html . Backs the 0x2102 factory default and its meaning, the bit-order table (boot field 00-03, bit 6 ignore NVRAM, bit 8 break disabled, bit 13 boot default ROM), 0x2142 ignoring NVRAM contents and its use in password recovery, the boot field behavior for 0x0 versus 0x1-0xF, the `config-register` and ROMmon `confreg` commands, `show version` displaying the register, the console line speed bits 5/11/12, the odd-characters warning, and the IOS XE change requiring `line console` speed configuration.

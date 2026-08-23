---
title: Console, SSH, and Device Access
description: "The three doors into a Cisco device (console, aux, vty), why the console port outranks every password on the box, and the exact prerequisite chain that makes crypto key generate rsa succeed instead of erroring out."
draft: false
comments: true
tags:
  - cs
  - cisco
date: 2026-06-11
updated:
aliases:
  - transport input ssh
  - crypto key generate rsa
  - VTY lines
  - Cisco SSH configuration
---

A Cisco device does not have "a login." It has line types, and each type is a physically and logically different door with its own access controls. Getting device access right means knowing which door someone came through, because the answer changes what they can do and what stopped them.

> [!note] The idea
> Enabling SSH on IOS is not a single command, it is an ordered four-step chain in which the hostname and DNS domain come *before* key generation, and in which generating a key does not disable Telnet, because the VTY transport is a separate per-line setting. Two of the three most common "I turned on SSH" incidents are a device that never got a usable key and a device still accepting cleartext logins on the same lines.

## Three kinds of line

Cisco's hardening guide splits interactive management sessions into ttys and virtual ttys. "A tty is a local asynchronous line to which a terminal can be attached for local access to the device or to a modem for dialup access to a device." Console and auxiliary ports are asynchronous lines of this kind. A vty is everything else: "A vty line is used for all other remote network connections supported by the device, regardless of protocol (SSH, SCP, or Telnet are examples)."

Two operational facts follow immediately.

First, ttys are not purely local. A device with tty lines can act as a console server, "where connections can be established across the network to the console ports of devices connected to the tty lines." Those reverse connections are network-reachable, so the tty lines carrying them need the same controls a vty does.

Second, vty lines are a finite resource, and that makes them a denial-of-service target. "Cisco IOS devices have a limited number of vty lines; the number of lines available can be determined with the `show line` EXEC command. When all vty lines are in use, new management sessions cannot be established, which can create a DoS condition for access to the device." Idle sessions holding lines is the usual cause, which is why `exec-timeout` is a control and not a nicety: "By default, sessions are disconnected after ten minutes of inactivity," and the command exists on both `line con 0` and `line vty 0 4`. Cisco pairs it with `service tcp-keepalives-in`, which "ensures the device on the remote end of the connection is still accessible and half-open or orphaned connections are removed."

## The console port outranks your passwords

This is the part that reframes how you think about physical security on network gear. Cisco states it plainly: "console ports on Cisco IOS devices have special privileges. In particular, these privileges allow an administrator to perform the password recovery procedure. To perform password recovery, an unauthenticated attacker would need access to the console port and the ability to interrupt power to the device or to cause the device to crash."

That is the entire attack. Console cable plus a power cycle. The mechanism is the configuration register, covered in [[running-vs-startup-config|running vs startup config]].

Cisco's conclusion is the right one to internalize: "Any method used to access the console port of a device must be secured in a manner that is equal to the security enforced for privileged access to a device." The console is not a lesser door. It is the highest-privilege door on the box, and locking the rack is a network security control.

There is a hard shutoff, with a matching hard consequence. `no service password-recovery` removes the ability to perform password recovery, and "once the `no service password-recovery` command has been enabled, an administrator cannot perform password recovery on a device." Enable that on a device in a location you do not control and you have converted a physical-access risk into a total-loss risk if credentials are ever lost. It is the right call for deployed field equipment and the wrong call for a lab switch.

The AUX port is the forgotten door. Cisco's guidance is to disable it outright in most situations:

```
line aux 0
 transport input none
 transport output none
 no exec
 exec-timeout 0 1
 no password
```

## Why Telnet is not an option

The hardening guide's language is not hedged: "Use secure protocols whenever possible. A secure protocol choice includes the use of SSH, instead of Telnet, so authentication data and management information are encrypted." For the transport setting specifically, "To prevent information disclosure or unauthorized access to the data transmitted between the administrator and the device, use `transport input ssh` instead of clear-text protocols, such as Telnet and rlogin."

The concrete exposure is worse than "someone reads your password." A Telnet management session carries the full interactive stream: the running configuration you paste, the SNMP community strings and shared secrets inside it, the ACL contents, and every command you run. Cisco makes the same point about the archive: "The configuration of a Cisco IOS device contains many sensitive details. Usernames, passwords, and the contents of access control lists are examples of this sensitive information." A cleartext management session is that archive streamed across the network in real time. See [[cs/security/man-in-the-middle-attacks|man-in-the-middle attacks]] for what an on-path attacker does with it and [[cs/security/secure-shell-ssh|SSH]] for what the replacement actually provides.

Same logic applies to file transfer. Cisco's stated preference is "the use of the Secure Copy Protocol (SCP) in place of FTP or TFTP." Copying a config off a box over TFTP undoes everything the SSH session protected.

## The prerequisite chain

Cisco's SSH configuration document lists four steps to enable SSH support on an IOS router:

1. Configure the `hostname` command.
2. Configure the DNS domain.
3. Generate the SSH key.
4. Enable SSH transport support for the vty.

Cisco numbers those steps, and both the SSH document and the hardening guide put `hostname` and `ip domain-name` ahead of `crypto key generate rsa` in every worked example. Treat the ordering as load-bearing rather than cosmetic. Reaching straight for the key-generation command on a freshly racked device that is still named `Router` with no domain configured is the usual reason an "enable SSH" change does not take, and the time is then spent hunting a licensing or image problem that was never there.

The documented configuration:

```
hostname carter
aaa new-model
username cisco password 0 cisco
ip domain-name rtp.cisco.com
crypto key generate rsa
ip ssh time-out 60
ip ssh authentication-retries 2
line vty 0 4
 transport input ssh
```

Cisco's inline note on `aaa new-model` is worth keeping: it "causes the local username and password on the router to be used in the absence of other AAA statements," and "instead of `aaa new-model`, you can use the `login local` command." The document also states a constraint that surprises people migrating from Telnet: "Authentication through the line password is not possible with SSH." An SSH session needs a username. A box configured with only `password` under `line vty` will refuse SSH logins no matter how correct the crypto is.

For the key itself, the hardening guide's examples specify a modulus explicitly, `crypto key generate rsa modulus 2048`, and note that "For SSH version 2, the modulus size must be at least 768 bits." 768 is a floor, not a recommendation. The examples throughout Cisco's own hardening document use 2048.

Version 2 is not automatic. Cisco says: "When configuring SSH, ensure that SSHv2 is enabled, as it provides stronger encryption and significantly better security than SSHv1," configured with `ip ssh version 2`, and adds separately that "SSH version 1 is no longer recommended."

> [!warning] Generating a key does not close Telnet
> "By default the vty transport is Telnet." A device with a valid RSA key, `ip ssh version 2`, and no `transport input` statement still answers Telnet on those same lines. Cisco calls the fix out as its own procedure: "If you want to prevent Non-SSH connections, add the `transport input ssh` command under the lines to limit the router to SSH connections only. Straight (non-ssh) Telnets are refused." Verify it from a client rather than from the config, because this is exactly the setting that silently reverts when someone restores a partial config and merges it into the running configuration.

## Outbound is a separate setting

`transport input` governs connections *to* the device. Connections *from* it are governed independently: "To limit the type of transport an administrator can use for outgoing connections, use the `transport output` line configuration command. If outgoing connections are not needed, then use `transport output none`. However, if outgoing connections are allowed, then enforce an encrypted and secure remote access method for the connection through the use of `transport output ssh`."

An unrestricted `transport output` turns a compromised jump device into a Telnet client aimed at everything else in the management network. The `transport input none` variant serves the parallel purpose on ttys, where it "disables the use of the tty line for reverse-console connections."

## Restricting who can even reach the lines

Transport encryption answers what a session looks like on the wire. It says nothing about who may open one. That is `access-class`, applied to the line rather than to an interface:

```
Router(config)#access-list 23 permit 10.10.10.0 0.0.0.255
Router(config)#line vty 5 15
Router(config-line)#transport input ssh
Router(config-line)#access-class 23 in
Router(config-line)#exit
```

In Cisco's example, "only SSH access to the 10.10.10.0 255.255.255.0 subnet is permitted, any other is denied access," and the same procedure applies to switch platforms. This is the control that keeps a stolen credential from being usable from an arbitrary corner of the network. Pair it with per-device authentication against a central server, covered in [[tacacs-vs-radius|TACACS+ vs RADIUS]].

Cisco's overall position on authentication is unambiguous: "Authentication can be enforced through the use of AAA, which is the recommended method for authenticated access to a device, with the use of the local user database, or by simple password authentication configured directly on the vty or tty line." Local users are the fallback, not the plan.

> [!example] Verifying rather than assuming
> ```
> carter#show ip ssh
> SSH Enabled - version 2.0
> Authentication timeout: 120 secs; Authentication retries: 3
>
> carter#show ssh
> Connection Version Encryption State Username
> 0 2.0 DES Session started cisco
> ```
> `show ip ssh` reports the version and configuration data for SSH; `show ssh` reports the status of active server connections. `show line` gives the vty inventory. Together they answer "is SSH on, at what version, and who is currently holding a line," which is a different question from "what does the config say."

## Related Notes

- [[ios-cli-modes|IOS CLI Modes]] - the `(config-line)` mode every command here is entered from
- [[running-vs-startup-config|Running vs Startup Config]] - the configuration register mechanism behind console password recovery
- [[tacacs-vs-radius|TACACS+ vs RADIUS]] - centralizing the authentication these lines defer to
- [[cs/security/secure-shell-ssh|Secure Shell (SSH)]] - what the protocol itself guarantees
- [[cs/security/man-in-the-middle-attacks|Man-in-the-Middle Attacks]] - the threat that makes Telnet unacceptable
- [[cs/security/comsec-principles|COMSEC Principles]] - key management discipline applied to the RSA pair you just generated
- [[cs/security/zero-trust-architecture|Zero Trust Architecture]] - the modern framing of "authenticate every session regardless of where it came from"

## Sources

- "Configure SSH on Routers," Cisco, Document ID 4145, updated November 24, 2025. https://www.cisco.com/c/en/us/support/docs/security-vpn/secure-shell-ssh/4145-ssh.html . Backs the four-step enablement sequence (hostname, DNS domain, generate key, enable vty transport), the worked configuration including `aaa new-model`, `ip domain-name`, `crypto key generate rsa`, `ip ssh time-out`, `ip ssh authentication-retries`, and `line vty 0 4 / transport input ssh`; the `login local` alternative; line-password authentication being impossible with SSH; the vty transport defaulting to Telnet; `ip ssh version 2` and the SSHv1 deprecation; the `access-class 23 in` subnet restriction example; and `show ip ssh` and `show ssh` output.
- "Harden IOS Devices," Cisco. https://www.cisco.com/c/en/us/support/docs/ip/access-lists/13608-21.html . Backs the tty/vty distinction and console-server reverse connections, the finite vty count and `show line`, the DoS condition when all vty lines are consumed, `exec-timeout` with the ten-minute default and `service tcp-keepalives-in`, console-port special privileges and the password-recovery attack requiring console access plus a power interruption, securing console access to the same standard as privileged access, `no service password-recovery` and its irreversibility, the AUX-port disable block, SSH over Telnet and SCP over FTP/TFTP, `transport input ssh` versus cleartext protocols, `transport input none` on ttys, `transport output none` / `transport output ssh`, `crypto key generate rsa modulus 2048` with the 768-bit SSHv2 minimum, AAA as the recommended authentication method, and the sensitivity of configuration contents.

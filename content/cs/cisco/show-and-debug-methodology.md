---
title: show and debug Methodology
description: "Why debug is a load-bearing production risk and show is not, how excessive console output can hang a router outright, and the conditional-debug and logging-target discipline that keeps a troubleshooting session from becoming the outage."
draft: false
comments: true
tags:
  - cs
  - cisco
date: 2026-04-02
updated:
aliases:
  - conditional debugging
  - debug condition
  - logging buffered
  - undebug all
---

New engineers treat `show` and `debug` as two points on one spectrum of detail. They are not. `show` reads state that the device already maintains. `debug` asks the device to narrate its own work in real time, on the same CPU that is forwarding traffic, and the narration is not rate limited by anything except how busy the box is. That asymmetry is why a habit that costs nothing in a lab can take down a production router.

> [!note] The idea
> The dangerous coupling on a Cisco device is that console output is prioritized ahead of other router functions. A `debug` that produces more lines than the console can drain does not merely spam your screen, it starves the processes doing actual work, and the documented outcome is a hung box. Every piece of debug discipline (checking CPU first, logging to a buffer instead of the console, scoping with conditions, knowing the stop command before you start) is a consequence of that one fact.

## What debug actually is

Cisco's framing: "The `debug` privileged EXEC commands provide diagnostic information about networking events, protocol status, packet processing, and general network activity." Useful, and the reason people reach for it. The caveat arrives in the same breath: "debug commands can generate a large amount of output information and can affect device performance, especially on routers that are already handling high traffic or high CPU utilization. For this reason, run debug commands carefully and only when needed for troubleshooting."

The escalation is stated more strongly under Warnings: "Enabling debugging can disrupt router operation, especially when the network is under heavy load. If logging is enabled, the access server can intermittently freeze when the console port becomes overloaded with log messages."

Cisco's own illustration of how much the answer depends on scale is the one to carry into planning: "on a router with one Basic Rate Interface, `debug isdn q931` is unlikely to affect the system. However, running the same debug command on an AS5800 with a full E1 configuration can generate enough output to make the device hang or stop responding." Same command, same syntax, two entirely different risk profiles. The variable is not the command, it is the volume of events it will be asked to describe.

The doctrinal line worth quoting to anyone who wants to "just try a debug" on a production circuit: "In general, use these commands only under the direction of your technical support representative when troubleshooting specific problems."

## The pre-flight sequence

Cisco names two checks before the command, and they are cheap.

**Estimate the output.** "Before you run a debug command, consider the amount of output the command can generate and how long the debugging session can run." This is an estimate you make in your head from the topology, not something the device tells you.

**Check headroom.** "Before debugging, check the CPU load by running the `show processes cpu` command. Verify that enough CPU capacity is available before you enable debugging." The example given is a Cisco 7200 with an ATM interface running bridging, where a restart already consumes significant CPU because a BPDU must be generated per virtual circuit, and "enabling debugging during this critical period can cause CPU utilization to increase dramatically, which can result in a device hang or loss of network connectivity."

**Know the exit before the entrance.** "To stop a debug, use the `no debug all` or `undebug all` commands. Verify the debugs have been turned off using the command `show debug`." Cisco also notes the practical symptom that panics people mid-incident: "When debugs are running, you do not usually see the router prompt, especially when the debug is intensive. However, in most cases, you can run the `no debug all` or `undebug all` commands to stop debugs." The prompt is gone, the box is not. Type the stop command blind.

## Where the output goes, and why it matters more than the debug itself

The console is the default and the worst destination. Cisco is direct about the mechanism: "Excessive debugs to the console port of a router can cause it to hang. This is because the router automatically prioritizes console output ahead of other router functions. If the router is processing a large debug output to the console port, it can hang."

And this holds even when you are not watching the console: "By default, logging is enabled on the console port. The console port always processes debug output even if you are using some other port or method (such as aux, vty or buffer) to capture the output." Telnetting in to run a debug does not spare the console. The console is still rendering every line.

That yields a standing recommendation that surprises people: "Cisco recommends under normal operating conditions, you run the `no logging console` command and it is enabled at all times and use other methods to capture debugs. In situations where you must use the console, temporarily turn the logging console back on."

Cisco's hardening guidance says the same thing from the other direction: sending log messages to the console and to monitor sessions "can elevate the CPU load of a Cisco IOS device and thus is not recommended. Instead, send log information to the local log buffer that can be viewed with the `show logging` command," disabled with `no logging console` and `no logging monitor`.

The targets, in the order you should prefer them:

| Target | Command | Notes |
|---|---|---|
| local buffer | `logging buffered` | "copies log messages to an internal buffer instead of writing them to the console. The buffer is circular in nature, so newer messages overwrite older messages." Read with `show logging`, oldest message first. |
| remote syslog | `logging <ip-address>` or `logging host <ip-address>` | Issuing it more than once "builds a list of syslog servers that receives logging messages." |
| vty / aux session | `terminal monitor` | Required to see output over Telnet or SSH; also verify `no logging on` is not configured. |
| console | default | Highest risk. Prefer `no logging console` in steady state. |

Two configuration details from Cisco's hardening guidance make the buffer and the syslog stream actually usable. Severity is a filter on both: "Each log message generated by a Cisco IOS device is assigned one of eight severities that range from level 0, Emergencies, through level 7, Debug. Unless specifically required, you are advised to avoid logs at level 7. Logs at level 7 produce an elevated CPU load on the device, which can lead to device and network instability." `logging trap level` sets the lowest severity sent to remote syslog and `logging buffered level` does the same for the buffer, with size as a second argument: `logging buffered 16384 6` gives a 16,384-byte buffer holding levels 0 through 6.

Source address is the other. "A statically configured logging source interface ensures the same IP address appears in all log messages sent from an individual Cisco IOS device. For added stability, use a loopback interface as the log source," via `logging source-interface Loopback 0`. Without it, the same device appears under different addresses depending on which egress path a message took, which quietly wrecks correlation in [[siem-and-security-logging|centralized logging]].

> [!warning] Syslog is not a secure channel
> Cisco states it flatly: "syslog messages are transmitted unreliably by UDP and in cleartext. Therefore, any protections a network affords to management traffic (for example, encryption or out-of-band access) can be extended to include syslog traffic." Debug-level output shipped to a syslog server is an unauthenticated cleartext stream describing your protocol state in detail, riding [[tcp-vs-udp|UDP]] with no delivery guarantee. Treat it as management-plane traffic and put it on the management path.

Before the first line arrives, set timestamps: `service timestamps debug datetime msec` and `service timestamps log datetime msec` add "timestamps to debugs in the format MMM DD HH:MM:SS." If the system clock has not been set, the output "are preceded by an asterisk (*) to indicate the date and time are probably incorrect," which is a useful tell that your correlation is about to be wrong.

Cisco tempers the millisecond enthusiasm with a real limitation. When the console is emitting heavily, timestamps "cannot correlate with the actual timing of the event," and the guidance is explicit: "do not use msec timestamps to prove performance issues, but to obtain relative information on when events occur." Ordering, yes. Latency measurement, no.

## Conditional debugging

The right answer to "this debug is too loud" is usually not a quieter debug, it is a scoped one. "When the Conditionally Triggered Debugging feature is enabled, the router generates debugging messages for packets entering or leaving the router on a specified interface; the router does not generate debugging output for packets entering or leaving through a different interface."

> [!example] Narrowing a serial debug to one interface
> ```
> traxbol# debug serial interface
> Serial network interface debugging is on
> *Mar 8 09:42:34.851: Serial0: HDLC myseq 28, mineseen 28*, yourseen 41, line up
> *Mar 8 09:42:34.855: Serial3: HDLC myseq 26, mineseen 26*, yourseen 27, line up
>
> traxbol# debug interface serial 3
> Condition 1 set
>
> traxbol# show debug condition
> Condition 1: interface Se3 (1 flags triggered)
> Flags: Se3
>
> *Mar 8 09:43:04.855: Serial3: HDLC myseq 29, mineseen 29*, yourseen 30, line up
> ```
> Both interfaces before the condition, one after. `show debug condition` is how you confirm the scope is actually in effect rather than assuming it.

Removing the condition is where people get burned, and the device warns you itself:

```
traxbol# undebug interface serial 3
This condition is the last interface condition set.
Removing all conditions can cause a flood of debugging
messages to result, unless specific debugging flags
are first removed.
Proceed with removal? [yes/no]:
```

Cisco's recommendation matches: "It is recommended that you turn off the debugs (for example, using `undebug all`) before you remove the conditional trigger. This is to avoid a deluge of debug outputs when the condition is removed." Order of operations: kill the debug first, then the condition. Reverse it and you get the unfiltered firehose you were avoiding.

One trap that a generic mental model will miss: "Some debugging operations are conditional by themselves. An example is atm debugging, with ATM debugging, you must explicitly specify the interface for which debugs must be enabled rather than enabling debugs on all atm interfaces and specifying a condition." Cisco demonstrates that setting a condition on `AT0/0/0.1` and then running a bare `debug atm packet` still prints traffic from `ATM0/0/0.2`. The condition was accepted and had no effect. The correct form puts the interface in the debug command itself: `debug atm packet interface atm 0/0/0.1`. On a box with many ATM subinterfaces, the incorrect form "can hang" the router.

## The `debug ip packet` special case

`debug ip packet` is the command most likely to be suggested by a stranger on a forum and most likely to end your maintenance window. Cisco's description: "On classic Cisco IOS routers, the `debug ip packet` mainly sees process-switched traffic. Traffic forwarded through Fast Switching or CEF do not appear unless forwarding is forced into the process-switching path. However, because it generates an output for every packet, the output can be extensive and causes the router to hang."

So the naive attempt fails in the most expensive possible way: you see nothing (because CEF is handling the traffic in hardware and never hands packets to the processor), you disable fast switching to fix that, and now every packet goes through the CPU *and* generates a line of output.

Cisco's recommended containment is to bind an ACL to the debug: "The best way to limit the output of `debug ip packet` is to create an access-list that is linked to the debug. Only packets that match the access-list criteria can be subject to the `debug ip packet`. This access-list does not need to be applied on any interface, but rather is applied to the debug operation."

Note the modern amendment, which is the actually correct answer on current gear: "On newer platforms, forwarding is typically handled by CEF or hardware based switching, so disabling fast switching is no longer applicable or recommended. As a result, `debug ip packet` can fail to reliably show transit traffic, and modern troubleshooting usually relies on platform-specific capture or hardware tools instead." If your instinct is `debug ip packet`, reach for an embedded packet capture instead.

## The methodology, compressed

Exhaust `show` first. State the device already tracks costs nothing to read, and `show processes cpu`, `show logging`, `show debug`, and `show debug condition` are themselves part of the debug workflow. Form a hypothesis narrow enough that you can name the interface, the peer, or the ACL that scopes it. Move logging off the console. Set the condition, verify it with `show debug condition`, then enable the debug. Have `undebug all` ready. Tear down in reverse order.

None of that is ceremony. Each step maps to a documented failure mode of the step it precedes.

## Related Notes

- [[ios-cli-modes|IOS CLI Modes]] - `debug` is privileged EXEC, `logging` is global config
- [[console-ssh-and-device-access|Console, SSH, and Device Access]] - the console port whose output priority is the hazard here
- [[running-vs-startup-config|Running vs Startup Config]] - `show version` and the rest of the read-only state surface
- [[siem-and-security-logging|SIEM and Security Logging]] - where `logging host` output should land and why source-interface consistency matters
- [[tcp-vs-udp|TCP vs UDP]] - why syslog delivery is best-effort
- [[incident-response-lifecycle|Incident Response Lifecycle]] - the wider discipline this troubleshooting loop sits inside

## Sources

- "Understand Important Information on Debug Commands," Cisco, Document ID 10374, updated June 22, 2026. https://www.cisco.com/c/en/us/support/docs/dial-access/integrated-services-digital-networks-isdn-channel-associated-signaling-cas/10374-debug.html . Backs what `debug` privileged EXEC commands provide and their performance impact, the technical-support-direction warning, the ISDN BRI versus AS5800 scale example, `show processes cpu` as a pre-check and the 7200 bridging illustration, `no debug all` / `undebug all` / `show debug`, the missing-prompt behavior, console output priority and the resulting hang, the console always processing debug output, the `no logging console` recommendation, `logging buffered` circular-buffer behavior and `show logging`, `logging <ip-address>` for syslog servers, `terminal monitor` on aux and vty, `service timestamps` with msec and the asterisk on an unset clock, the msec-timestamp caveat, conditionally triggered debugging with `debug interface`, `show debug condition`, `undebug interface` and its removal warning, the ATM self-conditional debug trap, and the full `debug ip packet` discussion including the ACL binding and the modern CEF amendment.
- "Harden IOS Devices," Cisco. https://www.cisco.com/c/en/us/support/docs/ip/access-lists/13608-21.html . Backs the eight syslog severities from 0 Emergencies to 7 Debug and the advice to avoid level 7, `logging trap level` and `logging buffered level` semantics, the `logging buffered 16384 6` example, sending logs to a central location with `logging host`, syslog being unreliable UDP in cleartext and needing management-traffic protections, the recommendation against logging to console or monitor sessions with `no logging console` / `no logging monitor`, and `logging source-interface Loopback 0` for consistent source addressing.

---
title: Intrusion Detection and Prevention
description: "The two axes that define an IDPS: detection versus prevention, and signature versus anomaly, plus why the false-positive tradeoff is unavoidable."
draft: false
comments: true
tags:
  - cs
  - security
date: 2026-07-09
updated:
aliases:
  - IDS
  - IPS
  - IDPS
  - intrusion detection
  - intrusion prevention
---

A [[firewalls|firewall]] enforces a policy about what *may* connect. It does not ask whether an allowed connection is carrying an attack. That gap, malicious activity riding inside permitted traffic, is what intrusion detection and prevention systems exist to close. They do not gate access; they watch behavior and reason about whether what they see is an attack in progress.

> [!note] The idea
> An IDPS is defined by two independent choices. The first is what it does when it sees something bad: an IDS only detects and alerts, while an IPS additionally tries to stop it. The second is how it decides something is bad: signature-based matching catches known attacks precisely, anomaly-based detection flags deviations from normal and so can catch novel ones. Every real system is a point in that two-by-two, and the false-positive tradeoff is the price of the second axis.

## Axis one: detection or prevention

NIST SP 800-94 draws the line cleanly. "Intrusion detection is the process of monitoring the events occurring in a computer system or network and analyzing them for signs of possible incidents, which are violations or imminent threats of violation of computer security policies." Detection ends at the alert. It observes, judges, and tells a human.

Prevention adds one verb: "Intrusion prevention is the process of performing intrusion detection and attempting to stop detected possible incidents." An IPS sits inline, in the traffic path, so it can drop the malicious packet or reset the connection rather than merely logging it. That inline position is the whole difference and the whole risk. A detector that is wrong generates a noisy alert. A preventer that is wrong drops legitimate traffic and causes an outage. The choice between IDS and IPS is really a choice about how much you trust the system's judgment to act automatically.

## Axis two: signature or anomaly

The second axis is the detection methodology, and SP 800-94 names the two primary ones. Signature-based detection works from a library of known-bad patterns: it is "the process of comparing signatures against observed events to identify possible incidents." A signature might be "a telnet attempt with a username of 'root'." It is precise and produces few false alarms, because it fires only on an exact match to a cataloged attack.

Its weakness is the mirror of its strength. The guide is blunt: "Signature-based detection is very effective at detecting known threats but largely ineffective at detecting previously unknown threats, threats disguised by the use of evasion techniques, and many variants of known threats." The example is telling: a signature for "freepics.exe" simply does not fire on "freepics2.exe." A signature engine can only recognize what someone already wrote a signature for.

Anomaly-based detection inverts the approach. It is "the process of comparing definitions of what activity is considered normal against observed events to identify significant deviations," using "profiles that represent the normal behavior" of users, hosts, and connections. Because it models *normal* rather than *bad*, it can flag an attack no one has ever seen, the thing signatures structurally cannot do. Its weakness is equally structural: anything unusual but benign, a legitimate traffic spike, a new application, looks like a deviation too.

## Why false positives never go to zero

The two failure modes have names. SP 800-94: "When an IDPS incorrectly identifies benign activity as being malicious, a false positive has occurred. When an IDPS fails to identify malicious activity, a false negative has occurred." And the two cannot be minimized together: "It is not possible to eliminate all false positives and negatives; in most cases, reducing the occurrences of one increases the occurrences of the other."

That is the governing tension of the entire field. Tune the system to catch more attacks (fewer false negatives) and it grows twitchier, flagging more benign activity (more false positives). Tune it to stop crying wolf and it lets more real attacks slip by. There is no setting that is strict and permissive at once. This is why most deployments run multiple methodologies together, SP 800-94 notes that "most IDPS technologies use multiple detection methodologies," so that signatures handle the known cheaply and anomaly detection watches for the novel, and human analysts absorb the residual false-positive load.

> [!example] Reading the two-by-two
> A network IPS with signature detection, inline, dropping packets that match cataloged exploits: precise, automatic, blind to zero-days. A host IDS with anomaly detection, alerting only: catches strange new behavior but floods analysts and never acts on its own. Neither is "better"; they occupy different corners of the detect-or-prevent by signature-or-anomaly grid, chosen to fit how much automated action the operator is willing to risk and how much unknown-threat coverage they need.

## Related Notes

- [[firewalls|Firewalls]] - the access-control chokepoint an IDPS complements by inspecting what the firewall admits
- [[malware-classes|Malware Classes]] - the threats an IDPS's signatures and anomaly profiles are trying to catch
- [[stride-threat-modeling|STRIDE Threat Modeling]] - a framework for the threats detection systems are tuned against
- [[side-channel-attacks|Side-Channel Attacks]] - a reminder that some intrusions leave no signature at all

## Sources

- "NIST Special Publication 800-94: Guide to Intrusion Detection and Prevention Systems (IDPS)." https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-94.pdf . Supports the definitions of intrusion detection (monitoring and analyzing events for possible incidents) and intrusion prevention (detection plus attempting to stop incidents); signature-based detection as comparing signatures to observed events with the root-telnet example; its ineffectiveness against unknown threats and variants with the freepics.exe example; anomaly-based detection as comparing normal-behavior profiles against observed events; false positive and false negative definitions and the impossibility of eliminating both; and most IDPS using multiple detection methodologies.

---
title: Penetration Testing Methodology
description: "The single line that separates a penetration test from a vulnerability scan: the scanner reports what might be exploitable, the test exploits it to prove what actually is."
draft: false
comments: true
tags:
  - cs
  - security
date: 2026-04-22
updated:
aliases: []
---

The word "hacking" suggests improvisation, but a professional penetration test is closer to the opposite. It is a phased, authorized, documented process whose value comes precisely from being repeatable, because a repeatable process produces a measurement you can compare across time and systems rather than a one-off war story. NIST's Technical Guide to Information Security Testing ([[cs/standards/what-a-standard-actually-is|SP 800-115]]) and the broader practice both organize that process into an ordered set of phases with one deliberate loop inside it.

> [!note] The idea
> A penetration test is an authorized simulated attack run as a structured pipeline, planning, discovery, attack, and reporting, and the phase that defines it is attack. A vulnerability scanner tells you a flaw may be present; the attack phase attempts to exploit the flaw and thereby confirms whether it is real and what it grants. The methodology exists to turn "here is a list of possible weaknesses" into "here is what an adversary could actually do," which is a fundamentally different and more expensive claim.

## The phases

Wikipedia's definition fixes the scope: a penetration test is "an authorized simulated cyberattack on a computer system, performed live to evaluate the security of the system." NIST structures the work into "the four phases of penetration testing": planning, discovery, attack, and reporting. Planning sets the rules of engagement, secures [[cs/law/the-computer-fraud-and-abuse-act|written authorization]], and defines goals; NIST notes that "no actual testing occurs in this phase," which is what keeps a sanctioned test from becoming [[cs/forensics/incident-response-and-where-forensics-begins|an incident]]. Discovery is information gathering, [[cs/security/port-scanning-and-network-reconnaissance|port and service identification]], and vulnerability analysis, comparing what was found against known-vulnerability databases. Attack executes. Reporting documents findings so they can be remediated and re-tested.

## The attack phase is the whole point

The attack phase is "the process of verifying previously identified potential vulnerabilities by attempting to exploit them." That verb, verifying by exploiting, is the distinction the entire discipline rests on. NIST draws the line explicitly: "while vulnerability scanners check only for the possible existence of a vulnerability, the attack phase of a penetration test exploits the vulnerability to confirm its existence." A scan that flags a service version as potentially vulnerable is a hypothesis. Landing an exploit against it, escalating privilege, and reaching real data is the test. This is why a pentest is not to be confused with a vulnerability assessment: the assessment enumerates possibilities, the test measures exploitability.

## Why attack loops back to discovery

The phases are ordered but not strictly linear, and the exception is instructive. A successful exploit frequently does not hand over full control; instead it "may result in the testers learning more about the targeted network," or it escalates privilege and exposes systems that were invisible from outside. That new vantage point is new discovery, so testing feeds back: "this process is represented in the feedback loop between the attack and discovery phase of a penetration test." A pentester pivots, the newly reachable hosts are re-scanned and re-analyzed, and the attack phase runs again from the deeper position. The loop is how a single foothold is walked into the true blast radius.

> [!warning] A pentest measures exploitability at a moment, not permanent safety
> The finding "we could not exploit this" is scoped to the tester's time, skill, and rules of engagement, not a proof of security. Because the value is a measurement, its meaning decays: a system that passed last quarter can be trivially exploitable after one dependency update. The methodology's phases and reporting exist so the measurement can be repeated and compared, which is the only way the number stays honest.

## Related Notes

- [[cs/security/port-scanning-and-network-reconnaissance|Port Scanning and Network Reconnaissance]], the core technique of the discovery phase
- [[cs/security/vulnerability-scoring-cve-and-cvss|Vulnerability Scoring: CVE and CVSS]], the systems a discovery-phase vulnerability analysis maps findings onto
- [[cs/security/fuzzing|Fuzzing]], an automated way to find the exploitable inputs a manual attack phase then weaponizes
- [[cs/security/owasp-top-10|OWASP Top 10]], the vulnerability catalog a web-application pentest works down

## Sources

- NIST Special Publication 800-115, "Technical Guide to Information Security Testing and Assessment" (2008). https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-115.pdf . Supports the four phases (planning, discovery, attack, reporting), that "no actual testing occurs" in planning, that the attack phase is "the process of verifying previously identified potential vulnerabilities by attempting to exploit them," the scanner-versus-attack distinction, and the attack-to-discovery feedback loop.
- "Penetration test," Wikipedia. https://en.wikipedia.org/wiki/Penetration_test . Supports the definition of a penetration test as "an authorized simulated cyberattack on a computer system, performed live to evaluate the security of the system," and that it should not be confused with a vulnerability assessment.

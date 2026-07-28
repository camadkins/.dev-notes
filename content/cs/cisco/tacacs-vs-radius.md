---
title: TACACS+ vs RADIUS
description: "Two AAA protocols that are not interchangeable: what each one actually protects on the wire, why TACACS+ can authorize a single command and RADIUS cannot, and which belongs on a router's management plane."
draft: false
comments: true
tags:
  - cs
  - cisco
date: 2026-05-14
updated:
aliases:
  - TACACS+
  - RADIUS
  - AAA protocols
  - Device Administration AAA
---

The moment a network grows past the handful of boxes one person can remember the passwords for, local credentials stop scaling and stop being auditable. Centralized AAA is the fix, and the first fork in the road is which protocol carries it. TACACS+ and RADIUS are routinely described as alternatives, which is misleading. They were designed around different questions and they protect different things.

> [!note] The idea
> The real difference is not TCP versus UDP. It is that TACACS+ treats authentication, authorization, and accounting as three separable protocols and obfuscates the entire packet body, while RADIUS fuses authentication with authorization into a single request/reply and hides exactly one attribute, the user's password. That asymmetry is why TACACS+ can adjudicate an individual command typed at a device prompt and RADIUS structurally cannot.

## What each protocol is for

RFC 8907 is unusually candid about scope. TACACS+ "was conceived initially as a general Authentication, Authorization, and Accounting (AAA) protocol" but "is widely deployed today but is mainly confined for a specific subset of AAA called Device Administration, which includes authenticating access to network devices, providing central authorization of operations, and auditing of those operations." Device Administration is the management plane: who gets a shell on the router, and what may they type once they have one.

RADIUS answers a different question. In RFC 2865's own framing, RADIUS servers "are responsible for receiving user connection requests, authenticating the user, and then returning all configuration information necessary for the client to deliver service to the user." The unit of decision is a network access session, not a command. That is why RADIUS dominates on the access layer, where 802.1X port authentication and VPN concentrators need one yes/no plus a bundle of session attributes.

## Transport

TACACS+ uses TCP. RFC 8907 states plainly that "TACACS+ uses TCP for its transport. TCP Server port 49 is allocated by IANA for TACACS+ traffic." The design intent is stated in the introduction: the protocol "uses TCP to ensure reliable delivery."

RADIUS uses UDP, and RFC 2865 devotes a whole section (2.4, "Why UDP?") to defending the choice. The practical trap is the port number. Early deployment used 1645, "which conflicts with the 'datametrics' service," and the officially assigned port is 1812. Two port numbers in circulation for one protocol is worth remembering when a client and server will not talk, because a client addressing one port while the server listens on the other exchanges no packets at all.

## What is actually protected on the wire

This is where the two protocols diverge most sharply, and where practitioner folklore is usually a version behind the standard.

RADIUS protects the password attribute and nothing else. On transmission the User-Password "is hidden," using a construction where "a one-way MD5 hash is calculated over a stream of octets consisting of the shared secret followed by the Request Authenticator" and that value is XORed with the first 16 octet segment of the password, chained forward for longer passwords "to no more than 128 characters." Everything else in the Access-Request (the username, the NAS identity, the port, the returned authorization attributes) travels as it is. RFC 2865 also concedes that "the User-Password hiding mechanism described in Section 5.2 has not been subjected to significant amounts of cryptanalysis."

TACACS+ obfuscates the entire packet body, and RFC 8907 goes out of its way to refuse the word encryption. The body is XORed with a pseudo-random pad built by chaining MD5 hashes over the session ID, secret key, version, and sequence number. Section 4.5 opens by saying that "in 'The Draft', this process was actually referred to as Encryption, but the algorithm would not meet modern standards and so will not be termed as encryption in this document."

> [!warning] Neither protocol is safe on a path you do not control
> RFC 8907 Section 10.1 is blunt: the TACACS+ mechanisms "would be best referred to as 'obfuscation' and not 'encryption', since they provide no meaningful integrity, privacy, or replay protection. An attacker with access to the data stream should be assumed to be able to read and modify all TACACS+ packets." It lists no forward secrecy, plus brute-force, known-plaintext, and chosen-plaintext exposure. The best-practices section escalates it to a requirement: "a network administrator MUST NOT rely on the obfuscation of the TACACS+ protocol. TACACS+ MUST be used within a secure deployment; TACACS+ MUST be deployed over networks that ensure privacy and integrity of the communication and MUST be deployed over a network that is separated from other traffic." Read that as: out-of-band management network, or an IPsec tunnel, not "it's encrypted, we're fine." See [[man-in-the-middle-attacks|man-in-the-middle attacks]] for the general shape of the threat.

The concrete attack RFC 8907 walks through is worth carrying around, because it shows how a missing integrity check turns into privilege escalation. Many shops authorize all commands entered on the local console port, on the theory that physical access to the rack is already the game. An attacker on the TACACS+ path can flip the `authen_method` byte from `TAC_PLUS_AUTHEN_METH_TACACSPLUS` to `TAC_PLUS_AUTHEN_METH_LINE` in the authorization request. Lack of integrity means "any byte in the payload may be changed without either side detecting the change," known plaintext means the attacker "would know with certainty which octet is the target of the attack (in this case, first octet after the header)," and from there they "can determine with certainty the value of the crypto-pad octet used to obfuscate the original octet." The obfuscation does not help, because the attacker never needed to read the packet, only to modify one known byte of it.

## Separation of AAA, and why command authorization follows from it

RFC 8907 calls the split a design commitment: "The separation of authentication, authorization, and accounting is a key element of the design of TACACS+ protocol. Essentially, it makes TACACS+ a suite of three protocols." It then names the payoff directly: "Separating the elements is useful for the Device Administration use case, specifically, for authorization and accounting of individual commands in a session."

A TACACS+ authorization exchange is a single REQUEST/REPLY pair carrying argument-value pairs. The `service` argument is mandatory, and when service is `shell` the `cmd` argument must be present. Two shapes are defined:

- **Session-based** shell authorization sends `cmd` with an empty value (literally the four characters `cmd=`), and "the client determines which commands are allowed in a session according to the arguments present in the authorization." One decision at login. Fast, coarse.
- **Command-based** authorization means "the client requests that the server determine whether a command is allowed by making an authorization request for each command," with the command name as the value of `cmd` and the arguments carried in ordered `cmd-arg` entries. One round trip per command line. This is the mode people mean when they say "TACACS+ gives us per-command control."

The privilege-level scheme most engineers know from Cisco gear is described at the protocol level too: "Privilege levels are ordered values from 0 to 15 with each level being a superset of the next lower value," where level 0 is "normally allocated to an unauthenticated session," and the mapping of commands to levels "is highly dependent upon the deployment." RFC 8907 positions privilege levels as an option for session-based shell authorization, not as the general answer. See [[access-control-models-rbac-abac|RBAC and ABAC]] for why a linear 0 to 15 ladder is a weak model for a real command set, and [[privilege-separation-and-least-privilege|privilege separation]] for the principle it is trying to approximate.

Accounting gets a hard requirement worth quoting to anyone who thinks logging is optional: where TACACS+ supports Device Administration, "TACACS+ client devices MUST be configured to send an accounting start packet for every command entered, irrespective of how the commands were authorized." That is your change-attribution record. Pair it with [[siem-and-security-logging|centralized security logging]] so the record survives the box.

RADIUS has no equivalent. Because authentication and authorization arrive together in one Access-Accept carrying the session's configuration attributes, there is no second exchange in which a device could ask "may this person run this specific command right now."

## Choosing

The split falls out of the above rather than from vendor preference.

Reach for **TACACS+** on the management plane: router and switch VTY and console access, per-command authorization, command accounting for audit, and any environment where different tiers of operator get different command sets on the same device. Reach for **RADIUS** on the access layer: 802.1X on switch ports and wireless, VPN, and anywhere the decision is "admit this session with these attributes" rather than "permit this keystroke."

Running both is normal and not a contradiction. They are answering different questions about different planes.

> [!warning] Scope of this note
> The Cisco IOS commands for wiring either protocol up (the `aaa` configuration family, server-host definitions, method lists, and command-authorization statements) are deliberately omitted here. Cisco's documentation portal refused every fetch during this note's research session, and per the garden's sourcing rule, no CLI syntax gets written from memory. Everything above is sourced to RFC 8907 and RFC 2865. Treat this note as the protocol layer and confirm the platform syntax against the command reference for your specific IOS train.

## Related Notes

- [[authentication-vs-authorization|Authentication vs Authorization]] - the distinction TACACS+ makes structural and RADIUS collapses
- [[ios-cli-modes|IOS CLI Modes]] - the privilege levels and command sets AAA is being asked to police
- [[console-ssh-and-device-access|Console, SSH, and Device Access]] - the lines a Device Administration AAA policy applies to
- [[privilege-separation-and-least-privilege|Privilege Separation and Least Privilege]] - the principle behind per-command authorization
- [[kerberos-authentication|Kerberos Authentication]] - a contrasting centralized authentication design with real cryptographic guarantees
- [[man-in-the-middle-attacks|Man-in-the-Middle Attacks]] - the threat model RFC 8907 says you must assume
- [[tcp-vs-udp|TCP vs UDP]] - the transport tradeoff each protocol made
- [[siem-and-security-logging|SIEM and Security Logging]] - where command accounting records should land

## Sources

- Dahm, Ota, Medway Gash, Carrel, Grant, "The Terminal Access Controller Access-Control System Plus (TACACS+) Protocol," RFC 8907, September 2020. https://www.rfc-editor.org/rfc/rfc8907.txt . Backs the Device Administration scope, TCP port 49, TCP chosen for reliable delivery, the separation of AAA into a suite of three protocols, the obfuscation mechanism and its explicit refusal of the term encryption, the Section 10 security analysis including the `authen_method` modification attack and the MUST-NOT-rely-on-obfuscation best practice, the `service`/`cmd`/`cmd-arg` authorization arguments, session-based versus command-based authorization, privilege levels 0 to 15, and the per-command accounting requirement.
- Rigney, Willens, Rubens, Simpson, "Remote Authentication Dial In User Service (RADIUS)," RFC 2865, June 2000. https://www.rfc-editor.org/rfc/rfc2865.txt . Backs UDP transport, official port 1812 and the legacy 1645 conflict with the datametrics service, the server returning all configuration information needed to deliver service, the User-Password hiding construction using MD5 over the shared secret and Request Authenticator with the 128 character limit, and the Section 8 admission that the hiding mechanism has not been subjected to significant cryptanalysis.

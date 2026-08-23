---
title: "Secure Boot and the Chain of Trust"
description: "How each boot stage verifies the next before running it, turning trust in a hardware anchor into trust in a whole running system."
draft: false
comments: true
tags:
  - cs
  - security
  - cryptography
date: 2026-05-09
updated:
aliases:
  - secure boot
  - chain of trust
  - measured boot
---

Antivirus, sandboxes, and access controls all assume the operating system underneath them is honest. If malware installs itself below the OS, in the firmware or the bootloader, it comes up first, and every defense that loads afterward is running on a compromised foundation without knowing it. The classic bootkit hides exactly there. Secure boot answers a prior question than "is this program safe": is the code that is about to run even the code the machine was supposed to run?

> [!note] The idea
> Trust cannot be created from nothing at power-on, so it is relayed. A small piece of code the hardware trusts by construction verifies the signature of the next stage before executing it, that stage verifies the one after, and so on. Trust is a chain anchored in silicon, not a wall around the system.

## Verify, then hand off

The [UEFI specification](https://en.wikipedia.org/wiki/UEFI) defines a secure boot that "can secure the boot process by preventing the loading of UEFI drivers or OS boot loaders that are not signed with an acceptable digital signature." The mechanism runs on public keys. In setup mode a platform key (PK) is written to firmware; afterward the machine enters user mode, "where only UEFI drivers and OS boot loaders signed with the platform key can be loaded by the firmware." Each stage's job is the same and minimal: check the digital signature of the next stage against a trusted key, and refuse to jump to it if the check fails.

## Why the chain holds

A [chain of trust](https://en.wikipedia.org/wiki/Chain_of_trust) "is established by validating each component of hardware and software from the end entity up to the root," and "the trustworthiness of each layer is guaranteed by the one before, back to the trust anchor." The anchor is the part that is trusted without being verified by anything else, because it has to be: the recursion needs a base case. In hardware that base case is immutable boot code or a key fused into the chip, code no software can rewrite. That is what defeats the bootkit. There is no earlier stage for it to subvert, so it cannot forge a valid signature for the stage that checks it.

The verification is the same public-key signature logic that makes [[cs/military-computing/rsa-and-computational-hardness|RSA]] work and that lets [[cs/systems/tls-and-the-https-handshake|TLS]] chain a website's certificate back to a trusted root. Secure boot is that certificate chain turned inward, anchored in the machine's own hardware instead of a certificate authority.

## Two jobs people conflate: verified vs measured boot

Verifying is not the only thing you can do at each stage, and this is the distinction most explanations skip. Secure boot as described above is *verified boot*: it refuses to run anything unsigned, and the decision is made and enforced locally, right then. *Measured boot* is different. Instead of blocking, each stage hashes the next and records that hash into a [Trusted Platform Module](https://en.wikipedia.org/wiki/Trusted_Platform_Module), "a secure cryptoprocessor," whose Platform Configuration Registers "allow secure storage and reporting of security-relevant metrics." Nothing is stopped. Instead the TPM accumulates "a nearly unforgeable hash key summary of the hardware and software configuration."

The payoff is that measurement defers the trust decision to someone else and somewhere else. Because the registers are tamper-resistant and can be reported, a remote server can ask the machine to attest what it actually booted, compare the hashes to a known-good set, and only then release a secret or grant network access. Verified boot answers "may this run here"; measured boot answers "can a remote party believe what ran here." Real systems use both, and the graded, checkable assurance they aim for is the modern descendant of the evaluation criteria in [[cs/military-computing/tcsec-and-graded-assurance|the Orange Book]].

> [!warning] The anchor is a single point of trust
> The whole chain rests on the root being genuinely immutable and its key genuinely secret. If an attacker can rewrite the boot ROM or extract the anchor key, every downstream signature check becomes theater, since the attacker can now sign its own stages. Secure boot moves the problem, it does not eliminate it: you have traded trusting all the software for trusting one piece of hardware.

## Related Notes

- [[cs/military-computing/rsa-and-computational-hardness|RSA and Computational Hardness]], the signature math each stage checks
- [[cs/systems/tls-and-the-https-handshake|TLS and the HTTPS Handshake]], the same chain-of-trust idea for network identity
- [[cs/military-computing/tcsec-and-graded-assurance|The Orange Book and Graded Assurance]], early formal assurance evaluation
- [[sandboxing-and-isolation|Sandboxing and Isolation]], a defense that assumes the OS beneath it booted honestly

## Sources

- "UEFI," Wikipedia. https://en.wikipedia.org/wiki/UEFI . Supports the claim that UEFI Secure Boot prevents loading of drivers or OS boot loaders not signed with an acceptable digital signature, and the platform-key setup-mode to user-mode flow where only signed loaders run.
- "Chain of trust," Wikipedia. https://en.wikipedia.org/wiki/Chain_of_trust . Supports the definition of a chain of trust as validating each hardware and software component from the end entity up to the root, with each layer's trustworthiness guaranteed by the one before back to the trust anchor.
- "Trusted Platform Module," Wikipedia. https://en.wikipedia.org/wiki/Trusted_Platform_Module . Supports the description of the TPM as a secure cryptoprocessor whose Platform Configuration Registers allow secure storage and reporting of security-relevant metrics and hold a nearly unforgeable hash summary of the configuration, the basis for measured boot and attestation.

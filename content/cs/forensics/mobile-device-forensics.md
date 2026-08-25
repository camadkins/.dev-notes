---
title: Mobile Device Forensics
description: "Full-disk encryption inverted the discipline: the most invasive acquisition method on a modern phone returns the least usable data, and evidence quality now depends on persuading the device to decrypt for you."
draft: false
comments: true
tags:
  - cs
  - forensics
date: 2026-06-17
updated:
aliases: []
---

Disk forensics has a clean hierarchy. A bit-for-bit image of the raw storage is the best evidence, and anything less is a compromise made under time pressure. Mobile forensics started from the same assumption and then watched hardware encryption invert it. On a current phone, the deepest possible acquisition, the one that removes the flash and reads it directly, returns ciphertext bound to a key the examiner does not have.

> [!note] The idea
> On a modern phone the fidelity of an acquisition and the usefulness of its output have come apart. NIST's classification orders methods from least to most invasive, and the invasive end recovers deleted data that the shallow end cannot reach. Full-disk encryption breaks that ordering, because reading raw flash yields encrypted extents while a logical extraction, performed **through the running operating system that holds the keys**, yields plaintext. The examiner's problem is no longer access to bits. It is access to a decrypting oracle.

## The five levels

NIST's mobile guidelines describe a tool classification system as a pyramid, and state its ordering directly: "as the pyramid is traversed from the bottom, Level 1, to the top, Level 5, the methodologies involved in acquisition become more technical, invasive, time consuming, and expensive."

At the base, "Level 1, Manual Extraction methods involve recording information brought up on a mobile device screen when employing the user interface." Someone scrolls the phone and photographs what appears. It requires no tooling and produces no deleted data, and it remains the fallback that works on anything with a screen.

Level 2 is logical extraction, described in the same document as the most frequently used and only mildly technical. It asks the device, through its own interfaces and protocols, to hand over its logical storage objects: directories, files, and the databases behind messaging, contacts, and application state.

Level 3 is hex dumping and JTAG, which "entail performing a physical acquisition of mobile device memory in situ and require advanced training." Level 4 is chip-off, where "methods involve the physical removal of memory from a mobile device to extract data, requiring extensive training in electronic engineering and file system forensics." Level 5, micro read, involves "the use of a high-powered microscope to view the physical state of gates," and NIST describes it as the most invasive, sophisticated, and expensive of all.

The reason to climb the pyramid is stated in the same passage: "hex dumping allows deleted objects and any data remnants present to be examined," which logical acquisition cannot reach. That is exactly the argument made for physical imaging in [[cs/forensics/disk-imaging-formats-and-hashing|disk acquisition]], and on unencrypted storage it holds.

## Where encryption changes the argument

Apple's platform documentation describes what the higher levels now run into. "Data Protection is controlled on a per-file basis by assigning each file to a class; accessibility is determined according to whether the class keys have been unlocked." Every file created on the data volume gets a fresh per-file key handed to a hardware encryption engine, and that key is wrapped by class keys that only become available under specific unlock conditions.

Two consequences fall out. First, the storage is encrypted per file, not as one volume with one key, so partial recovery of raw flash yields a set of independently encrypted extents rather than a partly readable filesystem. Second, the keys are managed in hardware and gated on device state, so possession of the flash is not possession of the data. Chip-off on such a device produces a perfectly faithful copy of ciphertext.

This is the same structure as any well-built key hierarchy: the data is only as reachable as [[cs/security/hardware-security-modules-and-key-management|the key management]] allows, and a copy of the storage without the key hierarchy is not a copy of the information. The practical result is that logical extraction, once considered the weak method, became the primary one, because it runs through the operating system while the class keys are unlocked and therefore gets plaintext. The tool asks the phone politely, and the phone decrypts.

## Filesystem extraction and the middle ground

Between the logical and physical extremes sits what vendors call a filesystem extraction: a copy of the live filesystem obtained through elevated access on the running device, including application sandboxes, databases with unallocated pages, journals, and caches that a normal backup interface omits. It is not a raw image, but it recovers deleted rows from application databases and artifacts the device never intended to export, and it is decrypted because the device produced it.

Getting that access is the entire game, and it depends on a bug or a vendor capability rather than a documented forensic interface. That dependence is what makes mobile evidence unstable in a way disk evidence is not: what an examiner can recover from a given phone model is a function of what is currently exploitable on it.

## The checkm8 class

The exception that keeps this from being purely a software race is a hardware one. NVD describes the vulnerability class precisely: "A vulnerability in the SecureROM of some Apple devices can be exploited by an unauthenticated local attacker to execute arbitrary code upon booting those devices."

The properties matter more than the name. "Exploiting the vulnerability requires physical access to the device," which matches the forensic setting exactly. And "the exploit is not persistent; rebooting the device overrides any changes to the device" software made during the session, which is close to an ideal property for an examiner, since the modification does not survive and the device is returned to its prior state.

The reason a read-only boot ROM bug is categorically different from a software bug is that it cannot be patched on affected units. It lives at the root of [[cs/security/secure-boot-and-the-chain-of-trust|the chain of trust]], below every signature check that the rest of the boot process performs, so the whole verified chain is bypassed on those models forever. NVD is also explicit about the limit: without the unlock credential, the attacker still does not get the user data, because the key hierarchy remains gated. Code execution is not decryption.

> [!warning] Legal process is part of the method
> A phone is the artifact the Supreme Court singled out when it required a warrant to search one incident to arrest, and the compelled production of a passcode raises separate questions. The acquisition decision on a mobile device is therefore never purely technical. See [[cs/law/riley-carpenter-and-the-fourth-amendment-online|Riley and Carpenter]] for the constitutional frame, and treat "can this be extracted" and "may this be extracted" as two independent questions.

## Method under the constraint

The working consequence is a different order of operations from disk work. Preserve device state before anything else, because a locked phone with unlocked class keys and a rebooted phone are different evidence. Isolate it from the network so a remote wipe or a sync cannot alter it, which is the mobile form of the [[cs/forensics/chain-of-custody|custody]] problem. Choose the shallowest method that answers the question, since the deep methods may return nothing usable. Document which level was used, because the level determines what could have been recovered and therefore what an absence in the output means.

That last point is where mobile work meets the section's constant theme. An examiner who reports "no deleted messages were found" after a logical extraction has said something true about the extraction and nothing at all about the phone.

## Related Notes

- [[cs/forensics/disk-imaging-formats-and-hashing|Disk Imaging Formats and Hashing]] for the physical-image-is-best model that encryption inverted.
- [[cs/forensics/chain-of-custody|Chain of Custody]] for network isolation and state preservation as custody problems.
- [[cs/security/secure-boot-and-the-chain-of-trust|Secure Boot and the Chain of Trust]] for why a boot ROM defect is unpatchable and total.
- [[cs/security/hardware-security-modules-and-key-management|Hardware Security Modules and Key Management]] for the key hierarchy that makes raw flash useless.
- [[cs/law/riley-carpenter-and-the-fourth-amendment-online|Riley, Carpenter, and the Fourth Amendment Online]] for the legal process that governs searching a phone.
- [[cs/forensics/cloud-forensics-and-the-acquisition-problem|Cloud Forensics and the Acquisition Problem]] because much of a phone's content is a cache of something held by a provider.

## Sources

- <https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-101r1.pdf> for the five-level tool classification, its ordering, and what hex dumping recovers that logical extraction cannot.
- <https://support.apple.com/guide/security/data-protection-overview-secf6276da8a/web> for per-file Data Protection classes, per-file keys, and class-key gating.
- <https://nvd.nist.gov/vuln/detail/CVE-2019-8900> for the SecureROM code-execution class, its physical-access requirement, and its non-persistence.

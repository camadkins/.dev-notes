---
title: Password Hashing and Salting
description: Storing passwords safely uses two orthogonal defenses, a salt to kill precomputation and a deliberately slow, memory-hard function to kill parallel guessing, and using a fast hash forfeits the second.
draft: false
comments: true
tags:
  - cs
  - security
  - cryptography
date: 2026-02-27
updated:
aliases:
  - password hashing
  - salting
  - bcrypt
  - Argon2
---

The instinct is to reach for a good [[cryptographic-hash-functions|cryptographic hash]] like SHA-256 and call the password stored. That instinct is exactly wrong, and understanding why turns password storage from a one-liner into a two-part defense where each part blocks a different attack.

> [!note] The idea
> A stored password should be the output of a deliberately slow, memory-hard function such as Argon2, bcrypt, or scrypt, over a unique per-user salt. The salt and the slowness are not redundant. The salt defeats precomputation (rainbow tables), and the slowness defeats real-time guessing. A fast hash has neither property and hands an attacker with a stolen database billions of guesses per second.

## Two attacks, two defenses

Once a database leaks, the attacker works offline against the hashes with no rate limit, and the bcrypt authors identify the only remaining barrier as the computational cost of checking each candidate password. Two things drive that cost.

A salt is "a unique, randomly generated string that is added to each password." Its job is precomputation: "as the salt is unique for every user, an attacker has to crack hashes one at a time using the respective salt rather than calculating a hash once and comparing it against every stored hash." That single change turns one giant precomputed table into a separate brute force per user, and kills rainbow tables outright.

Slowness is the other axis. "Fast hashing algorithms such as SHA-256 are not suitable for password storage because they allow attackers to perform large numbers of guesses quickly." A purpose-built password function is tuned to be expensive per guess, so the attacker's throughput collapses from billions per second to something survivable.

## Cost you can turn up over time

The clever part of the design is that the cost is a parameter, not a constant. Bcrypt was built around exactly this: its authors "present two algorithms with adaptable cost" and argue that "failing a major breakthrough in [[cs/dsa/time-complexity-analysis|complexity theory]], these algorithms should allow password-based systems to adapt to [[cs/history/moores-law|hardware improvements]] and remain secure well into the future." Set a work factor today, raise it as hardware gets faster, and the defense keeps pace without changing the algorithm.

## Memory-hardness, aimed at the GPU

The modern refinement targets the specific hardware attackers use. GPUs and ASICs parallelize a cheap hash cheaply; they choke on functions that demand a lot of memory. Argon2, the Password Hashing Competition winner, is described in [[cs/standards/what-a-standard-actually-is|RFC 9106]] as "a memory-hard function" that "aims at the highest memory-filling rate and effective use of multiple computing units, while still providing defense against trade-off attacks." Forcing each guess to fill real memory removes the attacker's parallelism advantage, which pure CPU-cost functions do not fully do.

> [!tip] What good storage looks like today
> OWASP's current guidance is concrete: "use Argon2id with a minimum configuration of 19 MiB of memory, an iteration count of 2, and 1 degree of parallelism," or scrypt or bcrypt if Argon2 is unavailable. The named function matters less than the two invariants: a unique salt per password, and a tunable, memory-hard cost.

## Related Notes

- [[cryptographic-hash-functions|Cryptographic Hash Functions]], the fast primitive that is deliberately wrong here
- [[kerberos-authentication|Kerberos Authentication]], authentication that avoids sending a password at all
- [[symmetric-vs-asymmetric-cryptography|Symmetric vs. Asymmetric Cryptography]], why passwords are hashed, not encrypted

## Sources

- "Password Storage Cheat Sheet," OWASP Cheat Sheet Series. https://raw.githubusercontent.com/OWASP/CheatSheetSeries/master/cheatsheets/Password_Storage_Cheat_Sheet.md . Supports the salt definition and its per-user precomputation defense, fast hashes like SHA-256 being unsuitable, and the concrete Argon2id configuration guidance.
- N. Provos and D. Mazieres, "A Future-Adaptable Password Scheme," USENIX Annual Technical Conference, 1999. https://www.usenix.org/legacy/event/usenix99/provos/provos.pdf . Supports offline attack cost being the only protection, two algorithms with adaptable cost, and remaining secure 20 years into the future as hardware improves.
- "Argon2 Memory-Hard Function for Password Hashing and Proof-of-Work Applications," RFC 9106, IETF, September 2021. https://www.rfc-editor.org/rfc/rfc9106.txt . Supports Argon2 being a memory-hard function aimed at high memory-filling rate with defense against trade-off attacks.

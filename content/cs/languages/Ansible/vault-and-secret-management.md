---
title: "Vault and Secret Management"
description: "What Ansible Vault encrypts, the boundary it explicitly refuses to defend, and the key-management problem it does not solve so much as move one level up."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-07-09
updated:
aliases:
  - ansible-vault
---

Ansible Vault encrypts variables and files so you can protect sensitive content such as passwords or keys rather than leaving it visible as plaintext in playbooks or roles. The feature is small, well documented, and unusually honest about its own limits, which makes it a good object of study: reading what it declines to do teaches more than reading what it does.

> [!note] The idea
> Vault solves exactly one problem, encryption at rest for content in a repository, and the documentation says so in capital letters. Encryption with Ansible Vault ONLY protects data at rest. Once the content is decrypted, meaning data in use, play and plugin authors are responsible for avoiding any secret disclosure. The interesting part is what that leaves you holding. To use Vault you need one or more passwords, and protecting those passwords is not a Vault problem, which is the same recursion every symmetric secret store hits: the thing that guards the secrets is itself a secret that has to live somewhere.

## Two granularities with different properties

You can encrypt two types of content with Ansible Vault: variables and files. They are not two syntaxes for one feature; they behave differently in ways that determine which you should use.

An encrypted variable is a single value inside an otherwise plaintext YAML file, produced by `ansible-vault encrypt_string` and carrying a `!vault` tag. The file stays readable, so a reviewer can see which variables exist and which of them are secret. Decryption happens on demand, only when the value is needed.

An encrypted file has its entire contents encrypted, and is decrypted whenever loaded or referenced. The docs give the reason plainly: Ansible cannot know if it needs content from an encrypted file unless it decrypts the file, so it decrypts all encrypted files referenced in your playbooks and roles. Referencing a vaulted file at all is enough to decrypt it, whether or not the run uses anything in it.

The tradeoff is stated directly. With variable-level encryption files are still easily legible and you can mix plaintext and encrypted variables, but password rotation is not as simple as with file-level encryption, and you cannot rekey encrypted variables. File-level encryption supports `ansible-vault rekey`; variable-level does not, so rotating means decrypting and re-encrypting each value by hand. Variable-level encryption also only works on variables, so encrypting tasks or other content requires encrypting the whole file.

Whichever you choose, the result is still an ordinary [[cs/languages/Ansible/variables-and-precedence|variable]] once decrypted. Vault adds no scope, no taint tracking, and no restriction on where the value may flow. Nothing prevents a vaulted password from being passed into a `debug` task or interpolated into a command line, which is precisely the data-in-use gap the warning is about, and why `no_log` is a separate mechanism you have to remember.

## The key management problem, restated

The password can be supplied by prompt, by file, or by a script. The file that you reference can be either a file containing the password in plain text, or a script with executable permissions set that returns the password.

Read that carefully, because it is the whole design in one sentence. The default non-interactive answer is a plaintext file on disk. Vault has moved the secret rather than eliminated it: instead of a password in the repository you now have a password in a file next to the repository, protected by filesystem permissions and nothing else. This is not a criticism of Vault so much as the [[cs/security/hardware-security-modules-and-key-management|key management]] problem showing through. Some component must hold a key in the clear, and the only real questions are which component, how well isolated it is, and how quickly the key can be revoked.

The script option is the escape hatch, and the docs point at it: if you store your vault passwords in a third-party tool such as a secret manager, you need a script to access them. That inverts the arrangement usefully. The long-lived secret lives in a purpose-built system with authentication, audit logging, and revocation, and the vault password client script fetches it on demand using a machine identity the CI system already has.

Vault IDs allow several passwords in one run, labelled `dev`, `prod`, and so on, which is how one repository holds secrets that different groups may decrypt. The labelling is weaker than it looks. By default, the vault ID labels are only hints, and Ansible attempts to decrypt vault content with each password, trying the matching label first and then the others in the order provided. Labels are an optimization for finding the right key, not an access control boundary, and anyone holding all the passwords can decrypt everything regardless of how it is labelled.

The scheme is symmetric throughout, which is the structural limit. One shared password per vault ID means everyone who can decrypt can also encrypt, there is no per-recipient key, and removing a person's access means rotating the password and re-encrypting rather than revoking a key. Systems built on [[cs/security/symmetric-vs-asymmetric-cryptography|asymmetric]] encryption to a set of recipient keys get revocation for free by dropping a public key and re-encrypting the data key, which is the main functional reason teams reach for a different tool as the number of people grows.

> [!warning] Rotation is forward-looking only
> Vault's stated benefit is that you can place encrypted content under source control and share it more safely. Version control keeps history, so re-keying changes what the current commit holds and leaves every earlier ciphertext exactly where it was. A leaked vault password is therefore a compromise of everything that password ever protected in that repository rather than only the current tree, and the only complete remedy is rotating the underlying secrets themselves. Treat the plaintext behind the ciphertext as the thing that must change.

## Where the ciphertext stops

One documented behavior surprises people and is worth stating exactly. If you pass an encrypted file as the `src` argument to the `copy`, `template`, `unarchive`, `script`, or `assemble` module, the file will not be encrypted on the target host, assuming you supply the correct vault password. That is intended and useful: you encrypt a configuration file in the repository and it lands in usable form on the server.

The consequence is that Vault's protection ends at the controller. The secret is decrypted on the control node, travels over the transport, and is written in the clear on the target, where its confidentiality now depends on file permissions, on who can read the target's disk, and on whatever backup system copies that disk. Vault protects the repository, and the repository is only one of the places a secret ends up.

The small operational warnings follow the same theme of leakage through side channels. Typing secret content directly at the command line without a prompt leaves the secret string in your shell history, which is why `encrypt_string` reads from stdin. The pattern is consistent: the cryptography is not the weak part, and the exposures come from the places the plaintext passes through on its way in and out.

## Related Notes

- [[cs/security/hardware-security-modules-and-key-management|Hardware Security Modules and Key Management]] is the general form of the problem Vault hands back to you.
- [[cs/security/symmetric-vs-asymmetric-cryptography|Symmetric vs Asymmetric Cryptography]] explains why a shared password makes revocation expensive and per-recipient encryption does not.
- [[cs/security/key-derivation-functions|Key Derivation Functions]] covers the step any passphrase-based encryption needs before it has a key at all.
- [[cs/languages/Ansible/variables-and-precedence|Variables and Precedence]] is what a decrypted vault value becomes, with no special handling from that point on.
- [[cs/security/privilege-separation-and-least-privilege|Privilege Separation and Least Privilege]] is the frame for deciding which component gets to hold the vault password in the clear.

## Sources

- [Protecting sensitive data with Ansible Vault](https://docs.ansible.com/ansible/latest/vault_guide/vault.html) backs the purpose, the password requirement, the secret-manager script note, source control, and the data-at-rest-only warning.
- [Encrypting content with Ansible Vault](https://docs.ansible.com/ansible/latest/vault_guide/vault_encrypting_content.html) backs the variable-versus-file comparison, the decrypt-on-reference behavior, the rekey limitation, and the shell history warning.
- [Using encrypted variables and files](https://docs.ansible.com/ansible/latest/vault_guide/vault_using_encrypted_content.html) backs the password sources, vault ID labels as hints, and the modules that write decrypted content to the target.

---
title: Git Objects and Content-Addressable Storage
description: "Git names every object by the hash of its own content. Deduplication, integrity, and the immutability of history are all consequences of that one decision."
draft: false
comments: true
tags:
  - cs
  - software-engineering
date: 2026-08-31
updated:
aliases: []
---

Pro Git opens its internals chapter by declining to describe git as a version control system at all. "Git is a content-addressable filesystem," it says, and "at the core of Git is a simple key-value data store." What you get from that store is unusual: "you can insert any kind of content into a Git repository, for which Git will hand you back a unique key you can use later to retrieve that content." You do not choose the key.

> [!note] The idea
> In an ordinary [[cs/dsa/hash-tables|hash table]] the key and the value are independent, the hash is a way to find a bucket, and collision handling is mandatory because many keys share a bucket. Git removes the key. **The name of an object is the hash of the object**, so there are no buckets, no separate key space, and no collision resolution anywhere in the design. Every property people admire in git (identical files stored once, history that cannot be edited in place, a single hash that vouches for an entire tree) is a consequence of deleting that one degree of freedom, and every risk in the design is the risk that two different objects hash the same way.

## Four object types

Git stores four kinds of object, and only four.

A **blob** is file content with no name and no metadata attached. A **tree** is a directory: "A single tree object contains one or more entries, each of which is the SHA-1 hash of a blob or subtree with its associated mode, type, and filename." A **commit** points at one tree, lists its parents, and records author and message. A **tag** object names a commit with an annotation and optionally a signature.

The split between blob and tree is the load-bearing one. Content lives in the blob; the filename lives in the tree entry that references it. So two files with identical bytes anywhere in the repository, in any commit, on any branch, are one blob. And renaming a file writes no new content at all, only a new tree. Git has no rename operation for this reason; it detects renames at display time by comparing blob hashes across two trees, which is why `git log --follow` is a heuristic with a documented caveat rather than a lookup.

On disk the layout is a two-level fanout: "The subdirectory is named with the first 2 characters of the SHA-1, and the filename is the remaining 38 characters." That is bucketing, but for the [[cs/systems/file-systems|file system's]] benefit rather than the hash's, since a directory holding several million sibling entries is slow in a way that 256 directories holding several thousand each is not. It is the one place the object store looks like a conventional hash table, and it is solving a conventional hash table's problem.

> [!example] Watching a name get computed
> Pro Git demonstrates the store directly with plumbing commands. `echo 'test content' | git hash-object -w --stdin` returns `d670460b4b4aece5915caf5c68d12f560a9fe3e4`, and the file then appears at `.git/objects/d6/70460b4b4aece5915caf5c68d12f560a9fe3e4`. The stored form is "a single file per piece of content, named with the SHA-1 checksum of the content and its header." Run the same command on the same bytes tomorrow, on another machine, in another repository, and you get the same forty characters.

## Why history cannot be edited

An object's name depends on every byte of its content, and a commit's content includes its tree hash and its parent hashes. Change anything in the working tree of an old commit and its tree hash changes, so its commit hash changes, so every descendant's parent list changes, so every descendant's hash changes. There is no way to alter one commit and leave the rest alone.

This is why `commit --amend`, `rebase`, and `filter-branch` all write new commits rather than modifying old ones, and why the advice against rewriting shared history is mechanical rather than cultural: a rewrite does not change the commits your collaborators have, it creates a parallel set with different names, and their repositories now hold both. It is also why the [[cs/software-engineering/the-commit-dag|commit graph]] is acyclic without anyone checking, since a cycle would require a commit's hash to be an input to its own computation.

The structure this produces is a hash tree. A commit hash covers its tree, which covers its subtrees and blobs, which covers every byte of every file. Git's own transition document states the consequence for trust: "Object names can be signed and third parties can trust the hash to address the signed object and all objects it references." One [[cs/security/digital-signatures|signature]] on one tag object therefore vouches for an arbitrary amount of content, the same property [[cs/security/certificate-transparency|Merkle-tree logs]] rely on.

## The integrity argument, and its limits

The first advantage git's own documentation claims for content addressing is not deduplication. It is detection: "Integrity checking is easy. Bit flips, for example, are easily detected, as the hash of corrupted content does not match its name." A repository is self-verifying because every object carries a checksum in the only field that cannot be forgotten to update, its own filename. `git fsck` is just that comparison run over the whole store.

Digital forensics makes the identical argument about evidence, and hits the identical wall. [[cs/forensics/disk-imaging-formats-and-hashing|Disk imaging and hashing]] uses a [[cs/security/cryptographic-hash-functions|cryptographic digest]] over an acquired image so that any later change is detectable, and the honest reading of what that proves is narrow: the payload has not changed between two computations of the digest. It says nothing about whether the image corresponds to a physical drive, whether the acquisition was complete, or whether the bytes under the digest came off the platter. A git commit hash carries exactly the same shape of guarantee. It proves the tree has not been altered since somebody hashed it. It does not prove the code is correct, that the author is who the header says, or that the commit was ever reviewed. The chain of custody in a repository is the signature layer and the access controls around the remote, not the hash.

> [!warning] SHA-1 is doing structural work, and it is weak
> Git's hash-function-transition document records the timeline plainly: "On 23 February 2017 the SHAttered attack" demonstrated "a practical SHA-1 hash collision." Git responded by moving "to a hardened SHA-1 implementation by default," which detects the SHAttered construction, "but SHA-1 is still weak." The document's argument for SHA-256 is that the properties content addressing needs from a hash divide into two groups. Fast lookup and bit-flip detection survive a broken hash. Signing and trusting a hash somebody else handed you do not: if the hash were truly broken, "we could not trust that a given hash value represented the known good version of content that the speaker intended." Repositories initialized with `--object-format=sha256` exist for that reason.

## Related Notes

- [[cs/dsa/hash-tables|Hash Tables]] - the structure git resembles and the collision handling it deliberately omits
- [[cs/security/cryptographic-hash-functions|Cryptographic Hash Functions]] - which resistance property a break destroys, and what that costs git
- [[cs/forensics/disk-imaging-formats-and-hashing|Disk Imaging Formats and Hashing]] - the same integrity claim made about evidence, with the same narrow scope
- [[cs/software-engineering/the-commit-dag|The Commit DAG]] - the graph these objects form, and why it cannot contain a cycle
- [[cs/software-engineering/the-three-trees|The Three Trees]] - where the index sits between the object database and your files
- [[cs/software-engineering/refs-and-branches-as-pointers|Refs and Branches as Pointers]] - the mutable layer laid over this immutable one
- [[cs/systems/file-systems|File Systems]] - the directory-and-inode model git's tree and blob split deliberately echoes
- [[cs/software-engineering/git-command-reference|Git Command Reference]] - which commands write objects and which only move names

## Sources

- "Git Internals - Git Objects," Pro Git. https://git-scm.com/book/en/v2/Git-Internals-Git-Objects . Supports the description of git as a content-addressable filesystem and key-value store, the insert-and-receive-a-key behavior, the `git hash-object -w --stdin` demonstration and its resulting hash and object path, the two-character subdirectory and thirty-eight-character filename layout, the storage of one file per piece of content named by the SHA-1 of the content and its header, and the definition of a tree entry as a hash plus mode, type, and filename.
- "hash-function-transition Documentation," Git. https://git-scm.com/docs/hash-function-transition . Supports the integrity-checking and bit-flip claim, the signing claim that a trusted hash addresses the signed object and everything it references, the 23 February 2017 SHAttered attack demonstrating a practical SHA-1 collision, the move to a hardened SHA-1 implementation by default in Git v2.13.0 and later, the statement that SHA-1 is still weak, and the consequence for trust if SHA-1 were truly broken.

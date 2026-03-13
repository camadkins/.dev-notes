---
title: File Systems
description: Inodes, journaling, and B-tree indexes — how operating systems organize, store, and protect data on persistent media.
draft: false
comments: false
tags:
  - cs
  - systems
date: 2026-03-12
aliases: []
---

## Intuition

A disk is just a flat array of blocks. Without a file system, you would need to remember which blocks hold which data, track free space manually, and hope nothing crashes mid-write. A **file system** imposes structure — names, directories, metadata, allocation maps — so that programs can think in terms of files and paths instead of raw block numbers. The design of that structure determines performance (sequential vs random I/O), reliability (what survives a power failure), and scalability (billions of files, petabytes of data).

## Core Idea

**Inodes (index nodes).** The central metadata structure in Unix-style file systems (ext4, XFS, UFS). Each inode stores:

- File type (regular, directory, symlink, device)
- Permissions and ownership (uid, gid, mode)
- Timestamps (created, modified, accessed)
- Size
- Pointers to data blocks (direct, single-indirect, double-indirect, triple-indirect)

A directory is just a file whose data maps names to inode numbers. Hard links are multiple names pointing to the same inode; the inode's link count tracks how many names reference it.

```
directory entry:   "report.pdf"  →  inode 42
inode 42:          size=1.2MB, blocks=[100, 101, 102, ...], perms=rw-r--r--
block 100:         first 4 KB of file data
```

**Allocation strategies.**

| Strategy | Used by | Strengths | Weaknesses |
|----------|---------|-----------|------------|
| Bitmap + block groups | ext4 | Locality within groups, fast free-space tracking | Fragmentation over time |
| Extents | ext4, XFS | Contiguous runs reduce metadata; good sequential I/O | Large extents waste space for tiny files |
| B-tree allocation | Btrfs, XFS (for metadata) | O(log n) lookup, scales to huge volumes | More complex implementation |
| Log-structured (LSM) | F2FS, LFS | Sequential writes only — ideal for flash/SSD | Garbage collection overhead |

**Journaling.** The classic crash-consistency problem: if the system loses power between updating data blocks and updating metadata, the file system can be left in an inconsistent state. **Journaling** solves this by writing a description of the intended changes to a log (the journal) *before* applying them:

1. **Journal write** — write the transaction (metadata changes, optionally data) to the journal.
2. **Journal commit** — write a commit record marking the transaction complete.
3. **Checkpoint** — apply the changes to their final on-disk locations.
4. **Journal free** — reclaim the journal space.

On crash recovery, the file system replays committed transactions and discards incomplete ones. Modes: **data journaling** (journal both data and metadata — safest, slowest), **ordered mode** (write data before journaling metadata — ext4 default), **writeback** (metadata only — fastest, least safe).

**B-tree and B+-tree indexes.** Modern file systems use B-trees to index metadata. Examples:

- **Btrfs** — copy-on-write B-trees for everything: file extents, directory entries, checksums.
- **XFS** — B+-trees for inode allocation, free-space tracking, and directory entries.
- **NTFS** — the Master File Table uses B+-trees for large directories.
- **HFS+** — a single B-tree (the catalog file) indexes the entire volume.

B-tree properties — balanced, logarithmic lookup, high fanout — align perfectly with disk I/O: each node fits a disk block, so a lookup touches O(log_m n) blocks where m is the branching factor (often 100+).

## Example

Creating a file on ext4:

1. **Allocate inode**: the FS finds a free inode in the inode bitmap, initializes it with metadata (permissions, timestamps, size = 0).
2. **Add directory entry**: the parent directory's data block gets a new entry mapping the filename to the inode number.
3. **Write data**: as the application writes, the FS allocates extents (contiguous block ranges) and records them in the inode's extent tree.
4. **Journal**: before each metadata update, a transaction is written to the journal. If power is lost after step 3 but before step 2, recovery replays the journal and completes the directory update — or rolls it back cleanly.

For a large directory with millions of entries, ext4 switches from a linear list to an **HTree** (a hash-based B-tree variant) for O(1) average lookup by name.

## Related Notes

- [[b-tree|B-Trees]] — the data structure behind most file-system indexes
- [[bplus-tree|B+ Trees]] — the variant used in XFS, NTFS, and databases for range-friendly indexing
- [[virtual-memory|Virtual Memory]] — memory-mapped files (`mmap`) bridge the file system and the VM subsystem
- [[processes-and-threads|Processes & Threads]] — file descriptors are per-process resources managed by the OS

---
title: File Systems
description: Inodes, journaling, and B-tree indexes - how operating systems organize, store, and protect data on persistent media.
draft: false
comments: true
tags:
  - cs
  - systems
date: 2026-03-12
updated:
aliases: []
---

## Overview

A disk is just a flat array of blocks. Without a file system, you'd need to remember which blocks hold which data, track free space by hand, and hope nothing crashes mid-write. The file system is the layer that turns this raw storage into something usable: names, directories, metadata, allocation maps. Programs think in terms of files and paths; the file system translates that into block reads and writes.

What makes file system design interesting is that you're juggling three things at once: **performance** (sequential vs random I/O patterns), **reliability** (what survives a power failure), and **scalability** (billions of files, petabytes of data). Different file systems make different tradeoffs on all three.

---

## Inodes

The central metadata structure in Unix-style file systems (ext4, XFS, UFS). Each inode stores:

- File type (regular, directory, symlink, device)
- Permissions and ownership (uid, gid, mode)
- Timestamps (created, modified, accessed)
- Size
- Pointers to data blocks (direct, single-indirect, double-indirect, triple-indirect)

> [!note]
> A directory is just a file whose data maps names to inode numbers. This is one of those Unix design choices that's simple but powerful: there's nothing special about directories at the storage level. Hard links are multiple names pointing to the same inode; the inode's link count tracks how many names reference it.

```
directory entry:   "report.pdf"  →  inode 42
inode 42:          size=1.2MB, blocks=[100, 101, 102, ...], perms=rw-r--r--
block 100:         first 4 KB of file data
```

> [!tip]
> This is why deleting a file doesn't always free disk space immediately. If another hard link points to the same inode, the data stays. The file is only truly deleted when the link count drops to zero *and* no process has it open.

---

## Allocation Strategies

How the file system decides where to put data on disk has a huge impact on performance:

| Strategy | Used by | Strengths | Weaknesses |
|----------|---------|-----------|------------|
| Bitmap + block groups | ext4 | Locality within groups, fast free-space tracking | Fragmentation over time |
| Extents | ext4, XFS | Contiguous runs reduce metadata; good sequential I/O | Large extents waste space for tiny files |
| B-tree allocation | Btrfs, XFS (for metadata) | O(log n) lookup, scales to huge volumes | More complex implementation |
| Log-structured (LSM) | F2FS, LFS | Sequential writes only, ideal for flash/SSD | Garbage collection overhead |

Extents are worth understanding: instead of tracking every individual block, you record "blocks 100-599" as a single extent. For large files written sequentially, this massively reduces metadata overhead and keeps reads fast because the data is physically contiguous on disk.

---

## Journaling

This solves the classic crash-consistency problem. If the system loses power between updating data blocks and updating metadata, the file system ends up in an inconsistent state. Maybe the directory entry exists but points to garbage, or the blocks are allocated but the directory doesn't know about the file.

**Journaling** writes a description of the intended changes to a log (the journal) *before* applying them:

1. **Journal write** - write the transaction (metadata changes, optionally data) to the journal.
2. **Journal commit** - write a commit record marking the transaction complete.
3. **Checkpoint** - apply the changes to their final on-disk locations.
4. **Journal free** - reclaim the journal space.

On crash recovery, the file system replays committed transactions and discards incomplete ones. Simple and effective.

> [!warning]
> Journaling modes matter for real workloads:
> - **Data journaling** journals both data and metadata. Safest, but writes everything twice.
> - **Ordered mode** (ext4 default) writes data to its final location *before* journaling metadata. Good balance.
> - **Writeback** journals metadata only. Fastest, but a crash can leave files with stale data in their blocks.

---

## B-tree Indexes in File Systems

Modern file systems use [[b-tree|B-Trees]] and [[bplus-tree|B+ Trees]] to index metadata. The properties that make B-trees good for databases (balanced, logarithmic lookup, high fanout) are exactly what you want for disk I/O: each node fits a disk block, so a lookup touches O(log_m n) blocks where m is the branching factor (often 100+).

Examples:
- **Btrfs** uses copy-on-write B-trees for everything: file extents, directory entries, checksums.
- **XFS** uses B+-trees for inode allocation, free-space tracking, and directory entries.
- **NTFS** uses B+-trees in the Master File Table for large directories.
- **HFS+** has a single B-tree (the catalog file) indexing the entire volume.

> [!note]
> Btrfs's copy-on-write approach means it never modifies data in place. Instead, it writes the updated data to a new location and atomically updates the pointer. This gives you snapshots almost for free: just keep the old root pointer around and you have a read-only view of the file system at that point in time.

---

## Creating a File on ext4

Walking through the steps ties everything together:

1. **Allocate inode**: the FS finds a free inode in the inode bitmap, initializes it with metadata (permissions, timestamps, size = 0).
2. **Add directory entry**: the parent directory's data block gets a new entry mapping the filename to the inode number.
3. **Write data**: as the application writes, the FS allocates extents (contiguous block ranges) and records them in the inode's extent tree.
4. **Journal**: before each metadata update, a transaction is written to the journal. If power is lost after step 3 but before step 2, recovery replays the journal and completes the directory update, or rolls it back cleanly.

> [!tip]
> For a large directory with millions of entries, ext4 switches from a linear list to an **HTree** (a hash-based B-tree variant) for O(1) average lookup by name. You don't configure this; it kicks in automatically when the directory grows past a threshold.

## Related Notes

- [[b-tree|B-Trees]] - the data structure behind most file-system indexes
- [[bplus-tree|B+ Trees]] - the variant used in XFS, NTFS, and databases for range-friendly indexing
- [[virtual-memory|Virtual Memory]] - memory-mapped files (`mmap`) bridge the file system and the VM subsystem
- [[processes-and-threads|Processes & Threads]] - file descriptors are per-process resources managed by the OS

## Sources

- "File system," Wikipedia. https://en.wikipedia.org/wiki/File_system . Supports the framing of the file system as the layer that turns raw block storage into names, directories, and metadata, and that filenames are unique within a directory.
- "inode," Wikipedia. https://en.wikipedia.org/wiki/Inode . Supports the inode as the central Unix metadata structure holding file type, ownership and permissions, timestamps, size, and data-block locations, plus the link count tracking how many hard links reference it.
- "Journaling file system," Wikipedia. https://en.wikipedia.org/wiki/Journaling_file_system . Supports the crash-consistency problem from multi-step metadata updates, recording intended changes to a journal before applying them, and recovery by replaying committed transactions.
- "B-tree," Wikipedia. https://en.wikipedia.org/wiki/B-tree . Supports B-trees as balanced, high-fanout, logarithmic-lookup structures whose nodes map onto disk blocks, explaining their use for file-system metadata indexing.

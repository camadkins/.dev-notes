---
title: RAID and Storage Redundancy
description: "Striping, mirroring, and parity as three different bets, what each RAID level actually trades, and the reason redundancy is not a backup."
draft: false
comments: true
tags:
  - cs
  - systems
date: 2026-04-06
updated:
aliases:
  - RAID
  - RAID Levels
---

The premise of RAID is a bit of arbitrage. Cheap disks are individually unreliable, expensive disks are individually reliable, and you can beat the expensive disk with a pile of cheap ones if you spend some of the capacity on redundancy. That is the whole argument, and it was made precisely: at Berkeley in 1987, Patterson, Gibson, and Katz "argued that the disk drives of the top-performing mainframe computers of the time could be outperformed by an array of the (comparatively inexpensive) disk drives that were manufactured for the growing personal computer market." The catch they named up front is the one this note keeps circling back to: "although incidence of hard disk drive failure rises in proportion to the number of drives in use, the reliability of an array could far exceed that of any single, high-capacity drive if one built redundancy into the computer storage system by configuring it to write data to more than one disk automatically."

More drives means more failures. The array wins only if the redundancy grows faster than the failure count.

> [!note] The idea
> Every RAID level spends capacity to buy back the reliability that adding drives destroys, and the levels differ only in the exchange rate. Mirroring pays half the array to survive a drive loss with no computation. Parity pays one drive to do the same, but has to reconstruct on failure, which means reading every remaining drive. That reconstruction cost is where all the modern failure modes live, because it turns a single failure into a whole-array stress test at the exact moment the array is least able to survive one.

## The three primitives

Everything is assembled from techniques "conceived in the 1970s and 1980s: data striping to improve read/write efficiency, and disk mirroring or parity drives for data recovery." RAID "modularizes secondary storage by assigning a role to each storage device in a disk array. The array's RAID level is defined by the roles and relationships of these constituent devices."

Parity is arithmetic, not magic. "Most parity data is calculated using XOR, but RAID 6 uses addition and multiplication in a particular Galois field or Reed-Solomon error correction."

A naming footnote worth having straight: "in its original coinage, *RAID* is an acronym for **redundant array of inexpensive disks**," and "the RAID Advisory Board (est. 1992) later redefined the acronym to mean **redundant array of independent disks**." Before all this, "it was common for high-capacity, high-availability data storage to rely on so-called SLEDs ('single, large, expensive disks') connected to mainframe computers." The level numbers themselves carry no ordering: "the numerical values only serve as identifiers and do not signify performance, reliability, generation, hierarchy, or any other metric." RAID 6 is not "better than" RAID 5 the way 6 is greater than 5.

## The levels

**RAID 0** is striping with no redundancy at all: "block-level striping, but no mirroring or parity." Capacity is everything you paid for, "the total of the *n* drives' capacities," and throughput is the point, since "the throughput of read and write operations to any file is multiplied by the number of drives because, unlike spanned volumes, reads and writes are performed concurrently." The bill: "because striping distributes the contents of each file across all drives, the failure of any drive renders the entire RAID 0 volume inaccessible. Typically, all data is lost, and files cannot be recovered without a backup copy." Worse, the risk compounds with size, since "the average failure rate of the volume rises with the number of attached drives," making RAID 0 "a poor choice for scenarios requiring data reliability or fault tolerance."

The comparison to a spanned volume is a good sanity check on what striping costs you. A spanned volume "stores files sequentially, loses data stored on the failed drive but preserves data stored on the remaining drives." RAID 0 gives up that partial survivability to get parallelism.

**RAID 1** is mirroring: "data is written identically to two or more drives, thereby producing a 'mirrored set' of drives." Reads get better because "any read request can be serviced by any drive in the set," and if broadcast to all, "it can be serviced by the drive that accesses the data first (depending on its seek time and rotational latency)." Writes get worse, and unavoidably so: "write throughput is always slower because every drive must be updated, and the slowest drive limits the write performance." Survival is generous: "the array continues to operate as long as at least one drive is functioning."

Be careful with the read-performance claim, because the source is careful. Sustained read throughput "approaches the sum of throughputs of every drive in the set" only "if the controller or software is optimized for it," and in reality "actual read throughput of most RAID 1 implementations is slower than the fastest drive." The theoretical ceiling and the shipped behavior are different numbers.

**RAID 2 and 3** are effectively history. RAID 2 is "bit-level striping with dedicated Hamming-code parity" with all spindles synchronized, and "this level is of historical significance only; although it was used on some early machines (for example, the Thinking Machines CM-2), as of 2014 it is not used by any commercially available system." RAID 3 is "byte-level striping with dedicated parity," and "although implementations exist, RAID 3 is not commonly used in practice."

**RAID 4** is "block-level striping with dedicated parity." Its advantage over 2 and 3 is granularity: "in RAID 2 and 3, a single read I/O operation requires reading the whole group of data drives, while in RAID 4 one I/O read operation does not have to spread across all data drives. As a result, more I/O operations can be executed in parallel, improving the performance of small transfers." It "was previously used by NetApp, but has now been largely replaced by a proprietary implementation of RAID 4 with two parity disks, called RAID-DP."

**RAID 5** is "block-level striping with distributed parity." Distributing rather than dedicating the parity is the whole improvement over RAID 4. "Upon failure of a single drive, subsequent reads can be calculated from the distributed parity such that no data is lost. RAID 5 requires at least three disks." The sentence to remember, because it is the seed of every problem in the next section: "rebuilding an array requires reading all data from all disks, opening a chance for a second drive failure and the loss of the entire array."

**RAID 6** is "block-level striping with double distributed parity," where "double parity provides fault tolerance up to two failed drives," requiring "a minimum of four disks." This "makes larger RAID groups more practical, especially for high-availability systems, as large-capacity drives take longer to restore." The guidance is scale-dependent: "the larger the drive capacities and the larger the array size, the more important it becomes to choose RAID 6 instead of RAID 5." As with RAID 5, "a single drive failure results in reduced performance of the entire array until the failed drive has been replaced."

**RAID 10 (1+0)** nests: it "creates a striped set from a series of mirrored drives. The array can sustain multiple drive losses so long as no mirror loses all its drives." Its inverse, **RAID 0+1**, "creates two stripes and mirrors them," and is the worse arrangement: after one drive failure "one of the mirrors has failed, at this point it is running effectively as RAID 0 with no redundancy," and "significantly higher risk is introduced during a rebuild than RAID 1+0 as all the data from all the drives in the remaining stripe has to be read rather than just from one drive." When the top array is RAID 0, "most vendors omit the '+' (yielding RAID 10 and RAID 50, respectively)," which is why the two names look almost identical for very different designs.

## What each level costs, side by side

Space efficiency below is "a fractional value between zero and one, representing the fraction of the sum of the drives' capacities that is available for use," in terms of drive count *n*.

| Level | Description | Min drives | Space efficiency | Fault tolerance |
|-------|-------------|-----------|------------------|-----------------|
| RAID 0 | Block-level striping without parity or mirroring | 2 | 1 | None |
| RAID 1 | Mirroring without parity or striping | 2 | 1/n | n − 1 drive failures |
| RAID 2 | Bit-level striping with Hamming code | 3 | 1 − (1/n)log₂(n+1) | One drive failure |
| RAID 3 | Byte-level striping with dedicated parity | 3 | 1 − 1/n | One drive failure |
| RAID 4 | Block-level striping with dedicated parity | 3 | 1 − 1/n | One drive failure |
| RAID 5 | Block-level striping with distributed parity | 3 | 1 − 1/n | One drive failure |
| RAID 6 | Block-level striping with double distributed parity | 4 | 1 − 2/n | Two drive failures |

The worked illustration: "if three drives are arranged in RAID 3, this gives an array space efficiency of 1 − 1/n = 1 − 1/3 = 2/3 ≈ 67%; thus, if each drive in this example has a capacity of 250 GB, then the array has a total capacity of 750 GB but the capacity that is usable for data storage is only 500 GB."

One conceptual shift worth flagging, because it changes what parity is *for*. "Historically disks were subject to lower reliability and RAID levels were also used to detect which disk in the array had failed in addition to that a disk had failed." That is no longer the job. "Modern RAID arrays depend for the most part on a disk's ability to identify itself as faulty which can be detected as part of a scrub. The redundant information is used to reconstruct the missing data, rather than to identify the faulted drive." Parity used to be diagnosis and repair; now it is only repair.

## Why rebuilds are the real enemy

The independence assumption underneath every array-reliability calculation is false, and measurably so. "In practice, the drives are often the same age (with similar wear) and subject to the same environment. Since many drive failures are due to mechanical issues (which are more likely on older drives), this violates the assumptions of independent, identical rate of failure amongst drives; failures are in fact statistically correlated." The consequence lands exactly where it hurts: "the chances for a second failure before the first has been recovered (causing data loss) are higher than the chances for random failures."

There are numbers. "In a study of about 100,000 drives from at least four different vendors, the probability of two drives in the same cluster failing within one hour was four times larger than predicted by the exponential statistical distribution... The probability of two failures in the same 10-hour period was twice as large as predicted by an exponential distribution."

One avoidable variant is procurement discipline. In **batch-correlated disk failure**, "the array is built out of disks from the same batch and ends up with disks failing in quick succession. Such events are rare but not unheard of. The standard recommendation is to mix disks from different batches, possibly different manufacturers." The practice cuts against this: a 2021 study of SSD-based datacenters at Alibaba found that "88.6% of nodes with at least 2 SSDs are using the same model."

And drives are not even the main event. Jiang et al. (2008) "showed that only 20 to 55% of storage system failures were due to disks," with interconnects, CPU, and memory contributing their own "bursty, correlated failure mode."

> [!warning] The unrecoverable read error problem
> Every drive has a rated bit error rate. The unrecoverable bit error rate "is typically guaranteed to be less than one bit in 10^15 for enterprise-class drives (SCSI, FC, SAS or SATA), and less than one bit in 10^14 for desktop-class drives (IDE/ATA/PATA or SATA)." (The article itself flags both figures as disputed, so treat them as nameplate specifications rather than field measurements.)
>
> Those rates were fine when arrays were small. "Increasing drive capacities and large RAID 5 instances have led to the maximum error rates being insufficient to guarantee a successful recovery, due to the high likelihood of such an error occurring on one or more remaining drives during a RAID set rebuild." Parity makes it worse rather than better: "when rebuilding, parity-based schemes such as RAID 5 are particularly prone to the effects of UREs as they affect not only the sector where they occur, but also reconstructed blocks using that sector for parity computation." One bad sector poisons every block whose reconstruction depended on it.
>
> Mirroring dodges much of this. "Schemes that duplicate (mirror) data in a drive-to-drive manner, such as RAID 1 and RAID 10, have a lower risk from UREs than those using parity computation or mirroring between striped sets." RAID 6 addresses it by tolerating two failures, at a price: "such schemes suffer from elevated write penalty, the number of times the storage medium must be accessed during a single write operation."
>
> The background defense is **data scrubbing**, which "involves periodic reading and checking by the RAID controller of all the blocks in an array, including those not otherwise accessed. This detects bad blocks before use." It can "detect and recover from UREs, effectively reducing the risk of them happening during RAID rebuilds and causing double-drive failures," and when it finds one during a healthy array's scrub, "data redundancy provided by a fully operational RAID set allows the missing data to be reconstructed and rewritten to a remapped sector." Find the error while you still have redundancy to fix it with.

The trend line is against you. "Drive capacity has grown at a much faster rate than transfer speed, and error rates have only fallen a little in comparison. Therefore, larger-capacity drives may take hours if not days to rebuild, during which time other drives may fail or yet undetected read errors may surface." Even improving drives do not close the gap: "even though individual drives' mean time between failure (MTBF) have increased over time, this increase has not kept pace with the increased storage capacity of the drives."

Rebuild shape matters as much as rebuild math. "Mirroring schemes such as RAID 10 have a bounded recovery time as they require the copy of a single failed drive, compared with parity schemes such as RAID 6, which require the copy of all blocks of the drives in an array set." Copy one drive, or read all of them.

> [!example] The write hole
> Redundancy has its own atomicity problem, and it is subtle. "A system crash or other interruption of a write operation can result in states where the parity is inconsistent with the data due to non-atomicity of the write process, such that the parity cannot be used for recovery in the case of a disk failure. This is commonly termed the *write hole* which is a known data corruption issue in older and low-end RAIDs, caused by interrupted destaging of writes to disk."
>
> The array looks healthy. The parity is quietly wrong. You discover this at the worst possible time, during a rebuild that depends on it.
>
> The fixes are all forms of not overwriting in place. Write-ahead logging, where "hardware RAID systems use an onboard nonvolatile cache for this purpose" and mdadm "can use a dedicated journaling device." Write-intent logging, where mdadm's write-intent-bitmap means "if it finds any location marked as incompletely written at startup, it resyncs them," though it "closes the write hole but does not protect against loss of in-transit data, unlike a full WAL." Dynamic stripe size, where "RAID-Z ensures that each block is its own stripe, so every block is complete," with copy-on-write semantics guarding stripe metadata, at the cost of "IO fragmentation."
>
> The article's framing is that this is "a poorly understood and rarely mentioned failure mode for redundant storage systems that do not utilize transactional features," and it reaches back to Jim Gray, who "wrote 'Update in Place is a Poison Apple' during the early days of relational database commercialization." The same insight, arrived at twice from different directions.

## RAID is not a backup

The clearest statement is the flattest one: while most RAID levels "can provide good protection against and recovery from hardware defects or defective sectors/read errors (*hard errors*), they do not provide any protection against data loss due to catastrophic failures (fire, water) or *soft errors* such as user error, software malfunction, or malware infection. For valuable data, RAID is only one building block of a larger data loss prevention and recovery scheme, it cannot replace a backup plan."

The mechanism follows from the definition of mirroring rather than from any shortcoming in an implementation. In RAID 1 "data is written identically to two or more drives," so whatever the write says, every drive agrees with it. A deletion is a write. Ransomware encryption is a write. The array replicates all of it faithfully and immediately, which is exactly why "while RAID may protect against physical drive failure, the data is still exposed to operator, software, hardware, and virus destruction."

The operator threat is not hypothetical. "Many studies cite operator fault as a common source of malfunction, such as a server operator replacing the incorrect drive in a faulty RAID, and disabling the system (even temporarily) in the process." The array's redundancy does nothing against the hand that pulls the wrong disk.

Two more failure classes sit outside the array's scope entirely. Physical: "an array can be overwhelmed by catastrophic failure that exceeds its recovery capacity and the entire array is at risk of physical damage by fire, natural disaster, and human forces, however backups can be stored off site." That last clause is doing the work; off-site is a property backups have and RAID does not. Administrative: "an array is also vulnerable to controller failure because it is not always possible to migrate it to a new, different controller without data loss." Your data can become unreadable while every drive in it remains perfectly healthy.

> [!tip]
> RAID buys availability, meaning the array keeps serving reads while a drive is dead. Backups buy recoverability, meaning you can get back a state that no longer exists anywhere in the live system. Those are different properties and neither substitutes for the other. An array of mirrors with no backup and a backup with no redundancy are both incomplete, in opposite directions.

## Related Notes

- [[file-systems|File Systems]] - the layer above, and where copy-on-write designs close the write hole
- [[io-devices-and-drivers|I/O Devices and Drivers]] - the controllers and drivers an array depends on, and can be stranded by
- [[replication-and-quorums|Replication and Quorums]] - the same redundancy argument across machines instead of drives
- [[magnetic-disk-storage|Magnetic Disk Storage]] - the physical device whose failure characteristics drive all of this
- [[memory-hierarchy-and-caching|Memory Hierarchy and Caching]] - write-back caching, which introduces its own durability gap

## Sources

- "RAID," Wikipedia. https://en.wikipedia.org/wiki/RAID . Backs the Patterson/Gibson/Katz 1987 origin and the 1988 SIGMOD argument, the inexpensive-versus-independent acronym history and SLEDs, the striping/mirroring/parity techniques and XOR versus Galois field parity, the descriptions and trade-offs of RAID 0 through 6 including minimum drive counts and rebuild behavior, nested RAID 10 and 0+1 and the vendor naming convention, data scrubbing, the correlated-failure discussion with the ~100,000 drive study figures, batch-correlated failure and the Alibaba 88.6% figure, the Jiang et al. 20 to 55% result, the URE and UBE rate figures and their disputed status, the rebuild-time and MTBF trend arguments, the bounded recovery time of mirroring, the write hole and its remedies including WAL, write-intent bitmaps and RAID-Z, the Jim Gray reference, and the operator-fault, catastrophic-failure, and controller-failure limitations.
- "Standard RAID levels," Wikipedia. https://en.wikipedia.org/wiki/Standard_RAID_levels . Backs the statement that RAID protects against hard errors but not catastrophic failures or soft errors and cannot replace a backup plan, the note that RAID level numbers are identifiers signifying no metric, the space-efficiency definition and the RAID 3 worked example with 250 GB drives, the comparison table of description, minimum drives, space efficiency, and fault tolerance for RAID 0 through 6, and the historical shift from using redundancy to identify a failed drive to using it only to reconstruct missing data.

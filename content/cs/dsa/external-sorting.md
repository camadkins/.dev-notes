---
title: External Sorting - Scaling Sorts Beyond Main Memory  
description: Techniques for sorting data that does not fit in RAM by staging work between disk and memory using runs, multiway merging, and I/O-aware algorithms.  
draft: false  
comments: true
tags:
  - cs
  - dsa
date: 2025-10-16  
updated: 2025-10-29  
aliases: 
- external-sorting
- external_sorting
- external-sort
---

## Definition

**External sorting** is the family of sorting techniques designed for datasets that **do not fit entirely in main memory**.  
Instead of sorting everything in RAM, we:

1. Load manageable **chunks** of data into memory.
    
2. Sort each chunk and write it back to **disk as a run**.
    
3. **Merge** those runs using I/O-efficient strategies until only one sorted run remains.
    

This is the standard approach in databases, storage engines, and big data systems whenever inputs are “too big to fit.”

---

## Why it matters

In many real systems, the **bottleneck is I/O**, not CPU:

- Reading/writing from **[[cs/history/magnetic-disk-storage|disk or SSD]]** is orders of magnitude slower than RAM.
    
- Large logs, transaction histories, and fact tables can be **gigabytes to terabytes**.
    
- Sorting is a core building block for:
    
    - ORDER BY / GROUP BY in [[cs/history/relational-model-and-sql|SQL]]
        
    - Merge-joins
        
    - Building B-Tree / B+ Tree indexes
        
    - Deduplication and external aggregation
        

External sorting algorithms minimize **I/O passes** and exploit **sequential reads/writes**, which are far faster than random I/O.

---

## Model & Assumptions

Most analyses use an **external memory model**:

- `N` = number of records to sort
    
- `M` = number of records that fit in main memory (buffer pool)
    
- `B` = block size in records (one disk page / I/O)
    
- Data lives on disk; we can only process records after they are **read into memory** in blocks of size `B`.
    

Typical assumptions:

- Access cost is dominated by **block I/O**, not RAM operations.
    
- Reads and writes are **sequential** whenever possible.
    
- We can tune:
    
    - Number of in-memory buffers
        
    - Number of runs merged at once (fan-in)
        
    - Use of priority queues (heaps) during merge
        

---

## Strategy

### Two-phase multiway mergesort (TPMMS)

The standard external sorting pattern is a **two-phase multiway mergesort**:

1. **Run generation (sort phase)**
    
    - Read up to `M` records into memory.
        
    - Sort them using any internal algorithm (e.g., quicksort, mergesort, heapsort).
        
    - Write the sorted block back to disk as a **run**.
        
    - Repeat until all input records are consumed.
        
    - Result: about `⌈N / M⌉` sorted runs.
        
2. **Multiway merge (merge phase)**
    
    - Open up to `k` runs at a time (fan-in), where `k` is limited by number of I/O buffers.
        
    - Use a **min-heap** (or priority queue) keyed by current head element of each run.
        
    - Repeatedly extract the minimum, write to output, and refill from the run that contributed that element.
        
    - If more than `k` runs exist, merge in **passes**, reducing the number of runs each pass until one remains.
        

> [!tip]  
> With `M` memory and block size `B`, you often choose `k ≈ M / B - 1` so that:
> 
> - `k` buffers hold current blocks from each run
>     
> - 1 buffer holds the output block being written
>     

---

## Complexity

External sorting’s cost is usually measured in **block I/Os**:

- Each pass reads and writes all `N` records: cost per pass ≈ `2 · (N / B)` I/Os.
    
- Number of passes ≈ `1 + ⌈log_{k}(R)⌉` where:
    
    - `R ≈ N / M` is the initial number of runs,
        
    - `k` is merge fan-in (how many runs we merge at once).
        

So total I/O cost is roughly:

$$
O\!\left(\frac{N}{B} + \frac{N}{B}\log_{k}\!\frac{N}{M}\right)
$$

Key takeaway: **larger memory and larger merge fan-in → fewer passes**, hence fewer I/Os.

---

## Variants

### Replacement selection for longer runs

Instead of simply sorting chunks of size `M`, we can:

- Use a **min-heap** of size `M`.
    
- Repeatedly output the smallest element, then read a new element:
    
    - If the new element is ≥ last output, put it in the heap (same run).
        
    - Otherwise, mark it for the **next run**.
        
- This tends to produce runs of **expected length ≈ 2M** (for random data), reducing the number of runs and merge passes.
    

### Multi-pass vs single-pass merge

- If `R ≤ k`, we can do a **single merge pass** after run generation.
    
- If `R > k`, we need **multiple merge passes**, each pass shrinking the number of runs.
    

### External mergesort vs other techniques

- **External quicksort** is much less common (partitioning cost, tricky I/O behavior).
    
- **External radix sort** can be used when keys are fixed-width and we can afford multiple key passes.
    

---

## Implementations

Practical external sort implementations care about:

- **Buffer management**
    
    - Input buffers per run, output buffer for sequential writes.
        
    - Double-buffering or async I/O to overlap computation and disk.
        
- **Priority queue choice**
    
    - Binary heap or d-ary heap for selecting the next smallest record.
        
    - Fan-in `k` equals the number of input runs merged in one pass.
        
- **Record layout**
    
    - Fixed vs variable-length records.
        
    - Separating keys from payload to reduce I/O when only keys are needed.
        
- **Integration with storage**
    
    - Using OS page cache vs custom buffer pool.
        
    - Pre-fetching / pre-allocation to keep I/O sequential.
        

---

## Examples

### Small illustrative run

Suppose:

- `N = 24` records
    
- Memory can hold `M = 6` records at a time
    
- We use simple run generation (no replacement selection).
    

1. **Run generation**
    
    - Read 6 records, sort, write `Run1`.
        
    - Next 6 → `Run2`, next 6 → `Run3`, last 6 → `Run4`.
        
    - Now we have 4 sorted runs on disk.
        
2. **Merge**
    
    - Assume we have enough memory for 4 input buffers + 1 output buffer, so `k = 4`.
        
    - Perform **one 4-way merge** of `Run1..Run4` into a single sorted output run.
        
    - Done in `1 (run gen) + 1 (merge)` passes.
        

---

## Pitfalls

> [!warning] I/O and memory pitfalls
> 
> - **Too small fan-in**: merging only 2 runs at a time leads to many passes and excessive I/O.
>     
> - **Random I/O**: poor buffering causes seeks instead of streaming reads/writes.
>     
> - **Ignoring OS caching**: double-buffering badly with the OS can hurt performance.
>     

> [!warning] Algorithmic pitfalls
> 
> - Not handling **variable-length records** carefully (key vs payload alignment).
>     
> - Assuming in-memory sorts are free - they still matter when `M` is large.
>     
> - Forgetting **stability** requirements; some external mergesorts are stable, others are not.
>     

---

## Applications

- **Database systems**
    
    - ORDER BY / GROUP BY implementations.
        
    - External merge-join (both inputs externally sorted).
        
    - Building **B-Tree / B+ Tree** indexes from large tables (bulk load).
        
- **Log processing and analytics**
    
    - Sorting massive log files before aggregation.
        
    - Deduplication and grouping operations.
        
- **[[cs/systems/file-systems|File systems]] and storage engines**
    
    - Background compaction and SSTable merges (e.g., LSM-tree systems).
        

---

## Summary

- External sorting is about **sorting data that doesn’t fit in RAM** by structuring passes over disk.
    
- Standard pattern: **run generation + multiway merge**, optimized for **sequential I/O**.
    
- Complexity is dominated by the **number of full-data passes**, which depends on:
    
    - Available memory `M`
        
    - Block size `B`
        
    - Merge fan-in `k`
        
- It’s a core primitive behind database operations, index construction, and large-scale data processing.
    

---

## Related Notes

- [[merge-sort|Merge Sort]]
    
- [[bplus-tree|B+ Tree]]
    
- [[b-tree|B-Tree]]
    
- [[binary-heap|Binary Heap]]
    
- [[algorithm-efficiency|Algorithm Efficiency]]
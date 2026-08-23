---
title: Pointers with Functions
description: How and why to pass addresses so callees can read or write caller memory; patterns, const-correctness, and safety.
draft: false
comments: true
tags:
  - cs
  - dsa
date: 2025-10-16
updated: 2025-12-28
aliases: []

---

## Overview

Passing a **pointer** (an address) to a function lets the callee **access the caller's storage**. This enables in-place updates, out-parameters, and zero-copy APIs - but introduces hazards: **null/[[cs/security/use-after-free-and-heap-exploitation|dangling pointers]], aliasing, lifetime,** and **bounds** issues. This note gives a practical guide to pointer-parameter design: when to use pointers, how to express **read-only vs read–write** intent (**[[cs/languages/Cpp/const-correctness|const-correctness]]**), and how to avoid common bugs.

> [!note]
> Think of a pointer parameter as a **capability**: "here is _where_ you may read/write." Good APIs make that capability **explicit** (read-only vs mutable, length, ownership).

## Underlying Process

At a call site:

1. The caller computes the **address** of an object (stack, heap, global) and passes that address.

2. The callee receives the address as a parameter (e.g., `int *p`).

3. Reads/writes use **indirection** (`*p`, `p[i]`) to access the caller's storage.

4. On return, any writes through the pointer are **visible** to the caller; the pointer value itself (an integer-like address) was passed **by value** unless explicitly passed by reference-to-pointer.


**Const-correctness**

- `const T* p` - callee may **read** `*p` but must not modify it.

- `T* p` - callee may **read and write** `*p`.

- `T* const p` - the pointer variable `p` itself cannot be reassigned, but `*p` may change.

- `const T* const p` - fixed pointer to read-only data.


> [!tip]
> Prefer `const` parameters for inputs. Reserve **mutable pointers** for explicit _out_ or _in/out_ roles.

## Example Execution

### 1) Out-parameter for status + result (C-style)

```c
// Returns 0 on success; writes result into *out_sum.
int sum_u32(const uint32_t* arr, size_t n, uint64_t* out_sum) {
    if (!arr || !out_sum) return -1;
    uint64_t s = 0;
    for (size_t i = 0; i < n; ++i) s += arr[i];
    *out_sum = s;                    // write into caller's memory
    return 0;
}

// Caller:
uint64_t s;
if (sum_u32(a, n, &s) == 0) { /* use s */ }
```

- `arr` is **read-only** via `const`.

- `out_sum` is **write-only** in spirit; it should be documented as such.


### 2) In-place transform on a buffer

```c
void scale_in_place(float* xs, size_t n, float c) {
    if (!xs) return;
    for (size_t i = 0; i < n; ++i) xs[i] *= c;
}
```

- The function **mutates** the caller's array via `xs[i]`.


### 3) Reference-to-pointer when callee must rebind storage

```c
// Reallocate and update caller's pointer.
// Returns new length; sets *buf to new storage or NULL on failure.
size_t ensure_capacity(uint8_t** buf, size_t* cap, size_t need) {
    if (*cap >= need) return *cap;
    size_t new_cap = (*cap ? *cap * 2 : 64);
    while (new_cap < need) new_cap *= 2;
    uint8_t* p = (uint8_t*)realloc(*buf, new_cap);
    if (!p) { /* leave old buffer intact */ return *cap; }
    *buf = p;                         // rebind caller's pointer
    *cap = new_cap;
    return new_cap;
}
```

- Pass `T**` (pointer to pointer) when the **callee must change where** the caller points.

## Performance and Design Trade-offs

- **Zero-copy**: Pointers avoid copying large data structures (`O(1)` passing).

- **In-place vs out-of-place**: In-place can be faster and memory-frugal, but harder to reason about. Out-of-place (returning a new value) is safer and often clearer.

- **Cache locality**: Mutating through pointers is as local as your data layout; see [[dynamic-arrays|Dynamic Arrays]] and [[multidimensional-arrays|Multidimensional Arrays]] for stride/layout implications.

- **API clarity**: Use names and types to signal direction:

    - Inputs: `const T* in`, `size_t in_len`

    - Outputs: `T* out`, `size_t out_cap` (capacity), return actual bytes written.

    - In/out: `T* inout`, document changes.


> [!tip]
> For bulk writes, pass **capacity + length**: the callee can avoid overflow and the caller can pre-size buffers.

## Correctness and Reliability Considerations

### 1) Bounds and length

A pointer **does not carry length**. Always pair buffer pointers with **explicit size** (`n`) or use a slice/view type (`{ptr,len}`).

```c
int fill(uint8_t* out, size_t cap) {
    if (cap < 4) return -1;          // guard
    out[0]=1; out[1]=2; out[2]=3; out[3]=4;
    return 4;
}
```

### 2) Null, dangling, and lifetime

- **Null**: check for `NULL` (or forbid it contractually).

- **Dangling**: never return pointers to **stack** locals; ensure the **pointee** outlives its uses.

- **Reallocation**: functions like `realloc` can **move** storage - callers must update all aliases.


### 3) Aliasing and reentrancy

Two different pointer parameters can alias the **same region**, causing subtle bugs if written in the wrong order.

```c
// Safe even when dst==src: iterate from end on overlap.
void memmove_like(uint8_t* dst, const uint8_t* src, size_t n) {
    if (dst < src) for (size_t i=0;i<n;++i) dst[i]=src[i];
    else if (dst > src) for (size_t i=n; i>0; --i) dst[i-1]=src[i-1];
}
```

### 4) Const-correctness discipline

- Mark inputs `const`.

- Use `const` to allow **aliasing safely** (compiler can assume read-only).

- Do not cast away `const` unless the original object was non-const and you control its lifetime.


### 5) Ownership and allocation

Document **who allocates** and **who frees**:

- _Caller allocates, callee fills_ (classic out-param).

- _Callee allocates, caller frees_ (return pointer or `T** out`).

- _Shared ownership_ requires [[cs/languages/common/memory-ownership-refcounting-gc|reference counts]] or conventions - avoid in low-level C unless necessary.


> [!warning]
> Mismatched allocator/free (`malloc` vs custom pool) leads to crashes. Free with the **same allocator family** that allocated.

### 6) Thread-safety

Pointers cross thread boundaries as raw capabilities. If multiple threads write through aliases, use **locks** or restrict to **immutable** reads.

### 7) Language notes (brief)

- **C**/**C++**: raw pointers as above; prefer `span<T>`/`std::span` (C++) for `{ptr,len}` views; prefer `T&`/`const T&` for single objects when mutation is controlled.

- **Go**: pass `*T` for mutating a struct; slices and maps are **reference-like** already - passing a slice by value shares backing storage.

- **Rust**: uses **borrows** instead of raw pointers in safe code (`&T`, `&mut T`) with compile-time lifetime checks; raw pointers exist in `unsafe`.

- **Java/C#/Swift**: ordinary references act as pointers to objects; arrays are reference types (mutations visible). Interop with native code uses explicit pointer wrappers.


## Implementation Notes

- Prefer **half-open** ranges (`[0..n)`) in loops to avoid off-by-one errors when indexing through `p[i]`.

- Avoid **double free** by centralizing ownership responsibility; use RAII in C++ and "free-after-transfer" patterns in C.

- Validate **alignment** if the callee performs vectorized loads/stores; misaligned pointers can hurt performance or fault on strict platforms.

- For **binary protocols**, define structs with explicit packing or use byte-wise access to avoid padding/endianness pitfalls.


> [!tip]
> Introduce **lightweight view types** early (`struct slice { void* ptr; size_t len; }`). They document bounds and make APIs harder to misuse than raw `T*`.

## Related Concepts

- **References vs pointers**: references (`T&`) are non-null, aliasing handles with simpler syntax; pointers (`T*`) can be null/reassigned.

- **Handles/IDs**: instead of exposing pointers, some APIs pass opaque IDs that the callee resolves internally - safer but less flexible.

- **Copy vs move**: for large data, consider **move** (transfer ownership) rather than pointer mutation; see [[pass-by-value-and-pass-by-reference|Pass-by-Value vs Reference]].


## Summary

Pointers-as-parameters are a powerful **capability**: they enable in-place updates, zero-copy I/O, and flexible memory management. Use them deliberately:

- Mark **inputs `const`**, reserve mutable pointers for **out** or **in/out** roles.

- Always pair pointers with **length/capacity** and document **ownership**.

- Guard against **null**, **dangling**, **aliasing**, and **bounds** errors.

- When the callee must **rebind** the caller's pointer, pass a **pointer to pointer** (`T**`) (or equivalent in your language).
    With these habits, pointer-based APIs are both **fast** and **safe** enough for systems work and high-performance DS&A code.


## Related Notes

- [[pass-by-value-and-pass-by-reference|Pass-by-Value vs Reference]]

- [[dynamic-arrays|Dynamic Arrays]]

- [[multidimensional-arrays|Multidimensional Arrays]]

- [[functions|Functions]]

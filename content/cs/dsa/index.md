---
title: Data Structures & Algorithms
description: Foundations for efficient computation - data representations, runtime/space analysis, and classic strategies (searching, sorting, trees/heaps/hashes, graphs, DP/greedy/backtracking).
draft: false
comments: false
tags:
  - cs
  - dsa
date: 2025-10-16
updated: 2026-03-12
aliases: []
---

DS&A studies how to represent data and design algorithms that scale. The notes below are grouped by concept cluster - start with an overview note where one exists, then follow links into specifics. The full file list follows automatically below.

### Foundations

- [[cs/dsa/problem-instance|Problem and Instance]] - the split every complexity claim is stated over
- [[cs/dsa/decision-search-and-optimization-problems|Decision, Search & Optimization Problems]] - sorting problems by answer shape
- [[cs/dsa/algorithm-correctness|Algorithm Correctness]] - partial correctness, termination, and why testing is not proof
- [[cs/dsa/loop-invariant|Loop Invariant]] - initialization, maintenance, termination
- [[cs/dsa/recursion|Recursion]] - recursive thinking, base cases, stack frames
- [[cs/dsa/functions|Functions]] - abstraction, composition, parameter passing
- [[cs/dsa/pass-by-value-and-pass-by-reference|Pass by Value & Reference]]
- [[cs/dsa/pointer-with-functions|Pointers & Functions]]
- [[cs/dsa/bitwise-operations|Bitwise Operations]] - operators, masks, bit tricks

### Complexity & Analysis

- [[cs/dsa/algorithm-efficiency|Algorithm Efficiency]] - bridging theory and practice
- [[cs/dsa/asymptotic-notation|Asymptotic Notation]] - O, Θ, Ω, o, ω
- [[cs/dsa/time-complexity-analysis|Time Complexity Analysis]]
- [[cs/dsa/time-complexity-and-space-complexity|Time & Space Complexity]]
- [[cs/dsa/time-complexity-calculation|Time Complexity Calculation]]
- [[cs/dsa/space-complexity|Space Complexity]]
- [[cs/dsa/best-worst-average-cases|Best, Worst & Average Cases]]
- [[cs/dsa/amortized-analysis-methods|Amortized Analysis]]
- [[cs/dsa/recurrence-relations|Recurrence Relations]]
- [[cs/dsa/recurrences-master-theorem|Master Theorem]]
- [[cs/dsa/combinatorial-explosion|Combinatorial Explosion]] - why exhaustive methods fail at modest sizes

### Linear Data Structures

**Arrays**
- [[cs/dsa/arrays|Arrays]] - [[cs/dsa/array-operations|Operations]] - [[cs/dsa/dynamic-arrays|Dynamic Arrays]]
- [[cs/dsa/multidimensional-arrays|Multidimensional Arrays]] - [[cs/dsa/matrices|Matrices]]
- [[cs/dsa/strings|Strings]]

**Linked Lists**
- [[cs/dsa/linked-list|Linked List]] - [[cs/dsa/doubly-linked-list|Doubly Linked]] - [[cs/dsa/circular-linked-list|Circular]]
- [[cs/dsa/linked-list-operations|Linked List Operations]] - [[cs/dsa/linked-list-searching|Searching]]

**Stacks**
- [[cs/dsa/stack|Stack]] - [[cs/dsa/push-and-pop-operations|Push & Pop]]
- [[cs/dsa/stack-using-array|Array Implementation]] - [[cs/dsa/stack-using-linked-list|Linked List Implementation]]
- [[cs/dsa/stack-using-queue|Stack via Queue]]

**Queues**
- [[cs/dsa/queue|Queue]] - [[cs/dsa/enque-and-deque-operations|Enqueue & Dequeue]]
- [[cs/dsa/queue-using-array|Array Implementation]] - [[cs/dsa/queue-using-linked-list|Linked List Implementation]]
- [[cs/dsa/circular-queue|Circular Queue]] - [[cs/dsa/deque|Deque]] - [[cs/dsa/priority-queue|Priority Queue]]

**Hash-Based**
- [[cs/dsa/hash-tables|Hash Tables]] - [[cs/dsa/maps-and-hashtable|Maps & Hash Tables]]

### Trees & Heaps

**Trees**
- [[cs/dsa/trees|Trees Overview]] - [[cs/dsa/binary-tree|Binary Tree]] - [[cs/dsa/types-of-binary-tree|Types of Binary Tree]]
- [[cs/dsa/tree-traversal|Tree Traversal]] - [[cs/dsa/preorder|Preorder]] - [[cs/dsa/inorder|Inorder]] - [[cs/dsa/postorder|Postorder]]
- [[cs/dsa/bst|Binary Search Tree]]
- [[cs/dsa/avl-tree|AVL Tree]] - [[cs/dsa/avl-rotations|AVL Rotations]]
- [[cs/dsa/rb-tree|Red-Black Tree]] - [[cs/dsa/splay-tree|Splay Tree]]
- [[cs/dsa/b-tree|B-Tree]] - [[cs/dsa/bplus-tree|B+ Tree]]

**Tries**
- [[cs/dsa/tries|Tries Overview]] - [[cs/dsa/types-of-tries|Types of Tries]]
- [[cs/dsa/standard-trie|Standard Trie]] - [[cs/dsa/compressed-trie|Compressed Trie]] - [[cs/dsa/suffix-trie|Suffix Trie]]

**Heaps**
- [[cs/dsa/heaps|Heaps Overview]] - [[cs/dsa/binary-heap|Binary Heap]] - [[cs/dsa/d-ary-heap|D-ary Heap]]
- [[cs/dsa/heapify|Heapify]] - [[cs/dsa/heap-insert-delete|Insert & Delete]]
- [[cs/dsa/heapsort|Heapsort]]

### Graphs

- [[cs/dsa/graphs|Graphs Overview]]
- [[cs/dsa/graph-representations|Representations]] - [[cs/dsa/adjacency-list|Adjacency List]] - [[cs/dsa/adjacency-matrix|Adjacency Matrix]]
- [[cs/dsa/graph-traversals-bfs-dfs|Traversals (BFS & DFS)]] - [[cs/dsa/breadth-first-search-algorithms|BFS]] - [[cs/dsa/depth-first-search-algorithms|DFS]]
- [[cs/dsa/dijkstras-algorithm|Dijkstra's Algorithm]] - [[cs/dsa/floyd-warshall|Floyd-Warshall]]
- [[cs/dsa/minimum-spanning-trees-kruskal-prim|Minimum Spanning Trees]] - [[cs/dsa/kruskals-algorithm|Kruskal's]] - [[cs/dsa/prims-algorithm|Prim's]]
- [[cs/dsa/topological-sorting|Topological Sorting]] - [[cs/dsa/disjoint-set|Disjoint Set (Union-Find)]]

### Sorting & Searching

**Sorting**
- [[cs/dsa/sorting|Sorting Overview]]
- [[cs/dsa/bubble-sort|Bubble Sort]] - [[cs/dsa/insertion-sort|Insertion Sort]] - [[cs/dsa/selection-sort|Selection Sort]]
- [[cs/dsa/merge-sort|Merge Sort]] - [[cs/dsa/quick-sort|Quick Sort]] - [[cs/dsa/heapsort|Heapsort]]
- [[cs/dsa/counting-sort|Counting Sort]] - [[cs/dsa/bucket-sort|Bucket Sort]] - [[cs/dsa/radix-sort|Radix Sort]]
- [[cs/dsa/external-sorting|External Sorting]]

**Searching**
- [[cs/dsa/searching|Searching Overview]]
- [[cs/dsa/linear-search|Linear Search]] - [[cs/dsa/binary-search|Binary Search]] - [[cs/dsa/ternary-search|Ternary Search]]

### Algorithmic Paradigms

- [[cs/dsa/brute-force-search|Brute Force Search]] - the baseline the others are measured against
- [[cs/dsa/divide-and-conquer|Divide & Conquer]]
- [[cs/dsa/dynamic-programming|Dynamic Programming]] - [[cs/dsa/knapsack-problem|Knapsack Problem]]
- [[cs/dsa/greedy-algorithms|Greedy Algorithms]] - [[cs/dsa/huffman-coding|Huffman Coding]]
- [[cs/dsa/backtracking-algorithms|Backtracking]]
- [[cs/dsa/branch-and-bound|Branch & Bound]]
- [[cs/dsa/constraint-satisfaction-problems|Constraint Satisfaction]]

### Math Foundations

- [[cs/dsa/maths|Math Overview]]
- [[cs/dsa/logarithmic-functions|Logarithmic Functions]]
- [[cs/dsa/prime-numbers-algorithms|Prime Number Algorithms]]
- [[cs/dsa/square-root-algorithms|Square Root Algorithms]]
- [[cs/dsa/euclidean-algorithms|Euclidean Algorithms]] - [[cs/dsa/hcf-and-lcm-algorithms|HCF & LCM]]
- [[cs/dsa/bitwise-operations|Bit Manipulation]]

### Memory & Data Layout

- [[cs/dsa/memory-allocation|Memory Allocation]] - [[cs/dsa/dynamic-memory-allocation|Dynamic Memory Allocation]]

---

*The full file listing follows below, generated automatically by Quartz.*

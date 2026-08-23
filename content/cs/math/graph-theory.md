---
title: Graph Theory
description: Formal definitions of graphs, planarity, graph coloring, and Euler/Hamilton paths and circuits.
draft: false
comments: true
tags:
  - cs
  - math
date: 2026-03-12
updated:
aliases: []
---

## The Idea

Graphs are one of those abstractions that punch way above their weight. Dots connected by lines. That's it. But the moment you realize that network routing, scheduling conflicts, map coloring, dependency resolution, social influence, and compiler analysis all reduce to "build a graph, then ask a structural question about it," the power becomes obvious. Graph theory formalizes these structures and gives you a toolkit of results about what's possible and what's provably hard.

> [!note]
> The DSA notes on [[cs/dsa/graphs|Graphs]] and [[cs/dsa/graph-representations|Graph Representations]] cover the implementation side (adjacency lists, BFS/DFS, shortest paths). This note is about the math: the theorems, the structural results, and the proof techniques that make those algorithms work.

## Definitions

A **graph** $G = (V, E)$ consists of a set of **vertices** $V$ and a set of **edges** $E \subseteq V \times V$. Graphs may be directed or undirected, weighted or unweighted.

- **Degree** of a vertex $v$: the number of edges incident to $v$. In a directed graph, distinguish **in-degree** $\deg^-(v)$ and **out-degree** $\deg^+(v)$.
- **Path**: a sequence of vertices $v_0, v_1, \dots, v_k$ where each consecutive pair is connected by an edge.
- **Cycle**: a path where $v_0 = v_k$ and $k \geq 3$ (for simple cycles).
- **Connected graph**: every pair of vertices has a path between them.

**Handshaking lemma**: in any undirected graph, $\sum_{v \in V} \deg(v) = 2|E|$. Every edge contributes 2 to the total degree. This sounds trivial but it's surprisingly useful for quick sanity checks and impossibility proofs (e.g., you can't have a graph where every vertex has odd degree and the vertex count is odd).

## Planarity

A graph is **planar** if it can be drawn in the plane with no edge crossings. Euler's formula for connected planar graphs:

$$V - E + F = 2$$

where $F$ is the number of faces (regions), including the outer face.

> [!example]
> $K_4$ (complete graph on 4 vertices) is planar: $4 - 6 + 4 = 2$ checks out. $K_5$ is not planar, because it has 10 edges but a simple planar graph on 5 vertices can have at most $3(5) - 6 = 9$ edges.

**Kuratowski's theorem** gives a complete characterization: a graph is planar if and only if it contains no subdivision of $K_5$ or $K_{3,3}$. This is elegant but checking it directly is not how you'd typically test planarity in practice; there are linear-time planarity testing algorithms instead.

## Graph Coloring

A **proper $k$-coloring** assigns one of $k$ colors to each vertex so that no two adjacent vertices share a color. The **chromatic number** $\chi(G)$ is the smallest $k$ for which a proper coloring exists.

Key results:

- **Four Color Theorem**: $\chi(G) \leq 4$ for every planar graph. One of the first major theorems proved with computer assistance.
- **Brooks' theorem**: for a connected graph that is neither complete nor an odd cycle, $\chi(G) \leq \Delta(G)$, where $\Delta(G)$ is the maximum degree.
- A cycle on 5 vertices $C_5$ requires 3 colors ($\chi(C_5) = 3$), because any attempt with 2 colors fails on the odd cycle.

> [!tip]
> Compilers model **register allocation** as graph coloring. Each variable becomes a vertex; an edge connects two variables that are live at the same time. Coloring with $k$ colors (registers) assigns registers so no two simultaneously live variables share one. If $\chi(G) > k$, some variables get spilled to memory. This is one of the cleanest examples of a mathematical abstraction directly driving a real system.

## Euler Paths and Circuits

An **Euler path** traverses every edge exactly once. An **Euler circuit** is an Euler path that starts and ends at the same vertex.

The characterization is clean and complete:
- An undirected graph has an **Euler circuit** iff every vertex has even degree and the graph is connected.
- It has an **Euler path** (but not a circuit) iff exactly two vertices have odd degree.

> [!example]
> The Konigsberg bridge problem, which literally started graph theory as a field. The city had four land masses connected by seven bridges. Euler modeled each land mass as a vertex and each bridge as an edge. Degrees: $\deg(A) = 5$, $\deg(B) = 3$, $\deg(C) = 3$, $\deg(D) = 3$. Since more than two vertices have odd degree, no Euler path exists. You cannot cross every bridge exactly once. This argument was published in 1736.

## Hamilton Paths and Circuits

A **Hamilton path** visits every vertex exactly once; a **Hamilton circuit** returns to the start.

Here's where things get hard. Unlike the Euler case, there is no simple necessary-and-sufficient condition for Hamiltonicity. Determining whether a Hamilton path exists is **NP-complete**. This contrast between Euler (polynomial, clean characterization) and Hamilton (NP-complete, no clean characterization) is a good example of how similar-sounding problems can have wildly different computational complexity.

> [!warning]
> Don't confuse Euler and Hamilton. **Euler** = every *edge* once. **Hamilton** = every *vertex* once. Euler has a nice polynomial-time solution. Hamilton is NP-complete. The naming is easy to mix up on exams.

The complete graph $K_n$ for $n \geq 3$ always has a Hamilton circuit, in fact $\frac{(n-1)!}{2}$ distinct ones. The Petersen graph, despite being 3-regular and 3-connected, has no Hamilton circuit, which shows that high connectivity alone doesn't guarantee Hamiltonicity.

## Trees and Bipartiteness

**Trees**: a connected acyclic graph on $n$ vertices has exactly $n - 1$ edges. Removing any edge disconnects it; adding any edge creates a cycle. Trees are the natural recursion structure for divide-and-conquer and hierarchical data (file systems, DOM trees, ASTs).

**Bipartite characterization**: a graph is bipartite if and only if it contains no odd-length cycle. Bipartite graphs model matching problems like job assignments and resource allocation; the Hungarian algorithm solves maximum matching in polynomial time.

## Special Graph Families

- **DAGs** (directed acyclic graphs): model dependencies, enable topological sorting, and are the backbone of build systems, dataflow analysis, and scheduling.
- **Hypergraphs**: generalize edges to connect more than two vertices; used in VLSI design and database schema modeling.

## Network Flow

Given a directed graph with edge capacities, the **max-flow min-cut theorem** states that the maximum flow from source $s$ to sink $t$ equals the minimum capacity of any $s$-$t$ cut. This result connects combinatorial optimization to graph structure and underpins algorithms like Ford-Fulkerson and Edmonds-Karp. It shows up in everything from network bandwidth allocation to image segmentation.

## Related Notes

- [[cs/dsa/graphs|Graphs]] - overview of graph structures in the DSA context
- [[cs/dsa/graph-representations|Graph Representations]] - adjacency list vs adjacency matrix
- [[combinatorics|Combinatorics]] - counting arguments used in graph proofs
- [[mathematical-induction|Mathematical Induction]] - induction on vertices/edges is a core proof technique in graph theory

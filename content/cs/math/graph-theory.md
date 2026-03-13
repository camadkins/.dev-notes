---
title: Graph Theory
description: Formal definitions of graphs, planarity, graph coloring, and Euler/Hamilton paths and circuits.
draft: false
comments: false
tags:
  - cs
  - math
date: 2026-03-12
aliases: []
---

## Intuition

A graph is one of the simplest yet most powerful abstractions in mathematics: dots connected by lines. Despite this simplicity, graphs model an enormous range of problems — network routing, scheduling, map coloring, circuit design, social networks, and dependency resolution. Graph theory formalizes these structures and asks what properties they have and what operations are possible on them.

The power of graph theory lies in its generality. Once you model a problem as a graph, you inherit a vast toolkit of theorems and algorithms. Compiler passes operate on control-flow graphs, operating systems detect deadlocks via resource-allocation graphs, and social platforms analyze influence through network graphs. The same structural questions — connectivity, cycles, shortest paths, colorability — appear across all these domains.

## Core Idea

A **graph** $G = (V, E)$ consists of a set of **vertices** $V$ and a set of **edges** $E \subseteq V \times V$. Graphs may be directed or undirected, weighted or unweighted.

**Key definitions:**

- **Degree** of a vertex $v$: the number of edges incident to $v$. In a directed graph, distinguish **in-degree** $\deg^-(v)$ and **out-degree** $\deg^+(v)$.
- **Path**: a sequence of vertices $v_0, v_1, \dots, v_k$ where each consecutive pair is connected by an edge.
- **Cycle**: a path where $v_0 = v_k$ and $k \geq 1$.
- **Connected graph**: every pair of vertices has a path between them.

**Planarity.** A graph is **planar** if it can be drawn in the plane with no edge crossings. Kuratowski's theorem states that a graph is planar if and only if it contains no subdivision of $K_5$ or $K_{3,3}$. Euler's formula for connected planar graphs:

$$V - E + F = 2$$

where $F$ is the number of faces (regions), including the outer face.

**Graph coloring.** A **proper $k$-coloring** assigns one of $k$ colors to each vertex so that no two adjacent vertices share a color. The **chromatic number** $\chi(G)$ is the smallest $k$ for which a proper coloring exists. The Four Color Theorem guarantees $\chi(G) \leq 4$ for every planar graph.

**Euler paths and circuits.** An **Euler path** traverses every edge exactly once. An **Euler circuit** is an Euler path that starts and ends at the same vertex. An undirected graph has an Euler circuit if and only if every vertex has even degree and the graph is connected. It has an Euler path (but not a circuit) if and only if exactly two vertices have odd degree.

**Hamilton paths and circuits.** A **Hamilton path** visits every vertex exactly once; a **Hamilton circuit** returns to the start. Unlike the Euler case, no simple necessary-and-sufficient condition is known — determining whether a Hamilton path exists is NP-complete.

**Important theorems:**

- **Handshaking lemma**: in any undirected graph, $\sum_{v \in V} \deg(v) = 2|E|$. Every edge contributes 2 to the total degree.
- **Trees**: a connected acyclic graph on $n$ vertices has exactly $n - 1$ edges. Removing any edge disconnects it; adding any edge creates a cycle.
- **Bipartite characterization**: a graph is bipartite if and only if it contains no odd-length cycle.
- **Brooks' theorem**: for a connected graph that is neither complete nor an odd cycle, $\chi(G) \leq \Delta(G)$, where $\Delta(G)$ is the maximum degree.

## Example

Consider the Konigsberg bridge problem — the origin of graph theory. The city had four land masses connected by seven bridges. Euler modeled each land mass as a vertex and each bridge as an edge:

- Vertices: $\{A, B, C, D\}$
- Degrees: $\deg(A) = 5$, $\deg(B) = 3$, $\deg(C) = 3$, $\deg(D) = 3$

Since more than two vertices have odd degree, no Euler path exists — it is impossible to cross every bridge exactly once. This argument launched the field.

**Coloring example.** A cycle on 5 vertices $C_5$ requires 3 colors ($\chi(C_5) = 3$), because any attempt with 2 colors fails on the odd cycle.

**Planarity example.** $K_4$ (complete graph on 4 vertices) is planar: $4 - 6 + 4 = 2$ checks out. $K_5$ is not planar — it has 10 edges, but a simple planar graph on 5 vertices can have at most $3(5) - 6 = 9$ edges.

**Hamilton circuit example.** The complete graph $K_n$ for $n \geq 3$ always has a Hamilton circuit — in fact, it has $\frac{(n-1)!}{2}$ distinct ones (dividing by 2 for direction). The Petersen graph, despite being 3-regular and 3-connected, has no Hamilton circuit — a classic counterexample showing that high connectivity alone does not guarantee Hamiltonicity.

**CS application: register allocation.** Compilers model register allocation as a graph coloring problem. Each variable is a vertex; an edge connects two variables that are simultaneously live. Coloring the graph with $k$ colors (registers) assigns registers so that no two simultaneously live variables share one. If $\chi(G) > k$, some variables must be spilled to memory.

**CS application: network flow.** Given a directed graph with edge capacities, the max-flow min-cut theorem states that the maximum flow from source $s$ to sink $t$ equals the minimum capacity of any $s$-$t$ cut. This result connects combinatorial optimization to graph structure and underpins algorithms like Ford-Fulkerson and Edmonds-Karp.

**Special graph families in CS:**

- **DAGs** (directed acyclic graphs): model dependencies, enable topological sorting, and are the backbone of build systems and dataflow analysis.
- **Trees**: connected acyclic graphs; the natural recursion structure for divide-and-conquer and hierarchical data.
- **Bipartite graphs**: model matching problems (job assignments, resource allocation); the Hungarian algorithm solves maximum matching in polynomial time.
- **Hypergraphs**: generalize edges to connect more than two vertices; used in VLSI design and database schema modeling.

## Related Notes

- [[graphs|Graphs]] — overview of graph structures in the DSA context
- [[graph-representations|Graph Representations]] — adjacency list vs adjacency matrix
- [[combinatorics|Combinatorics]] — counting arguments used in graph proofs
- [[mathematical-induction|Mathematical Induction]] — induction on vertices/edges is a core proof technique in graph theory

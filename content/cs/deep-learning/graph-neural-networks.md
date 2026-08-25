---
title: Graph Neural Networks
description: Learning on data whose shape is a graph, where message passing over neighborhoods replaces the fixed grid and permutation invariance is a hard requirement rather than a nicety.
draft: false
comments: true
tags:
  - cs
  - deep-learning
date: 2026-04-21
aliases:
  - GNN
  - message passing
  - graph convolutional network
---

A [[cs/deep-learning/convolutional-neural-networks|convolutional network]] assumes a grid. A [[cs/deep-learning/recurrent-neural-networks|recurrent network]] assumes a line. Both architectures get their power from an assumption about how the input is laid out, and both break when the input is a molecule, a citation network, or [[cs/dsa/dijkstras-algorithm|a road system]]. Graph neural networks are artificial neural networks designed for tasks whose inputs are [[cs/dsa/graphs|graphs]], where the layout is the data.

> [!note] The idea
> A graph has no canonical ordering of its nodes, so any function of a graph that depends on the order you happened to list the nodes in is computing something the graph does not contain. That constraint alone forces the architecture. Each layer must aggregate a node's neighborhood with an operator whose result does not depend on neighbor order (sum, mean, max), which makes the layer permutation equivariant by construction, and any whole-graph readout must be permutation invariant. Message passing is not one design choice among many; it is roughly what is left after the symmetry requirement rules the alternatives out.

## Why permutation symmetry is the load-bearing constraint

Feed the same molecule to a model twice, listing its atoms in two different orders, and you must get the same prediction. GNN architectures are therefore commonly designed to be permutation equivariant: reordering the nodes in the input reorders the corresponding node representations in the same way. For graph-level predictions, the network ends in a permutation-invariant readout function whose output is unchanged by the ordering of the nodes.

The distinction is worth holding precisely. Equivariance is for the per-node layers, where relabeling the inputs should relabel the outputs identically. Invariance is for the final readout, where relabeling should change nothing at all. Global pooling layers meet the requirement with element-wise sum, mean, or maximum, all of which ignore argument order.

There is a second reason grids fail here. Inputs differ in size, since molecules have varying numbers of atoms and bonds, so the architecture cannot assume a fixed input shape either.

## Message passing, formally

The key design element of GNNs is pairwise message passing: graph nodes iteratively update their representations by exchanging information with their neighbors. A message passing neural network layer is written

$$\mathbf{h}_u = \phi\left(\mathbf{x}_u,\ \bigoplus_{v \in N_u} \psi(\mathbf{x}_u, \mathbf{x}_v, \mathbf{e}_{uv})\right)$$

where $N_u$ is the neighborhood of node $u$, $\mathbf{x}_u$ are node features, $\mathbf{e}_{uv}$ are edge features, $\psi$ is the message function, $\phi$ is the update function, both differentiable (typically small neural networks), and $\bigoplus$ is a permutation invariant aggregation operator that can accept an arbitrary number of inputs.

Read that aggregation symbol carefully, because it is doing three jobs at once. It handles nodes of different degrees, since it accepts any number of inputs. It enforces the symmetry, since it is permutation invariant. And it is the only place the graph structure enters, since the neighborhood set is the graph. The learnable parts, $\psi$ and $\phi$, never see an ordering.

Each message passing layer increases the receptive field of the GNN by one hop, so stacking $n$ layers lets a node communicate with nodes at most $n$ hops away. In principle, ensuring every node hears from every other node would require stacking layers equal to [[cs/math/graph-theory|the graph diameter]].

Gilmer, Schoenholz, Riley, Vinyals, and Dahl named the framework in 2017 by reformulating several existing models, described as neural networks invariant to molecular symmetries that learn a message passing algorithm and aggregation procedure to compute a function of their entire input graph, into a single common framework they called Message Passing Neural Networks. Applied to molecular property prediction, MPNNs produced state-of-the-art results strong enough that the authors suggested future work move to datasets with larger molecules or more accurate ground truth labels.

## Graph convolutional networks

Kipf and Welling's graph convolutional network is the variant most people meet first, and its framing is deliberately convolution-shaped: an efficient variant of convolutional neural networks operating directly on graphs, motivated via a localized first-order approximation of spectral graph convolutions. GCNs can be understood as generalizing convolutional networks to graph-structured data, and the model [[cs/dsa/asymptotic-notation|scales linearly]] in the number of graph edges while learning hidden layer representations that encode both local graph structure and node features. On citation networks and a knowledge graph dataset, it outperformed related methods by a significant margin. GCNs and graph attention networks are both expressible in the MPNN formalism, differing in how the message and aggregation steps are parameterized.

The generalization runs the other way too. In geometric deep learning, existing architectures can be reinterpreted as GNNs on suitably defined graphs. A convolutional layer in vision is a GNN on a graph whose nodes are pixels with edges only between adjacent pixels. A [[cs/deep-learning/attention-and-transformers|transformer]] layer is a GNN on a complete graph whose nodes are the tokens in a passage. Attention over all pairs of tokens is message passing where every node is everyone's neighbor.

> [!warning] Depth hurts differently here
> Stacking many message passing layers causes two named failures. Oversmoothing is node representations becoming indistinguishable, since repeated neighborhood averaging pulls everything toward a common value. Oversquashing is the bottleneck created by squeezing long-range dependencies into fixed-size representations. Skip connections (as in residual networks), gated update rules, and jumping knowledge mitigate oversmoothing; making the final layer fully adjacent, treating the graph as complete, mitigates oversquashing where long-range dependencies matter.

There is also a ceiling on what this primitive can express. Standard message-passing GNNs are at most as expressive as the Weisfeiler-Leman graph isomorphism test, which means there exist different graph structures they cannot distinguish. More powerful designs operating on higher-dimensional geometries such as simplicial complexes exist, and as of 2022 whether future architectures will move past the message passing primitive was an open research question.

> [!example] A molecule, end to end
> Represent a molecule as a graph: nodes are atoms, edges are atomic bonds, and known chemical properties ride along as features. Run several message passing layers, so each atom's representation accumulates information about its bonded neighbors, then their neighbors, out to the number of layers. Apply a permutation-invariant readout to get one fixed-size vector for the whole molecule regardless of its size, and predict from that. A graph-level task might be predicting a molecule's efficacy for a medical application such as eliminating *E. coli* bacteria.

## Related Notes

- [[cs/dsa/graphs]], the structure being learned over
- [[cs/dsa/graph-representations]], adjacency lists and matrices behind the neighborhood set
- [[cs/deep-learning/convolutional-neural-networks]], the grid-shaped special case
- [[cs/deep-learning/attention-and-transformers]], message passing on a complete graph
- [[cs/deep-learning/pooling-and-cnn-architectures]], where the pooling and skip-connection ideas came from
- [[cs/machine-learning/features-and-representations]], what the node vectors are
- [[cs/deep-learning/embeddings]], the learned node representations these layers produce

## Sources

- "Graph neural network," Wikipedia. https://en.wikipedia.org/wiki/Graph_neural_network . Supports the lack of canonical node ordering, permutation equivariance and invariant readout, the MPNN layer formula and its message/update/aggregation roles, one-hop receptive field growth and the diameter argument, oversmoothing and oversquashing with their countermeasures, the Weisfeiler-Leman expressivity ceiling, CNN and transformer layers as GNNs on particular graphs, and the molecule-as-graph example.
- Justin Gilmer, Samuel S. Schoenholz, Patrick F. Riley, Oriol Vinyals, and George E. Dahl, "Neural Message Passing for Quantum Chemistry," arXiv:1704.01212. https://arxiv.org/abs/1704.01212 . Supports models invariant to molecular symmetries that learn a message passing algorithm and aggregation procedure over the whole input graph, the unification into the MPNN framework, and the molecular property prediction results.
- Thomas N. Kipf and Max Welling, "Semi-Supervised Classification with Graph Convolutional Networks," arXiv:1609.02907. https://arxiv.org/abs/1609.02907 . Supports the convolutional-variant framing, the localized first-order approximation of spectral graph convolutions, linear scaling in the number of edges, representations encoding local structure plus node features, and the citation-network and knowledge-graph results.

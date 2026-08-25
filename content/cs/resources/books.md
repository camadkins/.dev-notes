---
title: Books
description: Curated free and open books the garden's notes draw on, each with what it is good for.
draft: false
comments: true
tags:
  - cs
  - resources
  - resource/book
date: 2026-07-26
updated:
aliases: []
---

Free and open texts that notes in this garden actually cite. Every entry below is here because at least one note draws on it, and the "cited by" links are the back-links to those notes. Nothing is listed on reputation alone. Each title and author line was read off the publisher's own page.

### Machine learning and deep learning

**[Deep Learning](https://www.deeplearningbook.org/)** by Ian Goodfellow, Yoshua Bengio, and Aaron Courville (MIT Press). The standard graduate reference, free to read online in full. Strongest on the mathematical framing that most tutorials skip: what a loss function is really doing, why regularization works, and where deep models sit inside statistical learning.

Cited by [[cs/machine-learning/ai-vs-ml-vs-dl|AI vs ML vs DL]], [[cs/machine-learning/bias-variance-tradeoff|Bias-Variance Tradeoff]], [[cs/machine-learning/features-and-representations|Features and Representations]], [[cs/machine-learning/generalization-vs-memorization|Generalization vs Memorization]], [[cs/machine-learning/loss-functions|Loss Functions]], [[cs/machine-learning/supervised-learning|Supervised Learning]], [[cs/deep-learning/artificial-neural-networks|Artificial Neural Networks]], [[cs/deep-learning/backpropagation|Backpropagation]], [[cs/deep-learning/convolutional-neural-networks|Convolutional Neural Networks]], [[cs/deep-learning/recurrent-neural-networks|Recurrent Neural Networks]], [[cs/deep-learning/autoencoders|Autoencoders]], [[cs/deep-learning/regularization-in-deep-learning|Regularization in Deep Learning]], [[cs/deep-learning/generative-adversarial-networks|GANs]], [[cs/deep-learning/diffusion-models|Diffusion Models]].

**[Reinforcement Learning: An Introduction](http://incompleteideas.net/book/the-book.html)** by Richard S. Sutton and Andrew G. Barto, second edition (MIT Press, Cambridge MA, 2018). The field's founding textbook, with the full PDF posted by the authors. Read it for the value-function view of decision making before touching any deep RL implementation.

Cited by [[cs/deep-learning/reinforcement-learning|Reinforcement Learning]], [[cs/deep-learning/deep-reinforcement-learning|Deep Reinforcement Learning]].

**[Speech and Language Processing](https://web.stanford.edu/~jurafsky/slp3/)** (third edition draft) by Dan Jurafsky and James H. Martin. The NLP reference, kept as a freely posted living draft. Chapter 6 on vector semantics is the clearest published account of how word meaning becomes geometry.

Cited by [[cs/deep-learning/embeddings|Embeddings]].

### Systems and languages

**[The Rust Programming Language](https://doc.rust-lang.org/book/)**. The official book, free online. Its ownership chapters are the best plain-language explanation anywhere of an affine type discipline, which is why notes reach for it even when the subject is language theory rather than Rust.

Cited by [[cs/pl/ownership-and-linear-types|Ownership and Linear Types]], [[cs/pl/type-classes-and-traits|Type Classes and Traits]], [[cs/languages/common/memory-ownership-refcounting-gc|Memory, Ownership, Refcounting, GC]], [[cs/languages/common/errors-as-values-vs-control-flow|Errors as Values vs Control Flow]].

**[The Rust Reference](https://doc.rust-lang.org/reference/)**. The specification-shaped companion to the book. Where the book teaches, the Reference states the rule, which is what you want when the question is precisely what the language guarantees.

Cited by [[cs/pl/macros-and-metaprogramming|Macros and Metaprogramming]], [[cs/languages/common/undefined-behavior-as-a-contract|Undefined Behavior as a Contract]], [[cs/languages/common/c-abi-and-ffi|The C ABI and FFI]].

**[The Rustonomicon](https://doc.rust-lang.org/nomicon/)**. The unsafe-code book. Useful well beyond Rust for its treatment of what a thread-safety guarantee actually consists of.

Cited by [[cs/languages/common/concurrency-in-practice|Concurrency in Practice]].

**[The Cargo Book](https://doc.rust-lang.org/cargo/)**. The build tool's own manual, and a working example of the lockfile-versus-manifest split that every dependency manager has to solve somehow.

Cited by [[cs/languages/common/build-systems-and-dependency-management|Build Systems and Dependency Management]], [[cs/languages/common/software-supply-chain-and-provenance|Software Supply Chain and Provenance]].

## Related Notes

- [[cs/resources/index|Resources]]
- [[cs/resources/papers|Papers]]
- [[cs/resources/courses|Courses]]
- [[cs/resources/code|Code]]

## Sources

- Deep Learning, MIT Press. https://www.deeplearningbook.org/ . Title and the author line "Ian Goodfellow and Yoshua Bengio and Aaron Courville", and that the online version is complete and remains available free.
- Reinforcement Learning: An Introduction. http://incompleteideas.net/book/the-book.html . Title, authors "Richard S. Sutton and Andrew G. Barto", second edition, MIT Press, Cambridge MA, 2018, and the posted full PDF.
- Speech and Language Processing. https://web.stanford.edu/~jurafsky/slp3/ . Title, "3rd ed. draft", and authors "Dan Jurafsky and James H. Martin".
- The Rust Programming Language. https://doc.rust-lang.org/book/ . Title of the official book.
- The Rust Reference. https://doc.rust-lang.org/reference/ . Title.
- The Rustonomicon. https://doc.rust-lang.org/nomicon/ . Title.
- The Cargo Book. https://doc.rust-lang.org/cargo/ . Title.

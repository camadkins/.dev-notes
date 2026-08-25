---
title: Code
description: Open-source projects, reference implementations, and their documentation, with back-links to the notes that cite them.
draft: false
comments: true
tags:
  - cs
  - resources
  - resource/code
date: 2026-07-26
updated:
aliases: []
---

Open-source projects whose code or official documentation notes here cite directly. The pattern worth noticing: for most concepts the clearest available description is written by the people who had to implement it, because an implementer cannot leave the hard part vague.

### Machine learning libraries

**[scikit-learn](https://scikit-learn.org/stable/)**. The classical-ML library for Python, and its user guide is the most-cited implementation reference in this garden. Each module page states the algorithm, its assumptions, and its complexity, which is why the classical-ML notes lean on it rather than on tutorials.

Cited by [[cs/machine-learning/regression|Regression]] and [[cs/machine-learning/logistic-regression|Logistic Regression]] (linear models), [[cs/machine-learning/support-vector-machines|Support Vector Machines]] (svm), [[cs/machine-learning/k-nearest-neighbors|k-Nearest Neighbors]] (neighbors), [[cs/machine-learning/k-means-clustering|k-Means Clustering]] (clustering), [[cs/machine-learning/decision-trees-and-ensembles|Decision Trees and Ensembles]] (tree, ensemble), [[cs/machine-learning/pca-and-dimensionality-reduction|PCA and Dimensionality Reduction]] (decomposition).

**[Keras](https://keras.io/)**. A deep-learning API whose guides double as readable explanations of training mechanics.

Cited by [[cs/deep-learning/faster-optimizers-and-learning-rate-scheduling|Faster Optimizers and LR Scheduling]], [[cs/deep-learning/transfer-learning|Transfer Learning]].

**[GloVe: Global Vectors for Word Representation](https://nlp.stanford.edu/projects/glove/)**, Stanford NLP. The project page for the GloVe model, with the released vectors and the training code.

Cited by [[cs/deep-learning/embeddings|Embeddings]].

### Compilers and language implementations

**[LLVM Language Reference Manual](https://llvm.org/docs/LangRef.html)**. The specification of LLVM IR, and the most precise freely available description of an SSA-form intermediate representation, down to the well-formedness rules for phi nodes.

Cited by [[cs/pl/intermediate-representations-and-ssa|Intermediate Representations and SSA]].

**[Clang: Control Flow Integrity](https://clang.llvm.org/docs/ControlFlowIntegrity.html)**. The compiler's own documentation of its CFI schemes, describing what each check enforces and what it costs.

Cited by [[cs/security/control-flow-integrity|Control-Flow Integrity]].

**[What Every C Programmer Should Know About Undefined Behavior](https://blog.llvm.org/2011/05/what-every-c-programmer-should-know.html)**, LLVM Project Blog. Written from the optimizer's side, which is what makes it convincing: it shows undefined behavior as a premise the compiler is entitled to reason from.

Cited by [[cs/languages/common/undefined-behavior-as-a-contract|Undefined Behavior as a Contract]].

**[C++ Core Guidelines](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines)**. The guidance maintained alongside the standard, useful for the reasoning attached to each rule rather than the rules themselves.

Cited by [[cs/languages/common/errors-as-values-vs-control-flow|Errors as Values vs Control Flow]], [[cs/languages/common/memory-ownership-refcounting-gc|Memory, Ownership, Refcounting, GC]].

**[The Python documentation](https://docs.python.org/3/)**. CPython's reference, cited across the comparative language notes for the C API, the garbage collector, asyncio, unicode handling, and numeric types.

Cited by [[cs/languages/common/c-abi-and-ffi|The C ABI and FFI]], [[cs/languages/common/memory-ownership-refcounting-gc|Memory, Ownership, Refcounting, GC]], [[cs/languages/common/concurrency-in-practice|Concurrency in Practice]], [[cs/languages/common/text-encoding-and-unicode|Text Encoding and Unicode]], [[cs/languages/common/numeric-types-and-overflow-semantics|Numeric Types and Overflow Semantics]], [[cs/languages/common/serialization-and-wire-formats|Serialization and Wire Formats]], [[cs/languages/common/errors-as-values-vs-control-flow|Errors as Values vs Control Flow]].

### Security tooling and guidance

**[OWASP Cheat Sheet Series](https://github.com/OWASP/CheatSheetSeries)**. Concise, maintained, implementation-level guidance per application-security topic. Cited where a defense needs a current recommended parameter rather than a principle.

Cited by [[cs/security/password-hashing-and-salting|Password Hashing and Salting]].

**[OSS-Fuzz](https://google.github.io/oss-fuzz/)**. Continuous fuzzing infrastructure for open-source projects, and the clearest public demonstration that fuzzing is an ongoing service rather than a one-time test.

Cited by [[cs/security/fuzzing|Fuzzing]].

## Related Notes

- [[cs/resources/index|Resources]]
- [[cs/resources/books|Books]]
- [[cs/resources/papers|Papers]]
- [[cs/resources/courses|Courses]]

## Sources

- scikit-learn. https://scikit-learn.org/stable/ . Title "scikit-learn: machine learning in Python".
- scikit-learn. https://scikit-learn.org/stable/modules/svm.html . Title "1.4. Support Vector Machines", confirming the cited module page.
- Keras. https://keras.io/ . Title "Keras: Deep Learning for humans".
- Stanford NLP. https://nlp.stanford.edu/projects/glove/ . Title "GloVe: Global Vectors for Word Representation".
- LLVM. https://llvm.org/docs/LangRef.html . Title "LLVM Language Reference Manual".
- Clang. https://clang.llvm.org/docs/ControlFlowIntegrity.html . Title "Control Flow Integrity".
- LLVM Project Blog. https://blog.llvm.org/2011/05/what-every-c-programmer-should-know.html . The post cited by the undefined-behavior note.
- isocpp. https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines . Title "C++ Core Guidelines".
- OWASP. https://github.com/OWASP/CheatSheetSeries . Repository title and its description of the Cheat Sheet Series as a concise collection of high value information on specific application security topics.
- Google. https://google.github.io/oss-fuzz/ . Title "OSS-Fuzz".

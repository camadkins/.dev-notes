---
title: Proper Tail Calls and the Loop Question
description: "Why Racket has no loop primitive, what the Scheme standard actually requires, and why there is no such thing as stack overflow."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-06-17
updated:
aliases:
  - Tail Call Optimization in Racket
  - Proper Tail Recursion
  - Racket Tail Position
---

Racket ships `for`, `for/list`, `for/fold`, and a dozen relatives, and none of them are primitives. Every one expands into a recursive local function. That is not a stylistic preference from the Lisp tradition; it is the direct consequence of a space guarantee written into the language standard, and it changes what a programmer is allowed to worry about.

> [!note] The idea
> Tail-call handling in Scheme is a promise about memory, not a compiler optimization that may or may not fire. Implementations of Scheme are required to be properly tail-recursive, meaning the implementation supports an unbounded number of active tail calls, and Racket's own framing is blunter: tail-position specifications provide a guarantee about the asymptotic space consumption of a computation. Once the guarantee holds, a loop construct has nothing left to offer, because the thing loops exist to avoid, unbounded control-context growth, is already impossible. So Racket does not have a loop primitive. It has a macro that writes the recursion for you.

## What the standard requires, precisely

The definition turns on the word "active". A Scheme implementation is properly tail-recursive if it supports an unbounded number of active tail calls, and a call is active if the called procedure may still return. The standard then adds the clause that makes this harder than it looks: this includes calls that may be returned from either by the current continuation or by continuations captured earlier by `call-with-current-continuation` and later invoked. [[cs/languages/Racket/continuations-and-call-cc|A stashed continuation keeps its calls alive]], so an implementation cannot simply reclaim a frame the moment control leaves it. Only in the absence of captured continuations do calls return at most once, making the active calls exactly the ones that have not yet returned.

The rationale explains why the guarantee costs nothing. Intuitively, no space is needed for an active tail call because the continuation that is used in the tail call has the same semantics as the continuation passed to the procedure containing the call. An improper implementation might allocate a new continuation for the call, but a return to that new continuation would be followed immediately by a return to the original one. A properly tail-recursive implementation returns to that continuation directly. The frame that a naive implementation would push is provably a no-op, so declining to push it is not an optimization so much as a refusal to do dead work.

Racket's Reference gives the local test. An expression is in tail position with respect to an enclosing expression if, whenever it becomes a redex, its continuation is the same as the enclosing expression's continuation. `(+ 1 1)` is not in tail position in `(- 4 (+ 1 1))`, because reducing it happens under the continuation `C[(- 4 [])]`. It is in tail position in `(if (zero? 0) (+ 1 1) 3)`, because the reduction steps for `if` do not depend on the surrounding continuation at all. The "then" branch of an `if` form is always in tail position with respect to the `if`, and so is the "else" branch. Tail positions are specified form by form, which is why the property is checkable by reading rather than by benchmarking.

## The historical accident that made it central

The R5RS rationale records where this came from, and it is a good example of a language feature discovered rather than designed. Proper tail recursion was one of the central ideas in Steele and Sussman's original version of Scheme. Their first Scheme interpreter implemented both functions and actors. Control flow was expressed using actors, which differed from functions in that they passed their results on to another actor instead of returning to a caller, so in the terminology of tail calls, each actor finished with a tail call to another actor. Then came the observation that collapsed the design: Steele and Sussman later observed that in their interpreter the code for dealing with actors was identical to that for functions and thus there was no need to include both in the language. [[cs/history/lisp-and-functional-programming|The unification of message passing and procedure calling]] is the same event as the birth of the tail-call guarantee.

## Constant space, shown rather than asserted

The Guide's worked example is worth reproducing because it makes the space argument visible in the reduction sequence. A naive length function stacks up pending additions:

```racket
(my-length (list "a" "b" "c"))
= (+ 1 (+ 1 (+ 1 (my-length (list)))))
```

Rewritten with an accumulator, nothing is pending:

```racket
(define (my-length lst)
  (define (iter lst len)
    (cond [(empty? lst) len]
          [else (iter (rest lst) (+ len 1))]))
  (iter lst 0))
```

Now evaluation is `(iter (list "a" "b" "c") 0)`, then `(iter (list "b" "c") 1)`, then `(iter (list "c") 2)`, then `3`. The revised version runs in constant space, just as the evaluation steps suggest, because when the result of one call is exactly the result of another call, the first does not have to wait around for the second. The Guide is careful about the vocabulary: this behavior is sometimes called tail-call optimization, but in Racket it is not merely an optimization, it is a guarantee about the way the code will run. More precisely, an expression in tail position with respect to another expression does not take extra computation space over the other expression. That is a statement about [[cs/dsa/space-complexity|asymptotic space]], not about speed.

## Where the loop went

Write the mapping function with `for/list` instead of by hand, and the `for/list` form expands to essentially the same code as the local accumulator definition and use. The difference is merely syntactic convenience. Iteration is just a special case of recursion, and in Racket the special case gets no special machinery.

Compare the situation the guarantee removes. In many languages it is important to fit as many computations as possible into iteration form; otherwise performance will be bad, and moderately large inputs can lead to stack overflow. A programmer in such a language carries a permanent background obligation to convert recursion into loops. In Racket that obligation shrinks to a narrow one: it is sometimes important to make sure tail recursion is used to avoid linear space consumption when the computation is easily performed in constant space.

> [!warning] The systems fact underneath
> Recursion does not lead to particularly bad performance in Racket, and there is no such thing as stack overflow. You can run out of memory if a computation involves too much context, but exhausting memory typically requires orders of magnitude deeper recursion than would trigger a stack overflow in other languages. Read the resource named in that sentence: memory, not a stack region. The ceiling on how much control context a Racket computation may hold is set by [[cs/systems/virtual-memory|the address space and the memory behind it]], not by a guard page sitting a few megabytes below a thread's stack base. Those two ceilings differ by orders of magnitude, which is exactly the gap the Guide reports. That single implementation choice is why a Racket programmer never asks how deep the recursion goes, and why a C programmer must.

The behavioral consequence is a different default. These considerations, combined with the fact that tail-recursive programs automatically run the same as a loop, lead Racket programmers to embrace recursive forms rather than avoid them. A function that removes consecutive duplicates gets written as [[cs/dsa/recursion|the plain recursion that matches the problem]], with a non-tail `cons` in one branch, and nobody rewrites it into a loop with a remembered previous element. It consumes linear space, which is fine, because the output is linear too.

## Related Notes

- [[cs/dsa/recursion|Recursion]] - the shape Racket programmers reach for by default, and why they can
- [[cs/dsa/space-complexity|Space Complexity]] - the resource the tail-call guarantee is a promise about
- [[cs/systems/virtual-memory|Virtual Memory]] - the address space that bounds a heap-allocated control context instead of a fixed stack
- [[cs/history/lisp-and-functional-programming|Lisp and Functional Programming]] - the actors-and-functions collapse that produced the guarantee
- [[cs/languages/Racket/continuations-and-call-cc|Continuations and call/cc]] - why "active" is subtler than "not yet returned"
- [[cs/pl/continuations-cps|Continuations and CPS]] - the transformation under which every call becomes a tail call

## Sources

- "Revised^5 Report on the Algorithmic Language Scheme, section 3.5," schemers.org. https://schemers.org/Documents/Standards/R5RS/HTML/r5rs-Z-H-6.html . Supports the requirement that implementations be properly tail-recursive, the unbounded-active-tail-calls definition, the definition of an active call, the clause about continuations captured by `call-with-current-continuation`, the no-space-needed rationale and direct return to the original continuation, and the Steele and Sussman actors history.
- "1.1 Evaluation Model," The Racket Reference. https://docs.racket-lang.org/reference/eval-model.html . Supports the definition of tail position with respect to an enclosing expression, the `(- 4 (+ 1 1))` and `if` examples, both `if` branches being in tail position, and tail-position specifications guaranteeing asymptotic space consumption.
- "2.3 Lists, Iteration, and Recursion," The Racket Guide. https://docs.racket-lang.org/guide/Lists__Iteration__and_Recursion.html . Supports the accumulator rewrite running in constant space, the guarantee-not-optimization framing, the space statement about tail position, `for/list` expanding to the same code as the hand-written accumulator, iteration as a special case of recursion, the stack-overflow contrast with other languages, the absence of stack overflow in Racket, and the resulting preference for recursive forms.

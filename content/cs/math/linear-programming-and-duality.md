---
title: Linear Programming and Duality
description: "Standard form, the feasible region as a polytope, simplex versus interior-point, and the dual problem that turns an optimality claim into something you can check."
draft: false
comments: true
tags:
  - cs
  - math
  - optimization
date: 2026-07-08
updated:
aliases:
  - linear-programming
  - lp-duality
  - simplex-method
  - feasible-region
---

## Best Answer, Linear Rules

"Linear programming (LP), also called linear optimization, is a method to achieve the best outcome (such as maximum profit or lowest cost) in a mathematical model whose requirements and objective are represented by linear relationships." Sharpened: it "is a technique for the optimization of a linear objective function, subject to linear equality and linear inequality constraints."

The reason this is a subject rather than a footnote is the size of the search space it disposes of. "Dantzig's original example was to find the best assignment of 70 people to 70 jobs. The computing power required to test all the permutations to select the best assignment is vast; the number of possible configurations exceeds the number of particles in the observable universe. However, it takes only a moment to find the optimum solution by posing the problem as a linear program and applying the simplex algorithm. The theory behind linear programming drastically reduces the number of possible solutions that must be checked."

> [!note] The idea
> The result worth carrying out of this topic is not that LP is fast, it is that LP hands you a *certificate*. "Every linear programming problem, referred to as a primal problem, can be converted into a dual problem, which provides an upper bound to the optimal value of the primal problem." Any feasible point of the dual bounds the primal from above, "the principle of weak duality," and the bound closes exactly at the optimum: "the strong duality theorem states that this bound is in fact tight: if the primal has an optimal solution, x*, then the dual also has an optimal solution, y*, and cTx*=bTy*." So a claim of optimality stops being "my solver said so" and becomes a checkable pair of numbers. That is rare. Most optimization gives you an answer with no independent way to verify it is the best one.

## Standard Form

"Standard form is the usual and most intuitive form of describing a linear programming problem. It consists of the following three parts:" a linear or affine function to be maximized, problem constraints written as inequalities, and non-negative variables. Collapsed into matrices, "the problem is usually expressed in matrix form, and then becomes:"

$$\max\{\,\mathbf{c}^{\mathsf{T}}\mathbf{x} \mid \mathbf{x} \in \mathbb{R}^{n} \land A\mathbf{x} \leq \mathbf{b} \land \mathbf{x} \geq 0\,\}$$

The restriction to maximization with $\leq$ constraints and non-negative variables costs nothing. "Other forms, such as minimization problems, problems with constraints on alternative forms, and problems involving negative variables can always be rewritten into an equivalent problem in standard form," and "there is a straightforward process to convert any linear program into one in standard form, so using this form of linear programs results in no loss of generality."

## The Feasible Region Is a Polytope

Everything about how LP is solved follows from the shape the constraints cut out. "Its feasible region is a convex polytope, which is a set defined as the intersection of finitely many half spaces, each of which is defined by a linear inequality. Its objective function is a real-valued affine (linear) function defined on this polytope. A linear programming algorithm finds a point in the polytope where this function has the largest (or smallest) value if such a point exists."

Linearity gives the geometry for free. "A linear function is a convex function, which implies that every local minimum is a global minimum; similarly, a linear function is a concave function, which implies that every local maximum is a global maximum." No local traps exist to worry about, which is the same guarantee [[convexity-and-optimization-basics|convexity]] provides in the general case, here holding automatically.

Two ways the problem can have no answer, and both are structural rather than numerical. "First, if the constraints are inconsistent, then no feasible solution exists: For instance, the constraints x ≥ 2 and x ≤ 1 cannot be satisfied jointly; in this case, we say that the LP is infeasible. Second, when the polytope is unbounded in the direction of the gradient of the objective function (where the gradient of the objective function is the vector of the coefficients of the objective function), then no optimal value is attained because it is always possible to do better than any finite value of the objective function."

When an answer does exist, it is on the boundary. "If a feasible solution exists and if the constraint set is bounded, then the optimum value is always attained on the boundary of the constraint set, by the maximum principle for convex functions (alternatively, by the minimum principle for concave functions) since linear functions are both convex and concave." The corners get a name of their own: "the vertices of the polytope are also called basic feasible solutions."

That is the reduction that makes LP computational. "It can be shown that for a linear program in standard form, if the objective function has a maximum value on the feasible region, then it has this value on (at least) one of the extreme points. This in itself reduces the problem to a finite computation since there is a finite number of extreme points, but the number of extreme points is unmanageably large for all but the smallest linear programs." An infinite search becomes a finite one, and the finite one is still hopeless by brute force. The algorithms exist to close that second gap.

## Simplex Walks the Edges

"The simplex algorithm, developed by George Dantzig in 1947, solves LP problems by constructing a feasible solution at a vertex of the polytope and then walking along a path on the edges of the polytope to vertices with non-decreasing values of the objective function until an optimum is reached for sure."

The walk is justified by a local fact with a global consequence. "If an extreme point is not a maximum point of the objective function, then there is an edge containing the point so that the value of the objective function is strictly increasing on the edge moving away from the point. If the edge is finite, then the edge connects to another extreme point where the objective function has a greater value, otherwise the objective function is unbounded above on the edge and the linear program has no solution." Standing at a vertex and finding no improving edge is therefore proof of optimality, not merely absence of evidence. Termination is easy: "the algorithm always terminates because the number of vertices in the polytope is finite."

Getting started is its own subproblem. "In the first step, known as Phase I, a starting extreme point is found. Depending on the nature of the program this may be trivial, but in general it can be solved by applying the simplex algorithm to a modified version of the original program. The possible results of Phase I are either that a basic feasible solution is found or that the feasible region is empty. In the latter case the linear program is called infeasible."

The performance story is the interesting part, because practice and worst case disagree loudly. "In practice, the simplex algorithm is quite efficient and can be guaranteed to find the global optimum if certain precautions against cycling are taken," and it "has been proved to solve 'random' problems efficiently, i.e. in a cubic number of steps, which is similar to its behavior on practical problems." Yet "the simplex algorithm has poor worst-case behavior: Klee and Minty constructed a family of linear programming problems for which the simplex method takes a number of steps exponential in the problem size." A widely deployed algorithm with an exponential worst case is a useful thing to have seen once, because it makes the point that worst-case analysis and deployment decisions answer different questions.

One piece of trivia that saves confusion later: "the name of the algorithm is derived from the concept of a simplex and was suggested by T. S. Motzkin. Simplices are not actually used in the method."

## Interior Point Cuts Through the Middle

Polynomial-time solvability arrived separately from practical speed. "The linear programming problem was first shown to be solvable in polynomial time by Leonid Khachiyan in 1979, but a larger theoretical and practical breakthrough in the field came in 1984 when Narendra Karmarkar introduced a new interior-point method for solving linear-programming problems." Khachiyan's ellipsoid method settled the complexity question without displacing simplex: "the algorithm was not a computational break-through, as the simplex method is more efficient for all but specially constructed families of linear programs."

The geometric contrast is the whole distinction. "In contrast to the simplex algorithm, which finds an optimal solution by traversing the edges between vertices on a polyhedral set, interior-point methods move through the interior of the feasible region." Karmarkar's method "improved on Khachiyan's worst-case polynomial bound," and today "the current opinion is that the efficiencies of good implementations of simplex-based methods and interior point methods are similar for routine applications of linear programming."

A basic question about LP is still open. "While algorithms exist to solve linear programming in weakly polynomial time, such as the ellipsoid methods and interior-point techniques, no algorithms have yet been found that allow strongly polynomial-time performance in the number of constraints and the number of variables." The question of whether LP admits a strongly polynomial-time algorithm "has been cited by Stephen Smale as among the 18 greatest unsolved problems of the 21st century."

## What Duality Gives You

The dual is mechanical to write down. For the primal "Maximize cTx subject to Ax ≤ b, x ≥ 0," the "corresponding symmetric dual problem" is "Minimize bTy subject to ATy ≥ c, y ≥ 0." The transformation is an involution: "a fundamental idea of duality theory is the fact that (for the symmetric dual) the dual of a dual linear program is the original primal linear program."

The dual variables are not arbitrary bookkeeping. "The dual variables y may be understood as coefficients in a linear combination of inequalities from the primal problem, formed in the hope of obtaining a bound on the objective function. Such coefficients need to be nonnegative, since otherwise inequalities would become reversed." Combining constraints to squeeze the objective from above *is* the dual problem, made explicit.

The general principle is broader than LP. "In mathematical optimization theory, duality or the duality principle is the principle that optimization problems may be viewed from either of two perspectives, the primal problem or the dual problem. If the primal is a minimization problem then the dual is a maximization problem (and vice versa)." Outside the linear case the two need not meet: "in general, the optimal values of the primal and dual problems need not be equal. Their difference is called the duality gap. For convex optimization problems, the duality gap is zero under a constraint qualification condition. This fact is called strong duality."

Duality also classifies the degenerate cases. "If the primal is unbounded then the dual is infeasible by the weak duality theorem. Likewise, if the dual is unbounded, then the primal must be infeasible. However, it is possible for both the dual and the primal to be infeasible."

> [!example]
> Suppose a solver returns $\mathbf{x}$ with objective value 120 and claims it is optimal. Weak duality says any feasible dual point $\mathbf{y}$ gives $\mathbf{b}^{\mathsf{T}}\mathbf{y}$ as "an upper bound on the value of the primal objective function cTx at any feasible primal point x." So produce a feasible $\mathbf{y}$ with $\mathbf{b}^{\mathsf{T}}\mathbf{y} = 120$ and the claim is settled: nothing feasible can exceed 120, and something feasible attains it. Strong duality guarantees such a $\mathbf{y}$ exists whenever the primal has an optimum, since at optimality "cTx*=bTy*."
>
> You do not even have to solve the dual separately. "It is possible to obtain an optimal solution to the dual when only an optimal solution to the primal is known using the complementary slackness theorem," whose content is a pairing rule: "if the i-th slack variable of the primal is not zero, then the i-th variable of the dual is equal to zero. Likewise, if the j-th slack variable of the dual is not zero, then the j-th variable of the primal is equal to zero." A non-binding constraint prices at zero, and a positively priced constraint must be tight.

## Where It Lands in Computing

LP shows up in two distinct modes. As a direct model: "industries that use linear programming models include transportation, energy, telecommunications, and manufacturing. It has proven useful in modeling diverse types of problems in planning, routing, scheduling, assignment, and design," with one unexpectedly specific instance on record: "Google also uses linear programming to stabilize YouTube videos."

As a subroutine, it is load-bearing for algorithm design. "Certain special cases of linear programming, such as network flow problems and multicommodity flow problems, are considered important enough to have much research on specialized algorithms. A number of algorithms for other types of optimization problems work by solving linear programming problems as sub-problems." The relaxation pattern is the one to know: "covering and packing LPs commonly arise as a linear programming relaxation of a combinatorial problem and are important in the study of approximation algorithms. For example, the LP relaxations of the set packing problem, the independent set problem, and the matching problem are packing LPs. The LP relaxations of the set cover problem, the vertex cover problem, and the dominating set problem are also covering LPs."

Historically the influence runs wider than the technique. "Ideas from linear programming have inspired many of the central concepts of optimization theory, such as duality, decomposition, and the importance of convexity and its generalizations."

> [!warning]
> Adding one word to the problem statement changes its complexity class. "If all of the unknown variables are required to be integers, then the problem is called an integer programming (IP) or integer linear programming (ILP) problem. In contrast to linear programming, which can be solved efficiently in the worst case, integer programming problems are in many practical situations (those with bounded variables) NP-hard." Even the binary restriction does not help: 0-1 integer programming "is also classified as NP-hard, and in fact the decision version was one of Karp's 21 NP-complete problems." The polytope's vertices happen to be where LP optima live, but there is no reason those vertices have integer coordinates, and demanding that they do is what breaks the tractability.

## Related Notes

- [[convexity-and-optimization-basics|Convexity and Optimization Basics]] - the general convex setting where local optima are global and duality gaps close
- [[matrices-and-linear-transformations|Matrices and Linear Transformations]] - the matrix form the constraints and the dual transpose live in
- [[linear-algebra-fundamentals|Linear Algebra Fundamentals]] - vectors, half spaces, and the algebra behind basic feasible solutions
- [[greedy-algorithms|Greedy Algorithms]] - a different local-improvement strategy, without the polytope guarantee that makes simplex terminate correctly
- [[dynamic-programming|Dynamic Programming]] - the other standard route from an exponential search space to a tractable one
- [[graph-theory|Graph Theory]] - the source of the flow, matching, and covering problems LP relaxations attack

## Sources

- [Linear programming (Wikipedia)](https://en.wikipedia.org/wiki/Linear_programming) - the definition and standard form, Dantzig's 70-by-70 assignment example, the feasible region as a convex polytope, infeasible and unbounded cases, vertices as basic feasible solutions, the simplex algorithm's edge walk and its practical-versus-worst-case performance including the Klee and Minty family, the interior-point line with the Khachiyan and Karmarkar milestones, the strongly-polynomial open problem, primal and dual formulations with weak and strong duality, complementary slackness, covering and packing relaxations, applications by industry, and the NP-hardness of integer programming.
- [Simplex algorithm (Wikipedia)](https://en.wikipedia.org/wiki/Simplex_algorithm) - the name's origin and the fact that simplices are not used in the method, conversion to standard form without loss of generality, the optimum being attained at an extreme point, the improving-edge argument, finite termination, and the Phase I and Phase II split.
- [Duality (optimization) (Wikipedia)](https://en.wikipedia.org/wiki/Duality_%28optimization%29) - the primal and dual perspectives, weak duality as a bound, and the duality gap that vanishes under strong duality for convex problems.

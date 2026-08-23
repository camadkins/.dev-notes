---
title: The Import System
description: "What an import statement actually does, the sys.modules cache that makes circular imports survivable, sys.path and the path based finder, and why absolute became the default."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-01-22
updated:
aliases:
  - Python Imports
  - sys.modules
  - Relative Imports
---

The `import` statement combines two operations; it searches for the named module, then it binds the results of that search to a [[cs/pl/scoping-binding-and-closures|name in the local scope]]. Those two halves are separable in the machinery. The search operation is defined as a call to the `__import__()` function, and the return value of `__import__()` is used to perform the name binding operation. A direct call to `__import__()` performs only the module search and, if found, the module creation operation, and only the `import` statement performs a name binding operation.

That separation is why `import` behaves less like a directive and more like a function call whose result gets assigned. It is also why side effects happen even when nothing is bound: certain side-effects may occur from a direct `__import__()` call, such as the importing of parent packages and the updating of various caches including `sys.modules`.

> [!note] The idea
> The import system is a *cache-first* protocol, not a file loader. The first place checked during import search is `sys.modules`, and the module object is placed in that cache **before** the loader executes the module's code. Everything people find mysterious about imports, circular imports partially working, a failed import leaving no trace while a partially loaded module leaves its dependencies behind, re-importing after deleting a cache key producing a different object, falls out of that single ordering decision.

## Modules, packages, and the `__path__` attribute

Python has only one type of module object, and all modules are of this type, regardless of whether the module is implemented in Python, C, or something else. Packages are an organizing layer on top: all packages are modules, but not all modules are packages. The membership test is mechanical. Specifically, any module that contains a `__path__` attribute is considered a package.

Subpackage names are separated from their parent package name by a dot, akin to Python's standard attribute access syntax, giving names like `email.mime.text`. The reference offers the [[cs/systems/file-systems|file system]] analogy (packages as directories, modules as files) while warning not to take it too literally, since packages and modules need not originate from the file system.

There are two kinds. A regular package is typically implemented as a directory containing an `__init__.py` file, and when a regular package is imported, this `__init__.py` file is implicitly executed and the objects it defines are bound to names in the package's namespace. Importing `parent.one` will implicitly execute `parent/__init__.py` and then `parent/one/__init__.py`.

A namespace package is a composite of various portions, where each portion contributes a subpackage to the parent package, and portions may reside in different locations on the file system, in zip files, on the network, or anywhere else Python searches during import. There is no `parent/__init__.py`, and in fact there may be multiple parent directories found during import search, each provided by a different portion, so `parent/one` may not be physically located next to `parent/two`. Namespace packages do not use an ordinary list for `__path__`; they use a custom iterable type which will automatically perform a new search for package portions on the next import attempt if the parent's path (or `sys.path` for a top level package) changes. A subdirectory inside a regular package that does not contain an `__init__.py` is treated as an implicit namespace subpackage rooted in that parent.

## The search, in the order it happens

Python needs the fully qualified name to begin. If that name is a dotted path like `foo.bar.baz`, Python first tries to import `foo`, then `foo.bar`, and finally `foo.bar.baz`, and if any of the intermediate imports fail, a `ModuleNotFoundError` is raised. Importing a leaf drags in every ancestor.

The first place checked is `sys.modules`, a cache of all modules that have been previously imported, including the intermediate paths. So if `foo.bar.baz` was previously imported, `sys.modules` will contain entries for `foo`, `foo.bar`, and `foo.bar.baz`. Three outcomes: if the name is present the associated value is the module satisfying the import and the process completes; if the value is `None`, a `ModuleNotFoundError` is raised; if the name is missing, Python continues searching.

The cache is writable, and the reference is careful about what that does and does not accomplish. Deleting a key may not destroy the associated module, as other modules may hold references to it, but it invalidates the cache entry, causing Python to search anew on next import. Assigning `None` to a key forces the next import to raise `ModuleNotFoundError`. The trap is stated plainly: if you keep a reference to the module object, invalidate its cache entry, and re-import, the two module objects will not be the same. `importlib.reload()` is the alternative that will reuse the same module object and simply reinitialise the module contents by rerunning the module's code.

If the module is not in `sys.modules`, the finder/loader protocol runs. A finder's job is to determine whether it can find the named module using whatever strategy it knows about, and finders do not actually load modules; if they can find the named module, they return a module spec, an encapsulation of the module's import-related information. Python includes several defaults: the first knows how to locate built-in modules, the second frozen modules, and a third searches an import path.

## sys.path and the path based finder

The third default finder is the path based finder, which searches an import path containing a list of path entries, each naming a location to search for modules. The path based finder itself does not know how to import anything; it traverses the individual path entries, associating each with a path entry finder that knows how to handle that particular kind of path. The default set of path entry finders implement all the semantics for finding modules on the file system, handling Python source (`.py`), Python byte code (`.pyc`), and shared libraries such as `.so` files, and when supported by `zipimport`, loading all of these except shared libraries from zipfiles.

`sys.path` contains a list of strings providing search locations for modules and packages, initialized from the `PYTHONPATH` environment variable and various other installation- and implementation-specific defaults. Entries can name directories on the file system, zip files, and potentially other locations such as URLs or database queries. Only strings should be present on `sys.path`; all other data types are ignored.

The relationship between `sys.path` and a package's `__path__` is a substitution rule. When the `path` argument to `find_spec()` is given, it will be a list of string paths to traverse, typically a package's `__path__` attribute for an import within that package, and if the `path` argument is `None`, this indicates a top level import and `sys.path` is used. A package's `__path__` is the `sys.path` for names inside it.

Searching for the right path entry finder for a path entry can be expensive, with `stat()` call overheads, so the path based finder maintains a cache mapping path entries to path entry finders in `sys.path_importer_cache`. Despite the name, that cache stores finder objects rather than being limited to importer objects. User code is free to remove entries, forcing the search again. This is the same namespacing-and-resolution problem covered generally in [[cs/languages/common/module-systems-and-namespacing|module systems and namespacing]], with Python's answer being a mutable runtime list rather than a [[cs/pl/modules-signatures-and-separate-compilation|compile-time resolution]].

## What happens on first import

The reference gives an approximation of the loading portion in pseudo-code, and four of its accompanying notes carry the operational weight.

If there is an existing module object with the given name in `sys.modules`, import will have already returned it. The module will exist in `sys.modules` before the loader executes the module code, and the stated reason is exactly the one that matters: this is crucial because the module code may (directly or indirectly) import itself, and adding it to `sys.modules` beforehand prevents unbounded recursion in the worst case and multiple loading in the best.

If loading fails, the failing module, and only the failing module, gets removed from `sys.modules`. Any module already in the cache, and any module that was successfully loaded as a side-effect, must remain in the cache. That contrasts with reloading, where even the failing module is left in `sys.modules`.

After the module is created but before execution, the import machinery sets the import-related module attributes. Then module execution is the key moment of loading in which the module's namespace gets populated, and execution is entirely delegated to the loader, which gets to decide what gets populated and how.

One consequence people meet as a surprise: when a submodule is loaded by any mechanism, a binding is placed in the parent module's namespace to the submodule object. If `spam/__init__.py` contains `from .foo import Foo`, then after `import spam`, both `spam.foo` (the module) and `spam.Foo` (the class) are bound. The reference concedes this might seem surprising given Python's familiar name binding rules, but calls it a fundamental feature: the invariant is that if you have `sys.modules['spam']` and `sys.modules['spam.foo']`, the latter must appear as the `foo` attribute of the former.

> [!example] Tracing a self-referential import against the documented ordering
> Module `a` imports `b`; `b` imports `a`. Importing `a` places `a` in `sys.modules` before the loader executes `a`'s code, which the reference says is crucial precisely because the module code may directly or indirectly import itself. `a`'s code then runs and reaches `import b`, so `b` is placed in `sys.modules` and `b`'s code runs. When `b` reaches `import a`, the search stops at the cache: if there is an existing module object with the given name in `sys.modules`, import will have already returned it. That is the documented mechanism by which adding it to `sys.modules` beforehand prevents unbounded recursion in the worst case and multiple loading in the best. What the cache guarantees is the *object*, not its contents, because module execution is the key moment of loading in which the module's namespace gets populated and `a`'s execution is still in progress.

## Absolute by default, relative by dots

Relative imports use leading dots. A single leading dot indicates a relative import starting with the current package, and two or more leading dots indicate a relative import to the parent(s) of the current package, one level per dot after the first. Given a package containing `subpackage1/moduleX.py`, valid relative imports from inside it include `from .moduleY import spam`, `from . import moduleY`, `from ..subpackage2.moduleZ import eggs`, and `from ..moduleA import foo`.

Absolute imports may use either the `import <>` or `from <> import <>` syntax, but relative imports may only use the second form, and the reference gives the reason: `import XXX.YYY.ZZZ` should expose `XXX.YYY.ZZZ` as a usable expression, but `.moduleY` is not a valid expression.

The default was not always absolute. PEP 328 identified the ambiguity: in Python 2.4 and earlier, reading a module located inside a package, it is not clear whether `import foo` refers to a top-level module or to another module inside the package, and more precisely, a local module or package can shadow another hanging directly off `sys.path`. The PEP's account of the growing cost is worth quoting in spirit: as Python's library expands, more and more existing package internal modules suddenly shadow standard library modules by accident, and it is a particularly difficult problem inside packages because there is no way to specify which module is meant.

The resolution was that `foo` will always be a module or package reachable from `sys.path`, which is what "absolute import" means. The python-dev community chose absolute imports as the default because they are the more common use case and because absolute imports can provide all the functionality of relative (intra-package) imports, albeit at the cost of difficulty when renaming package pieces higher up in the hierarchy or when moving one package inside another. Because it changed semantics, absolute imports were optional in Python 2.5 and 2.6 through `from __future__ import absolute_import`.

Relative imports survived on their own merits. The most important use case presented was being able to rearrange the structure of large packages without having to edit sub-packages, plus the point that a module inside a package cannot easily import itself without relative imports. There was agreement that relative imports will require listing specific names to import, so `import foo` as a bare term will always be an absolute import.

> [!warning] The tradeoff is stated in the PEP and it is real
> Absolute imports cost you when renaming package pieces higher up in the hierarchy or moving one package inside another, because every absolute path inside the package names the old location. Relative imports cost you readability and portability of individual modules. The dot-counting complaint is not new either; PEP 328 records many complaints about the difficulty of counting dots among the objections raised during the spelling debate.

## Related Notes

- [[cs/languages/common/module-systems-and-namespacing|Module Systems and Namespacing]] - the general design space Python's runtime-mutable `sys.path` sits in
- [[cs/pl/modules-signatures-and-separate-compilation|Modules, Signatures, and Separate Compilation]] - what a module system looks like when resolution happens at compile time instead
- [[cs/languages/common/build-systems-and-dependency-management|Build Systems and Dependency Management]] - where the entries on `sys.path` come from in practice
- [[cs/pl/scoping-binding-and-closures|Scoping, Binding, and Closures]] - the name binding half of what `import` does
- [[cs/languages/Python/decorators|Decorators in Python]] - why a decorator that does work at definition time turns an import into a side effect

## Sources

- "5. The import system," The Python Language Reference. https://docs.python.org/3/reference/import.html . Supports the search-plus-bind decomposition of `import` and the `__import__()` split with its side effects, the single module type and `__path__` as the package test, dotted subpackage naming and the directory analogy caveat, regular packages and implicit `__init__.py` execution, namespace packages and their portions and custom `__path__` iterable, the intermediate-import walk and `ModuleNotFoundError`, the full `sys.modules` cache semantics including the `None` value, writability, non-destruction on delete, the differing-object trap, and `importlib.reload()`, the finder/loader split and module specs, the default finders, the path based finder and path entry finders with the handled file types and zipimport, the `sys.path` initialization from `PYTHONPATH` and strings-only rule, the `find_spec()` `path` argument versus `sys.path` rule, `sys.path_importer_cache` and its `stat()` cost rationale, the four loading notes (existing module returned, module in `sys.modules` before execution and why, only the failing module removed and the reload contrast, attributes set before execution, execution delegated to the loader), the submodule parent-binding invariant with the `spam`/`foo` example, and the relative-import dot rules, the valid-forms list, and the `import <>` versus `from <> import <>` restriction with its expression rationale.
- "PEP 328 - Imports: Multi-Line and Absolute/Relative," Python Enhancement Proposals. https://peps.python.org/pep-0328/ . Supports the pre-2.5 ambiguity of `import foo` inside a package and local modules shadowing modules hanging off `sys.path`, the observation that expanding library growth made package-internal modules accidentally shadow standard library modules with no way to disambiguate, the definition of an absolute import as reachable from `sys.path`, python-dev's rationale for absolute as the default including the renaming and package-nesting cost, the `from __future__ import absolute_import` opt-in for Python 2.5 and 2.6, the relative-import use cases (rearranging large packages without editing sub-packages, a module importing itself), the agreement that relative imports must list specific names so bare `import foo` is always absolute, and the recorded complaints about the difficulty of counting dots.

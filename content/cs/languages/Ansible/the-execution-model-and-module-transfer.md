---
title: The Execution Model and Module Transfer
description: "What actually happens per task: a zipfile assembled on the control node, shipped over the connection, imported as __main__ on the target, and answered with a single JSON document."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-06-19
updated:
aliases: []
---

Most people write Ansible for years without knowing what a task does. The surface reads like a remote procedure call: name a module, give it arguments, get a result. The mechanism is stranger and better than that, and knowing it settles a long list of otherwise arbitrary-seeming behaviors.

Start from the fact that "Ansible is not normally installed on managed nodes." There is no agent, no daemon, no resident library. So a module cannot be called on the target, because it is not there. It has to be delivered first, and modules are exactly that: "the code or binaries that Ansible copies to and executes on each managed node (when needed) to accomplish the action defined in each Task."

> [!note] The idea
> Every task is a software deployment. The control node assembles a self-contained program, ships it over the connection, runs it once, reads one JSON document back, and cleans up. Nothing survives between tasks on the target, which is why state cannot accumulate in the remote process and why every module has to re-discover the world it is acting on. That constraint is the real reason [[cs/languages/common/declarative-models-and-idempotence|idempotence]] must live inside each module rather than in the engine: the engine has no memory on the far side to consult, so "is this already done" can only be answered by code that just arrived and is about to be deleted.

## The path a task takes

The `TaskExecutor` receives the module name and parameters parsed from the playbook and uses the name to decide whether it is looking at a module or an action plugin. If it is a module, it loads the normal action plugin and hands over the name, variables, and task context.

That distinction matters more than the naming suggests. "Action plugins always execute on the control node." Some never touch the target at all: `debug` prints text, and `assert` tests whether values in a playbook satisfy criteria, both entirely local. Others are two-phase. The `template` action plugin renders the file on the control node, transfers it to a temporary file on the remote system, then invokes the `copy` module remotely to move it into place and set permissions. A single `template:` task is therefore one local render, one file transfer, and one remote module run.

For an ordinary module, the normal action plugin is "the primary coordinator of much of the work to actually execute the module on the managed machine." It loads the appropriate connection plugin for the task, adds internal Ansible properties to the parameters, works with the connection, shell, and become plugins to create temporary files on the remote machine and clean them up afterwards, and pushes the module and its parameters to the remote host. Everything transport-specific lives in the connection plugin, which is why the same module works over SSH, over local execution, or over a network device API without knowing which one it got. The default of those transports, and its security properties, is [[cs/security/secure-shell-ssh|SSH]].

## Ansiballz, the part nobody sees

Assembly happens in `executor/module_common.py`, which reads the module and decides its type. New-style Python modules go through the Ansiballz framework, adopted in Ansible 2.1 and used for all of them.

Ansiballz "uses real Python imports of things in `ansible/module_utils` instead of merely preprocessing the module." It constructs a zipfile containing the module file, the `module_utils` files the module imports, and boilerplate to pass in the parameters. Imports are followed transitively: files pulled in from `module_utils` are themselves scanned for further `module_utils` imports. The zipfile is Base64 encoded and wrapped in a small Python script that decodes it, places it in a temp directory on the managed node, extracts the module script, sets `PYTHONPATH` to find the packaged code inside the zip, and imports the module under the name `__main__`. Importing it as `__main__` makes Python treat it as a script rather than a library, which lets the wrapper and the module run in a single copy of Python on the remote machine. Before 2.7 a second interpreter was spawned; the change followed the drop of Python 2.4 support and was made to speed execution up.

One more rewrite happens after assembly: for any module with a shebang, Ansible checks whether the interpreter in that line has a specific path configured through an `ansible_$X_interpreter` inventory variable and substitutes it. That is the whole mechanism behind `ansible_python_interpreter`, and it explains why a module can run under a virtualenv on one host and the system Python on another without any change to the module.

The upshot for anyone who has read [[cs/languages/Python/the-import-system|Python's import system]]: Ansible ships a synthetic package tree per task, built by static import analysis on the control node, mounted on `sys.path` from inside a zip on the target. The reason a module cannot import an arbitrary third-party library is now obvious. Nothing put it in the zip.

## Arguments in, JSON out

Parameters travel as JSON. Under Ansiballz the JSON string is part of the wrapper script, which monkey-patches a private variable in `basic.py` just before importing the module, and `AnsibleModule` parses it into `params`. The docs mark that as an internal implementation detail that has changed before and will change again, so do not read it as a stable contract. Historically, and still under pipelining, the transport for that payload is standard input.

The reasons given for using stdin are a small lesson in [[cs/security/privilege-separation-and-least-privilege|least privilege]]. Combined with pipelining, it keeps the module's arguments off disk on the remote machine. Command line arguments were rejected because "most systems allow unprivileged users to read the full commandline of a process," and environment variables because some systems cap total environment size and could silently truncate parameters.

Pipelining itself is a choice between two transfer strategies: write the module to a temporary file on the remote host and use a second connection to execute it, or pipe the module into the remote interpreter's stdin. It only works for modules written in Python, the one interpreter Ansible knows supports the mode. The non-pipelined path is also why old-style modules are less efficient, since they "must copy a separate file over to the managed node, which is less efficient as it requires two over-the-wire connections instead of only one."

Return data goes the other way as one JSON document on stdout. New-style Python modules get that formatting from `module_utils` boilerplate; the non-native contract states it explicitly, requiring the module to "print its return data as a JSON encoded dictionary to stdout before exiting." A task's entire result, including whether it changed anything, is a single serialized structure of the kind discussed in [[cs/languages/common/serialization-and-wire-formats|serialization and wire formats]], which is what makes `register` possible and what bounds how much a module can tell you.

> [!warning] Everything coming back is treated as hostile
> Returned strings are marked `Unsafe`, and the reason is spelled out: if Ansible templated every returned string, a user with access to a managed node could disguise malicious code as return values, and those strings would then be expanded by Jinja2 on the control node. Marking them emits any Jinja2 templates verbatim instead. The executor audits results a second time when they come back, in case an action plugin forgot. Data flowing from a managed node toward the control node crosses a trust boundary in the wrong direction, and the engine treats it accordingly.

## Related Notes

- [[cs/languages/common/declarative-models-and-idempotence|Declarative Models and Idempotence]] - why the property has to live in the shipped code rather than the engine
- [[cs/languages/Ansible/strategies-linear-free-and-forks|Strategies, linear, free, and forks]] - how many of these transfers happen at once
- [[cs/languages/Ansible/check-mode-and-diff|Check Mode and Diff]] - what the same pipeline does when the module is told not to change anything
- [[cs/security/secure-shell-ssh|The Secure Shell Protocol (SSH)]] - the default transport under the connection plugin
- [[cs/languages/Python/the-import-system|The Import System]] - the loader semantics Ansiballz relies on to run a zip as a script
- [[cs/security/insecure-deserialization|Insecure Deserialization]] - the class of attack the Unsafe marking of returned strings is defending against

## Sources

- "Ansible module architecture," Ansible Community Documentation. https://docs.ansible.com/ansible/latest/dev_guide/developing_program_flow_modules.html . Supports the TaskExecutor's module-versus-action-plugin decision, action plugins always executing on the control node with `debug` and `assert` as fully local examples, the `template` action plugin's local render plus remote `copy` invocation, the normal action plugin's role and its connection, temporary file, and push responsibilities, the Ansiballz zipfile construction with transitive `module_utils` inclusion, Base64 wrapping, `PYTHONPATH`, and `__main__` import, the single-interpreter change in 2.7, shebang interpreter substitution via inventory variables, argument passing through the wrapper and the internal-detail warning, the stdin rationale covering disk, command line, and environment size, pipelining and its Python-only limitation, the two-connection cost of old-style modules, the JSON return contract, and the Unsafe marking of returned strings with its re-audit in the executor.
- "Ansible concepts," Ansible Community Documentation. https://docs.ansible.com/ansible/latest/getting_started/basic_concepts.html . Supports Ansible not normally being installed on managed nodes and the definition of modules as code copied to and executed on each managed node.

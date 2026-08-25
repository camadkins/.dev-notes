---
title: Collections as the Packaging Unit
description: "Namespaces, fully qualified names, and one installed version at a time: what collections changed about Ansible reuse when most of the modules left the core repository in 2.10."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-07-24
updated:
aliases:
  - FQCN
---

In July 2019 the project announced that collections would be the future of Ansible content delivery. Support arrived in 2.9, and in 2.10 "we extracted most modules from the main ansible/ansible repository and placed them in collections." What stayed behind is now called ansible-core, "the code for basic features and functions, such as copying module code to managed nodes." A tool that had shipped thousands of modules in one tree split into an engine and a distribution ecosystem, and every naming decision in modern Ansible follows from that split.

A collection is "a format in which Ansible content is distributed that can contain playbooks, roles, modules, and plugins," and structurally it is undemanding: "a collection is a simple data structure," none of its directories are required, and the only mandatory file is `galaxy.yml` at the root, holding the metadata needed to build, package, and publish the artifact.

> [!note] The idea
> A collection gives Ansible a namespace, and namespaces are all it gives. The `collections:` keyword "merely creates an ordered 'search path' for non-namespaced plugins and role references. It does not install content or otherwise change Ansible's behavior around the loading of plugins or roles." Resolution is by search order over installed directories, and "you can only have one version of a collection installed at a time." So there is no version solving, no diamond to resolve, and no way for two consumers to disagree about which release they get. Compare a language package manager that can vend two versions of the same library into one build. Ansible's answer is that the question cannot be asked, which is simpler to reason about and correspondingly less forgiving when two roles want different releases.

## Fully qualified names, and the search path underneath

The recommended way to reference anything from a collection is its fully qualified collection name, `namespace.collection.resource`, and that form works uniformly for modules, roles, lookups, filters, and playbooks. The `collections:` keyword exists to let you write short names instead, and the documentation hedges it heavily. Roles do not inherit the collections list set by the calling playbook, even when the role sets none of its own. Roles defined inside a collection always implicitly search their own collection first. An FQCN remains required for non-action and non-module plugins such as lookups, filters, and tests. And the general advice is that using an FQCN is preferable to the keyword at all.

What that adds up to is a namespacing scheme whose short form has enough exceptions that the long form is the only reliable one. The problem it solves is the ordinary collision problem set out in [[cs/languages/common/module-systems-and-namespacing|module systems and namespacing]]: two vendors can each publish a module named `user`, so the short name is ambiguous and the qualified name is not.

Two of the names in that scheme are not collections at all. `ansible.builtin` and `ansible.legacy` are "virtually constructed by the core engine (synthetic collections)." `ansible.builtin` refers only to plugins shipping with ansible-core. `ansible.legacy` is a superset that also picks up custom plugins from the configured and adjacent paths, with the ability to override a builtin of the same name. And the detail that matters when reading an old playbook: `ansible.legacy` "is what you get by default when you do not specify an FQCN," so a bare `- shell: echo hi` is really `ansible.legacy.shell`. The unqualified name is not a shortcut for the builtin. It is a shortcut for the overridable one.

## Installation, versions, and trust

`ansible-galaxy collection install` places content in `~/.ansible/collections` under an `ansible_collections` directory by default, and the install command appends that `ansible_collections` component to whatever path you give it. The layout is a filesystem tree of `namespace/collection`, which is what makes the Python importer able to find it.

Version selection uses range identifiers, including `==`, `!=`, and the ordering comparisons, combinable with commas, and "Ansible will always install the most recent version that meets the range identifiers you specify." Pre-releases are ignored by default and require an explicit `==` to install, which is the same precaution described in [[cs/software-engineering/semantic-versioning|semantic versioning]] applied by a client that has no lockfile to fall back on. A `requirements.yml` file collects multiple collections into one command, and `ansible-galaxy` can follow dependencies onto other configured Galaxy instances, so a collection can depend on a collection from a different server.

Signature verification sits on top. The client can check detached GPG signatures against a configured keyring, with a required valid signature count, and specific GnuPG error codes can be ignored individually. If verification is unsuccessful, the collection is not installed. That is a supply chain control of the kind described in [[cs/security/pgp-and-the-web-of-trust|PGP and the web of trust]], with the same load-bearing assumption: the check is only worth what the keyring is worth, and the keyring is configured by the same person running the install.

> [!warning] The importer leaks into the naming rules
> Playbooks distributed in a collection have "a restricted set of valid characters." Names can contain only lowercase alphanumeric characters plus underscore and must start with an alpha character, and the dash is not valid. The reason is stated outright: it "is a limitation of the Python importer that is used to load collection resources," and a playbook whose name breaks the rule is simply not addressable. The naming rules of Ansible's distribution format are inherited from [[cs/languages/Python/the-import-system|Python's import system]], because collection content is loaded as Python packages. The abstraction is thin in exactly the place you would expect it to be thin.

## What changed in practice

Before 2.10, a module either shipped with Ansible or you carried it yourself in `library/`. Release cadence for a vendor's modules was Ansible's release cadence, and a bug fix waited for the next core release. After 2.10, a vendor owns a collection, versions it independently, and ships when ready, while ansible-core keeps the executor, the connection layer, and the plugin loader. Content moved from the release train to the package index, which is the same consolidation every ecosystem eventually performs.

The cost is discovery. Finding a module now means knowing which collection owns it, and the FAQ's answer to "where did this specific module go" is to consult `runtime.yml` for the first destination of each extracted module, then note that "some modules have moved again since then." A namespace answers the collision question. It does not answer the "which namespace" question, and nothing in Ansible does.

## Related Notes

- [[cs/languages/Ansible/role-parameters-and-defaults-as-an-interface|Role Parameters and Defaults as an Interface]] - the unit that collections package and version
- [[cs/languages/common/build-systems-and-dependency-management|Build Systems and Dependency Management]] - what version solving looks like when more than one version can coexist
- [[cs/languages/common/software-supply-chain-and-provenance|Software Supply Chain and Provenance]] - the wider problem the signature checking addresses
- [[cs/software-engineering/semantic-versioning|Semantic Versioning]] - the meaning the range identifiers assume a publisher is honoring
- [[cs/languages/Python/packaging-wheels-and-environments|Packaging, Wheels, and Environments]] - the packaging model of the language collections are loaded by
- [[cs/software-engineering/monorepo-vs-polyrepo|Monorepo vs Polyrepo]] - the split the 2.10 extraction performed, and what it costs discovery

## Sources

- "Frequently Asked Questions," Ansible Community Documentation. https://docs.ansible.com/ansible/latest/reference_appendices/faq.html . Supports the July 2019 announcement, collections support in 2.9 and module extraction in 2.10, ansible-core keeping the basic functions such as copying module code to managed nodes, the `runtime.yml` pointer and later moves, and the synthetic nature of `ansible.builtin` and `ansible.legacy` including the default resolution of unqualified names to legacy.
- "Ansible concepts," Ansible Community Documentation. https://docs.ansible.com/ansible/latest/getting_started/basic_concepts.html . Supports the definition of a collection as a distribution format containing playbooks, roles, modules, and plugins.
- "Collection structure," Ansible Community Documentation. https://docs.ansible.com/ansible/latest/dev_guide/developing_collections_structure.html . Supports a collection being a simple data structure with no required directories and a mandatory `galaxy.yml` carrying build and publish metadata.
- "Using collections in a playbook," Ansible Community Documentation. https://docs.ansible.com/ansible/latest/collections_guide/collections_using_playbooks.html . Supports FQCN references, the `collections:` keyword as an ordered search path only, roles not inheriting the playbook's collections list, collection-internal roles searching their own collection first, FQCN still being required for lookups, filters, and tests, the preference for FQCN, and the restricted character set for collection playbook names with its Python importer cause.
- "Installing collections," Ansible Community Documentation. https://docs.ansible.com/ansible/latest/collections_guide/collections_installing.html . Supports the default install path under `ansible_collections`, one installed version at a time, the version range identifiers and most-recent-matching rule, pre-releases being ignored by default, requirements files, cross-instance dependency resolution, and GPG signature verification blocking installation on failure.

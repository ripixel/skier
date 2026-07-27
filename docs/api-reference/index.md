---
title: Overview
section: API Reference
order: 0
---

# API Reference

> **Status: stubbed.** This section is part of the planned docs information
> architecture, but its content lands in a later task (see the docs-site revamp
> spec). This page exists so the **API Reference** sidebar section renders and so
> the frontmatter conventions are in place for the pages that will fill it.

The API Reference will document Skier's programmatic surface — the pieces you
import and call when you write `skier.tasks.mjs` or author a custom task:

- **The task contract** — `TaskDef`, `TaskContext`, and how `run()` receives
  config and returns globals.
- **Core types** — `SkierItem`, `SkierGlobals`, `NavData` / `NavSection` /
  `NavItem`, `Heading`, and the frontmatter shapes.
- **Config interfaces per built-in** — the exported `*Config` types (e.g.
  `GenerateItemsConfig`, `GenerateNavDataConfig`).
- **Utilities** — the markdown renderer, link-rewriting, and path helpers
  exposed for custom tasks.

### In the meantime

- Per-task usage and options live in the [Task Reference](/task-reference).
- Writing your own task is covered in the
  [Custom Tasks](/custom-tasks) guide.
- The end-to-end pipeline model is in [Architecture](/architecture).

<!-- New API Reference pages: add `section: API Reference` frontmatter and an
     `order`. See the "Docs site navigation" conventions in
     docs/markdown-frontmatter.md before adding pages here. -->

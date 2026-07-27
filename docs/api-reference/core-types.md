---
title: Core Types
section: API Reference
order: 2
---

# Core Types

The data that flows through a Skier pipeline. `SkierItem` and `SkierGlobals` are
the two types you'll touch most; below them are the structured outputs the
built-in tasks produce and hand to your templates.

All signatures are transcluded from source at build time.

---

## SkierItem

Every piece of itemised content — a blog post, a portfolio entry, any Markdown
file processed by [`generateItemsTask`](../task-reference/generateItemsTask.md) —
is normalised into a `SkierItem`. It's what lands in the `outputVar` array in
globals, and what [`generateFeedTask`](../task-reference/generateFeedTask.md)
consumes as its `articles`:

@include src/types.ts region="SkierItem"

| Field | Type | Notes |
|-------|------|-------|
| `section` | string? | Content group (e.g. `posts`), from the item's subdirectory. Absent under `flatStructure`. |
| `itemName` | string | Filename without extension — the slug. |
| `itemPath` | string | Source path of the item file. |
| `outPath` | string | Path the rendered HTML was written to. |
| `type` | string | Source type — `'md'`, `'html'`, etc. |
| `relativePath` | string? | Output path relative to `outDir`. |
| `title` | string | Resolved title (frontmatter → filename). |
| `link` | string | Root-relative URL of the item. |
| `body` | string | Rendered HTML body. |
| `date` / `dateObj` / `dateDisplay` | string? / Date? / string? | Parsed date in three forms, when available. |
| `excerpt` | string? | Short summary, when extracted. |

> To add your own fields, extend `SkierItem` in your project — it's an ordinary
> interface. Custom template variables per item come from `additionalVarsFn`
> (see [generateItemsTask](../task-reference/generateItemsTask.md#template-variables)).

---

## SkierGlobals

The shared bag of build-wide data. Each task's `run()` return value is merged in,
and the whole object is exposed to every template:

@include src/types.ts region="SkierGlobals"

It's deliberately open (`[key: string]: unknown`) — any task can contribute any
key. See the [Task Contract](./task-contract.md#the-run-contract) for how data
gets in and out.

---

## Produced data types

Some built-ins produce structured objects for your templates rather than plain
strings. These are the shapes they emit.

### NavData

[`generateNavDataTask`](../task-reference/generateNavDataTask.md) builds a full
sidebar/navigation tree from your docs' frontmatter and exposes it on globals:

@include src/builtins/generateNavDataTask/index.ts region="navtypes"

### PaginationMeta

[`generatePaginatedItemsTask`](../task-reference/generatePaginatedItemsTask.md)
passes a `PaginationMeta` object to each page template so it can render page
numbers and prev/next links:

@include src/builtins/generatePaginatedItemsTask/index.ts region="pagination-meta"

### SearchIndex

[`generateSearchIndexTask`](../task-reference/generateSearchIndexTask.md) writes
a JSON document in this shape for a client-side search UI to consume:

@include src/builtins/generateSearchIndexTask/index.ts region="searchtypes"

---

## Related

- [Task Contract](./task-contract.md) — `TaskDef`, `TaskContext`, `Logger`.
- [Config Interfaces](./config-interfaces.md) — the `*Config` type for each
  built-in task.

---
title: generateNavDataTask
section: Task Reference
subcategory: Content
order: 4
---

# generateNavDataTask

Auto-generate structured navigation data by scanning a documentation directory.

---

## When to Use

✅ Use `generateNavDataTask` when you need:
- Dynamic sidebar navigation from docs structure
- Auto-discovery of documentation pages
- Sectioned navigation with collapsible groups

---

## Quick Start

```js
generateNavDataTask({
  docsDir: 'docs',
  outputVar: 'navData',
  sectionOrder: {
    'Getting Started': 1,
    'Core Concepts': 2,
    'Built-in Tasks': 3,
  },
})
```

**Output:** `globals.navData` with structured navigation data.

---

## Configuration

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `docsDir` | string | ✅ | Directory containing Markdown files to scan |
| `outputVar` | string | | Variable name for nav data (default: `'navData'`) |
| `basePath` | string | | Base URL path for links (default: `''`) |
| `extensions` | string[] | | File extensions to include (default: `['.md']`) |
| `defaultSection` | string | | Section name for ungrouped docs (default: `'Docs'`) |
| `sectionOrder` | object | | Section display order (name → number) |
| `subcategoryOrder` | object | | Subcategory display order (name → number) |

---

## Type signature

The exact `GenerateNavDataConfig` interface, transcluded from source so it stays in step with the shipping code:

@include src/builtins/generateNavDataTask/index.ts region="config"

> Every task's config type together: [API Reference → Config Interfaces](../api-reference/config-interfaces.md).

---

## Metadata Extraction

The task reads Markdown files and extracts:

**From frontmatter:**
```yaml
---
title: Quick Start
section: Getting Started
subcategory: Setup
order: 1
---
```

| Field | Purpose |
|-------|---------|
| `title` | Display title in navigation |
| `section` | Parent navigation section |
| `subcategory` | Nested group within section |
| `order` | Sort order (lower = earlier) |

**Fallback behavior:**
- **Title**: Uses first `# Heading` or capitalized filename
- **Section**: Uses `defaultSection` (or `'Built-in Tasks'` for `/builtins/` paths)
- **Order**: Defaults to `999`

---

## Output Structure

The task sets `globals[outputVar]` to a `NavData` object. These are the real
exported types, transcluded from source so they never drift from the code:

@include src/builtins/generateNavDataTask/index.ts region="navtypes"

> Also documented in the [API Reference → Core Types](../api-reference/core-types.md#navdata).

---

## Template Usage

**Sidebar partial:**
```handlebars
<nav class="sidebar-nav">
  {{#each navData.sections}}
  <div class="sidebar-section">
    <div class="sidebar-section-title">{{this.name}}</div>
    <ul>
      {{#each this.items}}
      <li><a href="{{this.url}}">{{this.title}}</a></li>
      {{/each}}
      {{#if this.children}}
        {{#each this.children}}
        <li>
          <details open>
            <summary>{{this.name}}</summary>
            <ul class="nav-children">
              {{#each this.items}}
              <li><a href="{{this.url}}">{{this.title}}</a></li>
              {{/each}}
            </ul>
          </details>
        </li>
        {{/each}}
      {{/if}}
    </ul>
  </div>
  {{/each}}
</nav>
```

---

## Real-World Example

Skier's own documentation uses this task:

```js
generateNavDataTask({
  docsDir: 'docs',
  outputVar: 'navData',
  sectionOrder: {
    'Getting Started': 1,
    'Core Concepts': 2,
    'Built-in Tasks': 3,
    'Advanced': 4,
    'Community': 5,
  },
  subcategoryOrder: {
    'Setup': 1,
    'Globals': 2,
    'Content': 3,
    'Feeds & SEO': 4,
  },
}),
```

With this frontmatter in docs:

```yaml
# docs/builtins/generatePagesTask.md
---
title: generatePagesTask
subcategory: Content
order: 1
---
```

---

## URL Generation

| File | Generated URL |
|------|---------------|
| `docs/getting-started.md` | `/getting-started` |
| `docs/README.md` | `/` |
| `docs/builtins/index.md` | `/builtins` |
| `docs/builtins/copyStaticTask.md` | `/builtins/copyStaticTask` |

---

## Related Tasks

- [generateItemsTask](./generateItemsTask.md) — Render the docs as pages
- [generatePagesTask](./generatePagesTask.md) — Render standalone pages
- [setGlobalsTask](./setGlobalsTask.md) — Set static navigation data

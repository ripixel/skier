---
title: generateNavDataTask
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

```typescript
interface NavData {
  sections: NavSection[];  // Ordered sections for sidebar
  pages: NavItem[];        // Flat list for prev/next navigation
}

interface NavSection {
  name: string;            // Section display name
  order: number;           // Sort order
  items: NavItem[];        // Direct items (no subcategory)
  children?: NavSection[]; // Nested subcategory groups
}

interface NavItem {
  title: string;           // Page display title
  url: string;             // Page URL path
  order: number;           // Sort order
}
```

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

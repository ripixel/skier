---
title: generateSearchIndexTask
section: Task Reference
subcategory: Feeds & SEO
order: 3
---

# generateSearchIndexTask

Walk your rendered HTML pages and emit a lean JSON **search index** for client-side search — no external search service required.

---

## When to Use

✅ Use `generateSearchIndexTask` when you want:

- Fast, native, client-side search over your site
- A stable JSON index (title, headings, body text, URL) a search UI can fetch
- Search built from the **rendered** pages, so it indexes exactly what readers see

It is the search counterpart to [generateNavDataTask](./generateNavDataTask.md): same task
shape and registration, but it reads rendered HTML rather than Markdown source, and it strips
that HTML down to searchable text.

Run it **after** all page-generating tasks so it can see the finished pages.

---

## Quick Start

```js
generateSearchIndexTask({
  scanDir: 'public',
  outDir: 'public',
  siteUrl: 'https://skier.ripixel.co.uk',
})
```

**Output:** `public/search-index.json`

---

## Configuration

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `scanDir` | string | ✅ | Directory to scan for rendered `.html` files |
| `outDir` | string | ✅ | Directory to write the index JSON into |
| `fileName` | string | | Output filename (default: `'search-index.json'`) |
| `siteUrl` | string | | Site root URL for absolute page URLs (default: root-relative) |
| `contentSelector` | string | | Tag whose contents are indexed, scoping out chrome (default: `'main'`; use `'body'` for the whole page). Falls back to `<body>` if absent. |
| `excludes` | string[] | | Glob patterns to exclude (merged with defaults `404.html`, `404/**`) |
| `outputVar` | string | | If set, the index is also exposed on `globals[outputVar]` for downstream tasks |
| `maxBodyLength` | number | | Cap each page's body text to N characters (default: `0` = no limit) |
| `pretty` | boolean | | Pretty-print the JSON (default: `false` — compact keeps the payload lean) |

---

## Type signature

The exact `GenerateSearchIndexConfig` interface, transcluded from source so it stays in step with the shipping code:

@include src/builtins/generateSearchIndexTask/index.ts region="config"

> Every task's config type together: [API Reference → Config Interfaces](../api-reference/config-interfaces.md).

---

## What Gets Indexed

For each page the task extracts:

| Field | Source |
|-------|--------|
| `url` | Cleaned, extension-free page URL (`index.html` → `/`, `about.html` → `/about`) |
| `title` | First `<h1>` in the content region, falling back to `<title>`, then the filename |
| `headings` | Every `<h1>`–`<h6>` in document order, with `level` and (when present) an anchor `id` |
| `body` | The content region with HTML stripped, entities decoded, and whitespace collapsed |

To keep the payload lean and relevant, the task **scopes to `contentSelector`** (default `<main>`)
and strips `<script>`, `<style>`, HTML comments, and in-content `<nav>` blocks (breadcrumbs,
prev/next) before extracting text — so shared chrome like the sidebar, header, and footer is not
repeated on every page.

---

## Output Structure

The real exported types, transcluded from source so this reference can't drift
from the shipping contract:

@include src/builtins/generateSearchIndexTask/index.ts region="searchtypes"

This format is a **stable contract** consumed by the client-side search UI. Fields are added
additively; existing fields are not renamed or repurposed. It's also documented in the
[API Reference → Core Types](../api-reference/core-types.md#searchindex).

Example entry:

```json
{
  "url": "/getting-started",
  "title": "Getting Started",
  "headings": [
    { "text": "Getting Started", "level": 1 },
    { "text": "Install", "level": 2, "id": "install" }
  ],
  "body": "Install with npm. Run the CLI to build your site. Install Requirements Node 22 or later is required."
}
```

---

## Exclusions

`404.html` and `404/**` are always excluded. Add your own patterns via `excludes` — they are
**merged** with the defaults and logged at info level:

```js
generateSearchIndexTask({
  scanDir: 'public',
  outDir: 'public',
  excludes: ['drafts/**', 'admin/**'],
})
```

```
ℹ Search index: excluded /404.html (matched pattern: 404.html)
ℹ Search index: excluded /drafts/wip.html (matched pattern: drafts/**)
```

---

## Pipeline Position

Place after every page-generating task, alongside the sitemap:

```js
export default [
  prepareOutputTask({ /* ... */ }),
  generateItemsTask({ /* ... */ }),
  generatePagesTask({ /* ... */ }),
  generateSitemapTask({ scanDir: 'public', outDir: 'public' }),
  generateSearchIndexTask({ scanDir: 'public', outDir: 'public' }), // ← after pages exist
];
```

---

## Related Tasks

- [generateNavDataTask](./generateNavDataTask.md) — The task this one is modelled on (sidebar data)
- [generateSitemapTask](./generateSitemapTask.md) — Same scan-and-clean-URL approach, for SEO
- [generateItemsTask](./generateItemsTask.md) — Renders the pages this task indexes

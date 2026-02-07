---
title: generatePagesTask
subcategory: Content
order: 1
---

# generatePagesTask

Render standalone HTML pages from Handlebars templates.

---

## When to Use

✅ Use `generatePagesTask` for:
- Homepage, about, contact pages
- Any page not part of a collection
- Landing pages with custom layouts

❌ Use `generateItemsTask` instead for:
- Blog posts, portfolio items, or other collections
- Pages generated from Markdown files

---

## Quick Start

```js
generatePagesTask({
  pagesDir: 'src/pages',
  partialsDir: 'src/partials',
  outDir: 'public',
})
```

**Input:** Templates in `src/pages/`
**Output:** HTML files in `public/`

---

## Configuration

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `pagesDir` | string | ✅ | Directory containing page templates |
| `partialsDir` | string | ✅ | Directory with shared partials |
| `outDir` | string | ✅ | Output directory |
| `pageExt` | string | | Template extension (default: `.html`) |
| `additionalVarsFn` | function | | Inject extra variables per page (receives `HtmlRenderVars` object) |

---

## Directory Structure

Templates mirror output structure:

```
src/pages/           →    public/
├── index.html       →    ├── index.html
├── about.html       →    ├── about.html
└── contact.html     →    └── contact.html
```

> [!NOTE]
> Only top-level files in `pagesDir` are processed. Subdirectories are not scanned recursively.

---

## Template Variables

All globals are available in templates:

```handlebars
<!DOCTYPE html>
<html>
<head>
  <title>{{pageTitle}} | {{siteTitle}}</title>
</head>
<body>
  {{> header}}

  <main>
    <h1>{{pageTitle}}</h1>

    {{!-- Access any global --}}
    <p>Latest post: {{posts.0.title}}</p>
  </main>

  {{> footer}}
</body>
</html>
```

---

## Per-Page Variables

Use `additionalVarsFn` for page-specific data:

```js
generatePagesTask({
  pagesDir: 'src/pages',
  partialsDir: 'src/partials',
  outDir: 'public',

  additionalVarsFn: (vars) => {
    return {
      pageTitle: {
        'index': 'Home',
        'about': 'About Us',
        'contact': 'Get in Touch',
      }[vars.currentPage] || vars.currentPage,
    };
  },
})
```

---

## Real-World Example

Homepage with dynamic sections:

```js
// After generateItemsTask has populated posts
generatePagesTask({
  pagesDir: 'src/pages',
  partialsDir: 'src/partials',
  outDir: 'public',

  additionalVarsFn: (vars) => {
    if (vars.currentPagePath === 'index.html') {
      return {
        featuredPosts: (vars.posts || []).slice(0, 3),
        showNewsletter: true,
      };
    }
    return {};
  },
})
```

---

## Common Mistakes

❌ **Wrong partial reference:**
```handlebars
{{> partials/header}}  <!-- ❌ Wrong: include 'partials' path -->
{{> header}}           <!-- ✅ Correct: just the name -->
```

❌ **Accessing undefined globals:**
```handlebars
{{posts.0.title}}  <!-- ❌ Crashes if posts is undefined -->

{{#if posts}}
  {{posts.0.title}}  <!-- ✅ Safe access -->
{{/if}}
```

---

## Related Tasks

- [generateItemsTask](./generateItemsTask.md) — For collection pages
- [setGlobalsTask](./setGlobalsTask.md) — Set variables used in templates
- [copyStaticTask](./copyStaticTask.md) — For non-template assets

# generateItemsTask

Generate HTML pages from a collection of Markdown files (blog posts, portfolio items, etc.).

---

## When to Use

✅ Use `generateItemsTask` when you have:
- Blog posts as Markdown files
- Portfolio projects with frontmatter
- Any collection of similar content items

❌ Use `generatePaginatedItemsTask` instead when:
- You need paginated list pages
- Data comes from JSON rather than Markdown

---

## Quick Start

```js
generateItemsTask({
  itemsDir: 'src/items/posts',
  partialsDir: 'src/partials',
  outDir: 'public/posts',
  outputVar: 'posts',
})
```

**Input:** Markdown files in `src/items/posts/`
**Output:** HTML pages in `public/posts/` + `globals.posts` array

---

## Configuration

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `itemsDir` | string | ✅ | Directory containing Markdown files |
| `partialsDir` | string | ✅ | Directory with Handlebars partials |
| `outDir` | string | ✅ | Output directory for generated HTML |
| `outputVar` | string | ✅ | Variable name for items array in globals |
| `templateExtension` | string | | Template file extension (default: `.html`) |
| `partialExtension` | string | | Partial file extension (default: `.html`) |
| `flatStructure` | boolean | | If true, treat all files as items (no subdirs) |
| `sortFn` | function | | Custom sort function |
| `excerptFn` | function | | Custom excerpt extractor |
| `linkFn` | function | | Custom URL generator |
| `outputPathFn` | function | | Custom output path generator |
| `additionalVarsFn` | function | | Inject extra template variables |

---

## Sorting Items

Default: items are sorted by `date` (newest first).

**Custom sort by title:**
```js
generateItemsTask({
  // ...
  sortFn: (a, b) => a.title.localeCompare(b.title),
})
```

**Reverse chronological (explicit):**
```js
sortFn: (a, b) => new Date(b.date) - new Date(a.date),
```

---

## Extracting Excerpts

Default: first 150 characters.

**Use a marker (`<!--more-->`):**
```js
generateItemsTask({
  // ...
  excerptFn: (content) => {
    const [excerpt] = content.split('<!--more-->');
    return excerpt.trim();
  },
})
```

---

## Output Structure

**Default (nested):** Each item gets its own directory:
```
public/posts/
├── hello-world/
│   └── index.html
├── second-post/
│   └── index.html
└── index.html        # List page
```

**Flat structure:** Items as direct HTML files:
```js
generateItemsTask({
  flatStructure: true,
  // ...
})
```
```
public/posts/
├── hello-world.html
├── second-post.html
└── index.html
```

---

## Real-World Example

From a blog with categories and reading time:

```js
generateItemsTask({
  itemsDir: 'src/items/posts',
  partialsDir: 'src/partials',
  outDir: 'public/posts',
  outputVar: 'posts',

  sortFn: (a, b) => new Date(b.date) - new Date(a.date),

  excerptFn: (content) => {
    const text = content.replace(/<[^>]*>/g, ''); // Strip HTML
    return text.slice(0, 200) + '...';
  },

  additionalVarsFn: (item, globals) => ({
    readingTime: Math.ceil(item.content.split(' ').length / 200),
    relatedPosts: (globals.posts || [])
      .filter(p => p.category === item.category && p.slug !== item.slug)
      .slice(0, 3),
  }),
})
```

---

## Template Variables

Each item template receives:

```js
{
  // From frontmatter
  title: "Hello World",
  date: "2024-01-15",
  category: "Tech",
  tags: ["javascript", "web"],

  // Auto-generated
  slug: "hello-world",
  content: "<p>Rendered HTML...</p>",
  excerpt: "First part of content...",
  link: "/posts/hello-world/",

  // From additionalVarsFn
  readingTime: 5,

  // All globals
  siteTitle: "My Blog",
  posts: [/* all posts */],
}
```

---

## Common Mistakes

❌ **Forgetting outputVar:**
```js
// Items won't be available in templates!
generateItemsTask({
  itemsDir: 'src/posts',
  // Missing: outputVar: 'posts'
})
```

❌ **Using wrong task order:**
```js
// Wrong: generatePagesTask can't access posts yet
generatePagesTask({ /* ... */ }),
generateItemsTask({ outputVar: 'posts' }),
```

❌ **Invalid date formats:**
```yaml
# Frontmatter
date: January 15, 2024  # ❌ Won't parse correctly
date: 2024-01-15        # ✅ ISO format
```

---

## Related Tasks

- [generatePaginatedItemsTask](./generatePaginatedItemsTask.md) — For paginated lists
- [generateFeedTask](./generateFeedTask.md) — Use with `outputVar` for RSS/Atom
- [generateSitemapTask](./generateSitemapTask.md) — Auto-includes generated pages

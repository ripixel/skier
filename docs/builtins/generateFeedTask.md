---
title: generateFeedTask
subcategory: Feeds & SEO
order: 1
---

# generateFeedTask

Generate RSS, Atom, and JSON feeds from your content.

---

## When to Use

✅ Use `generateFeedTask` when you have:
- Blog posts subscribers should follow
- News or announcements
- Podcast episodes

---

## Quick Start

```js
generateFeedTask({
  articles: '${posts}',
  outDir: 'public',
  site: {
    title: 'My Blog',
    link: 'https://example.com',
    author: { name: 'Jane Doe' },
  },
})
```

**Output:**
- `public/rss.xml` (RSS)
- `public/atom.xml` (Atom)
- `public/json.json` (JSON Feed)

---

## Configuration

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `articles` | string/array | ✅ | Items array or `${varName}` reference |
| `outDir` | string | ✅ | Output directory |
| `site` | object | ✅ | Feed metadata (see below) |

### Site Metadata

```js
{
  title: 'My Blog',                  // Feed title
  description: 'Tech thoughts',      // Feed description
  id: 'https://example.com/',        // Unique ID (often same as link)
  link: 'https://example.com/',      // Site URL (MUST be absolute)
  language: 'en',                    // ISO language code
  favicon: 'https://example.com/favicon.ico',
  copyright: '© 2024 Jane Doe',
  author: {
    name: 'Jane Doe',
    email: 'jane@example.com',
    link: 'https://example.com/about',
  },
  feedLinks: {
    json: 'https://example.com/json.json',
    atom: 'https://example.com/atom.xml',
  },
}
```

---

## Article Format

Each article needs these fields:

```js
{
  title: 'Post Title',           // Required
  link: '/posts/my-post/',       // Required (relative or absolute)
  body: '<p>HTML content</p>',   // Required (for feed content)
  dateObj: new Date('2024-01-15'), // Required (Date object)

  // Optional
  excerpt: 'Short summary',    // Used as feed description fallback
  author: 'Jane Doe',
  image: 'https://example.com/image.jpg',
}
```

---

## Integration with generateItemsTask

The items task produces data compatible with feeds:

```js
generateItemsTask({
  itemsDir: 'src/items/posts',
  outputVar: 'posts',
  // ...
}),

generateFeedTask({
  articles: '${posts}',
  outDir: 'public',
  site: { /* ... */ },
}),
```

---

## HTML Head Links

Add feed discovery to your templates:

```handlebars
<link rel="alternate" type="application/rss+xml"
      title="RSS Feed" href="/rss.xml">
<link rel="alternate" type="application/atom+xml"
      title="Atom Feed" href="/atom.xml">
<link rel="alternate" type="application/json"
      title="JSON Feed" href="/json.json">
```

---

## Common Mistakes

❌ **Using relative site.link:**
```js
site: { link: '/blog' }  // ❌ Feed readers need absolute URLs
site: { link: 'https://example.com' }  // ✅
```

❌ **Invalid dates:**
```js
// Item date must be a Date object
dateObj: '2024-01-15'           // ❌ String
dateObj: new Date('2024-01-15') // ✅ Date object
```

---

## Related Tasks

- [generateItemsTask](./generateItemsTask.md) — Produces article arrays
- [generateSitemapTask](./generateSitemapTask.md) — For search engines

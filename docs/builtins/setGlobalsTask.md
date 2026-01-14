---
title: setGlobalsTask
subcategory: Globals
order: 1
---

# setGlobalsTask

Set site-wide variables accessible in all templates and subsequent tasks.

---

## When to Use

✅ Use `setGlobalsTask` when you need:
- Site-wide configuration (title, URL, author)
- Computed values from existing globals
- Build-time constants

❌ Use `setGlobalFromMarkdownTask` instead when:
- Content comes from a Markdown file

---

## Quick Start

```js
setGlobalsTask({
  values: {
    siteTitle: 'My Blog',
    author: 'Jane Doe',
  }
})
```

---

## Configuration

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `values` | object | ⚡ | Static key-value pairs |
| `valuesFn` | function | ⚡ | Dynamic function receiving current globals |

⚡ At least one of `values` or `valuesFn` is required. Both can be used together.

---

## Static Values

Simple key-value assignment:

```js
setGlobalsTask({
  values: {
    siteTitle: 'My Site',
    siteUrl: 'https://example.com',
    author: {
      name: 'Jane Doe',
      email: 'jane@example.com',
    },
    navigation: [
      { label: 'Home', url: '/' },
      { label: 'Blog', url: '/blog' },
      { label: 'About', url: '/about' },
    ],
  }
})
```

---

## Dynamic Values

Compute globals from other globals:

```js
setGlobalsTask({
  valuesFn: (globals) => ({
    // Latest 5 posts
    recentPosts: (globals.posts || []).slice(0, 5),

    // Post count
    totalPosts: (globals.posts || []).length,

    // Current year
    currentYear: new Date().getFullYear(),

    // Build timestamp
    buildTimestamp: new Date().toISOString(),
  })
})
```

---

## Combining Static and Dynamic

Both can be used in a single task:

```js
setGlobalsTask({
  values: {
    siteTitle: 'My Blog',
  },
  valuesFn: (globals) => ({
    fullTitle: `${globals.siteTitle} | Powered by Skier`,
  }),
})
```

**Order:** `values` are applied first, then `valuesFn`.

---

## Real-World Example

From a site with navigation and category grouping:

```js
// First: collect items
generateItemsTask({
  itemsDir: 'src/items/posts',
  outputVar: 'posts',
  // ...
}),

// Then: compute derived globals
setGlobalsTask({
  values: {
    siteTitle: 'Tech Blog',
    siteUrl: 'https://techblog.example.com',
    socialLinks: {
      twitter: 'https://twitter.com/techblog',
      github: 'https://github.com/techblog',
    },
  },
  valuesFn: (globals) => {
    const posts = globals.posts || [];

    // Group posts by category
    const postsByCategory = posts.reduce((acc, post) => {
      const cat = post.category || 'Uncategorized';
      (acc[cat] = acc[cat] || []).push(post);
      return acc;
    }, {});

    // Get unique categories
    const categories = Object.keys(postsByCategory).sort();

    return {
      postsByCategory,
      categories,
      featuredPost: posts.find(p => p.featured) || posts[0],
    };
  },
}),
```

---

## Template Access

All globals are available in templates:

```handlebars
<title>{{siteTitle}}</title>
<p>© {{currentYear}} {{author.name}}</p>

{{#each recentPosts}}
  <article>{{this.title}}</article>
{{/each}}
```

---

## Common Mistakes

❌ **Overwriting globals unintentionally:**
```js
// Second call overwrites the first!
setGlobalsTask({ values: { siteTitle: 'First' } }),
setGlobalsTask({ values: { siteTitle: 'Second' } }), // siteTitle is now 'Second'
```

❌ **Using valuesFn before data exists:**
```js
// Wrong order: posts doesn't exist yet
setGlobalsTask({
  valuesFn: (g) => ({ count: g.posts.length }) // ❌ posts is undefined
}),
generateItemsTask({ outputVar: 'posts' }),
```

✅ **Correct: Place after the task that creates the data:**
```js
generateItemsTask({ outputVar: 'posts' }),
setGlobalsTask({
  valuesFn: (g) => ({ count: (g.posts || []).length }) // ✅
}),
```

---

## Related Tasks

- [setGlobalFromMarkdownTask](./setGlobalFromMarkdownTask.md) — For Markdown content
- [generateItemsTask](./generateItemsTask.md) — Produces data for `valuesFn`

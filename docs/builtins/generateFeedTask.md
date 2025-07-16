# generateFeedTask

## Summary
Generates RSS, Atom, and JSON feeds from your site's content (typically blog posts or articles). Use this to provide feed subscriptions for readers and syndication services.

## Default Behavior
With minimal config, collects all items (e.g., posts) from the specified input, uses site metadata to populate feed details, and writes `feed.xml` (RSS), `atom.xml` (Atom), and `feed.json` (JSON Feed) to your output directory.

## Configuration Options
- `articles` (object[] | required): Array of article objects (e.g., blog posts), each with at least `title`, `link`, `body`, and `dateObj` fields.
- `outDir` (string, required): Path to the output directory (e.g., `public`).
- `site` (object, required): Metadata for the feed (see below).

**Site metadata fields:**
- `title` (string): Feed/site title.
- `description` (string): Feed/site description.
- `id` (string): Unique identifier for the feed/site (often same as `link`).
- `link` (string): Absolute URL to your site root.
- `language` (string): e.g., `en`.
- `favicon` (string): URL to the site's favicon.
- `copyright` (string): Copyright string.
- `feedLinks` (object): `{ json, atom }` URLs for feed autodiscovery.
- `author` (object): `{ name, email, link }`.

**Example config:**
```js
generateFeedTask({
  articles: posts, // Array of article objects
  outDir: 'public',
  site: {
    title: 'My Blog',
    description: 'Latest updates and stories',
    id: 'https://example.com/',
    link: 'https://example.com/',
    language: 'en',
    favicon: 'https://example.com/favicon.ico',
    copyright: 'Copyright 2025 Jane Doe',
    feedLinks: {
      json: 'https://example.com/feed.json',
      atom: 'https://example.com/atom.xml',
    },
    author: {
      name: 'Jane Doe',
      email: 'jane@example.com',
      link: 'https://example.com/about',
    },
  },
})
```

## Input Expectations
- An array of item objects, each with:
  - `title` (string)
  - `url` (string, absolute or site-relative)
  - `date` (string or Date)
  - `description` or `content` (string, optional but recommended)
  - `author`, `image`, etc. (optional, see JSON Feed spec)
- Site metadata object as above.

## Output
- RSS feed (XML) at `outDir/rssFile` (default: `feed.xml`)
- Atom feed (XML) at `outDir/atomFile` (default: `atom.xml`)
- JSON Feed at `outDir/jsonFile` (default: `feed.json`)

**Example:**
```
public/
  feed.xml
  atom.xml
  feed.json
```

## Practical Example
```js
const { generateFeedTask } = require('skier/builtins');

module.exports = [
  // ...other tasks
  generateFeedTask({
    articles: posts, // posts array from generateItemsTask or similar
    outDir: 'public',
    site: {
      title: 'My Blog',
      description: 'Latest updates and stories',
      link: 'https://example.com',
      author: { name: 'Jane Doe' },
    },
  }),
];
```

## Common Pitfalls & Tips
- All items should have unique URLs and valid dates.
- Dates must be in ISO 8601 format or JS Date objects.
- For maximum compatibility, provide both `description` and `content` fields in items.
- Site `link` must be the absolute root URL (including `https://`).
- If you only want one feed type, omit the filename for others or delete after build.
- Validate your feeds with online validators (e.g., [W3C Feed Validator](https://validator.w3.org/feed/)).

## Related Tasks/Docs
- [generateItemsTask](./generateItemsTask.md)
- [generateSitemapTask](./generateSitemapTask.md)
- [Markdown & Frontmatter](../markdown-frontmatter.md)

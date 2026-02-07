---
title: Custom Tasks
section: Core Concepts
order: 2
---

# Custom Tasks

Extend Skier with your own build steps. This guide covers everything from basic tasks to advanced patterns.

---

## Task Structure

A task is an object with three properties:

```typescript
interface Task {
  name: string;                         // Unique identifier
  title?: string;                       // Human-readable description
  config?: Record<string, any>;         // Your task's configuration
  run: (config, context) => Promise<Record<string, any> | void>;
}
```

The `run` function receives:
- **`config`** — Your task's configuration object
- **`context`** — The Skier context with globals, logger, and debug flag

---

## Basic Example

```js
const logBuildTimeTask = {
  name: 'log-build-time',
  run: async (config, ctx) => {
    const timestamp = new Date().toISOString();
    ctx.logger.info(`Build started at ${timestamp}`);

    // Return data to merge into globals
    return { buildTime: timestamp };
  },
};

// Use it
export default [
  logBuildTimeTask,
  // ...other tasks
];
```

---

## The Context Object

```typescript
interface TaskContext {
  globals: Record<string, any>;  // Shared data between tasks
  logger: {
    info(msg: string): void;
    warn(msg: string): void;
    error(msg: string): void;
    debug(msg: string): void;
  };
  debug: boolean;                // True if --debug flag passed
}
```

**Important:** Access globals via `ctx.globals`, but *return* new data to add to globals:

```js
run: async (config, ctx) => {
  // Read existing globals
  const posts = ctx.globals.posts || [];

  // Process data
  const featured = posts.filter(p => p.featured);

  // Return to merge into globals
  return { featuredPosts: featured };
}
```

---

## Task Factory Pattern

For configurable tasks, use a factory function:

```js
const greetTask = (options = {}) => ({
  name: 'greet',
  config: options,
  run: async (config, ctx) => {
    const name = config.name || 'World';
    ctx.logger.info(`Hello, ${name}!`);
  },
});

// Use it
export default [
  greetTask({ name: 'Developer' }),
];
```

---

## Practical Patterns

### Data Aggregation

Compute statistics from collected items:

```js
const computeStatsTask = {
  name: 'compute-stats',
  run: async (config, ctx) => {
    const posts = ctx.globals.posts || [];

    // Group by year
    const postsByYear = posts.reduce((acc, post) => {
      const year = new Date(post.date).getFullYear();
      (acc[year] = acc[year] || []).push(post);
      return acc;
    }, {});

    // Count by category
    const categoryCounts = posts.reduce((acc, post) => {
      const cat = post.category || 'Uncategorized';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});

    return { postsByYear, categoryCounts };
  },
};
```

---

### External API Fetch

Fetch data from APIs at build time:

```js
const fetchPlaylistTask = (options) => ({
  name: 'fetch-playlist',
  config: options,
  run: async (config, ctx) => {
    try {
      const response = await fetch(
        `https://api.spotify.com/v1/playlists/${config.playlistId}`,
        { headers: { Authorization: `Bearer ${config.token}` } }
      );

      if (!response.ok) {
        ctx.logger.warn('Spotify API failed, using cached data');
        return {}; // Graceful degradation
      }

      const data = await response.json();
      return { playlist: data };

    } catch (err) {
      ctx.logger.error(`Fetch failed: ${err.message}`);
      return {}; // Don't break the build
    }
  },
});
```

---

### Data Transformation

Enrich item data before rendering:

```js
const enrichPostsTask = {
  name: 'enrich-posts',
  run: async (config, ctx) => {
    const posts = ctx.globals.posts || [];

    const enrichedPosts = posts.map(post => ({
      ...post,
      // Add computed fields
      readingTime: Math.ceil(post.content.split(' ').length / 200),
      formattedDate: new Date(post.date).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      // Add related posts
      relatedPosts: posts
        .filter(p => p.slug !== post.slug && p.category === post.category)
        .slice(0, 3),
    }));

    return { posts: enrichedPosts };
  },
};
```

---

### Build Validation

Fail the build on data errors:

```js
const validateDataTask = {
  name: 'validate-data',
  run: async (config, ctx) => {
    const posts = ctx.globals.posts || [];
    const errors = [];

    posts.forEach((post, i) => {
      if (!post.title) {
        errors.push(`Post ${i}: missing title`);
      }
      if (!post.date) {
        errors.push(`Post ${i}: missing date`);
      }
      if (post.date && isNaN(Date.parse(post.date))) {
        errors.push(`Post ${i}: invalid date "${post.date}"`);
      }
    });

    if (errors.length > 0) {
      errors.forEach(e => ctx.logger.error(e));
      throw new Error(`Validation failed with ${errors.length} errors`);
    }

    ctx.logger.info(`Validated ${posts.length} posts`);
  },
};
```

---

### File Generation

Create custom output files:

```js
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';

const generateJsonApiTask = (options) => ({
  name: 'generate-json-api',
  config: options,
  run: async (config, ctx) => {
    const posts = ctx.globals.posts || [];
    const outPath = join(config.outDir, 'api', 'posts.json');

    // Ensure directory exists
    await mkdir(dirname(outPath), { recursive: true });

    // Write JSON API endpoint
    const apiData = {
      posts: posts.map(({ title, slug, date, excerpt }) => ({
        title, slug, date, excerpt,
      })),
      total: posts.length,
      generated: new Date().toISOString(),
    };

    await writeFile(outPath, JSON.stringify(apiData, null, 2));
    ctx.logger.info(`Generated ${outPath}`);
  },
});
```

---

## TypeScript Support

Full type definitions for custom tasks:

```typescript
// tasks/myTask.ts
import type { Task, TaskContext, TaskConfig } from 'skier';

interface MyTaskConfig extends TaskConfig {
  prefix: string;
  maxItems?: number;
}

export const myTask = (options: MyTaskConfig): Task => ({
  name: 'my-task',
  config: options,
  run: async (config: MyTaskConfig, ctx: TaskContext) => {
    const items = (ctx.globals.items || []).slice(0, config.maxItems ?? 10);

    return {
      prefixedItems: items.map(i => ({
        ...i,
        title: `${config.prefix}: ${i.title}`,
      })),
    };
  },
});
```

---

## Testing Custom Tasks

Use Jest to unit test your tasks:

```js
// tasks/myTask.test.js
import { myTask } from './myTask.js';

describe('myTask', () => {
  const mockContext = {
    globals: {
      items: [
        { title: 'One' },
        { title: 'Two' },
      ],
    },
    logger: {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    },
    debug: false,
  };

  it('prefixes item titles', async () => {
    const task = myTask({ prefix: 'Test' });
    const result = await task.run(task.config, mockContext);

    expect(result.prefixedItems[0].title).toBe('Test: One');
  });

  it('respects maxItems', async () => {
    const task = myTask({ prefix: 'Test', maxItems: 1 });
    const result = await task.run(task.config, mockContext);

    expect(result.prefixedItems).toHaveLength(1);
  });
});
```

---

## Best Practices

1. **Give tasks unique names** — Helps with debugging
2. **Return data, don't mutate** — Return new objects instead of modifying `ctx.globals`
3. **Use the logger** — `ctx.logger.info()` keeps output consistent
4. **Fail gracefully** — Catch errors and log warnings rather than breaking builds
5. **Keep tasks focused** — One task, one responsibility
6. **Document your config** — Future you will thank you

---

**Next:** See [Architecture](./architecture.md) to understand how tasks fit into the pipeline.

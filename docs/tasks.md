# Tasks

Skier is built around a flexible, modular task pipeline. Each task performs a distinct build step—like generating pages, bundling CSS, or copying static assets. You can use built-in tasks, write your own, and compose them in any order.

---

## What is a Task?

A **task** is a function or object that describes a build step. Each task receives configuration and context, and can read/write files, update global variables, or generate output.

---

## How Tasks Are Loaded

- Skier loads tasks from your pipeline config file (see [Configuration](./configuration.md)).
- The config exports an **array of tasks** (or a function returning one).
- Tasks are run in the order listed in the array.

---

## Task Anatomy

A typical task is created by a factory function (e.g., `generatePagesTask(config)`) and returns an object like:

```js
{
  name: 'generate-pages',
  config: { ... },
  run: async (config, context) => { ... }
}
```

- **name**: Unique identifier for the task.
- **config**: Task-specific configuration object.
- **run**: Async function that performs the build step. Receives the config and a context object.

---

## Context Object

The context passed to each task includes:
- `globals`: Global variables (site title, author, etc.)
- `logger`: Task-specific logger
- `debug`: Debug flag

---

## Example: Custom Task

```js
const myCustomTask = {
  name: 'say-hello',
  run: async (config, ctx) => {
    ctx.logger.info('Hello from my custom task!');
    return {};
  }
};
```

Add it to your pipeline:

```js
module.exports = [
  ...,
  myCustomTask,
  ...
];
```

---

## Pipeline Order

Tasks run sequentially, top-to-bottom. Output and globals from one task are available to all subsequent tasks.

---

## Sharing Data Between Tasks (Globals)

When a task's `run` method returns an object (a plain `Record<string, any>`), Skier merges that object onto the global context. These globals are then available to all subsequent tasks and templates.

- This allows tasks to pass data to each other without manual wiring.
- For example, a task can return `{ allPosts }`, and later tasks or templates can use `globals.allPosts`.
- Globals are available in template variables as well as in the `context` object for subsequent tasks.

**Example:**
```js
const collectPostsTask = {
  name: 'collect-posts',
  run: async (config, ctx) => {
    // ...collect posts
    return { allPosts };
  }
};

const generateFeedTask = {
  name: 'generate-feed',
  run: async (config, ctx) => {
    // ctx.globals.allPosts is available here!
  }
};
```

---

## Built-in Tasks

Skier ships with many built-in tasks for common needs. See the [Built-ins](./builtins/generateItemsTask.md) section for details and examples.

---

**Next:** Learn more about [Built-in Tasks](./builtins/generateItemsTask.md) or [Custom Tasks](./custom-tasks.md).

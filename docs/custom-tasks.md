# Custom Tasks

Skier is designed to be extensible. You can write your own custom tasks to add new build steps, integrate with APIs, or perform any logic you need.

---

## What is a Custom Task?

A custom task is an object with a `name` and a `run` function. You can also add a `config` property if needed.

---

## Example: Basic Custom Task

```js
const myCustomTask = {
  name: 'say-hello',
  run: async (config, ctx) => {
    ctx.logger.info('Hello from my custom task!');
    return {};
  }
};
```

Add it to your pipeline in `skier.tasks.js`:

```js
module.exports = [
  ...,
  myCustomTask,
  ...
];
```

---

## Config and Context

- The `run` function receives `(config, context)`.
- `config`: Your task's config object (if any).
- `context`: Includes `globals`, `logger`, `debug`, and more.

---

## Using the Logger

Use `ctx.logger` to log info, warnings, or errors. This keeps output consistent with built-in tasks.

```js
run: async (config, ctx) => {
  ctx.logger.info('Doing something');
  ctx.logger.warn('Something might be wrong');
  ctx.logger.error('Something went wrong');
}
```

---

## Accessing Globals

You can read or set global variables for use in later tasks or templates:

```js
run: async (config, ctx) => {
  ctx.globals.siteBuildTime = new Date().toISOString();
}
```

---

## Returning Data to Globals

If your custom task's `run` function returns an object, Skier will merge those key-value pairs onto the global context. This is the recommended way to pass data between tasks or make it available to templates.

**Example:**
```js
const collectPostsTask = {
  name: 'collect-posts',
  run: async (config, ctx) => {
    // ...collect posts
    return { allPosts };
  }
};
```

Now, `globals.allPosts` will be available to all subsequent tasks and templates.

---

## Best Practices
- Give your task a unique `name`.
- Keep tasks focused—do one thing well.
- Use config for any user-settable options.
- Use the logger for all output.
- Document your custom tasks for future maintainers.

---

**Next:** Learn more about [Templates & Partials](./templates-partials.md) or [FAQ](./faq.md).

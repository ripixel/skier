# Tasks

Skier is built around a modular task pipeline. Each task performs one build step.

---

## How It Works

1. **You define** an array of tasks in your config file
2. **Skier runs** each task sequentially
3. **Tasks share data** via the global context

```js
export default [
  task1(),  // Runs first
  task2(),  // Runs second, can access task1's output
  task3(),  // Runs third, can access both
];
```

---

## Task Types

| Type | Purpose | Examples |
|------|---------|----------|
| **Built-in** | Common static site needs | `generatePagesTask`, `copyStaticTask` |
| **Custom** | Your project-specific logic | Data processing, API fetching |

---

## Global Context

Tasks communicate through a shared global object:

```js
// Task 1 returns data
const task1 = {
  name: 'collect-posts',
  run: async (config, ctx) => {
    return { posts: ['Post 1', 'Post 2'] };  // Merged into globals
  }
};

// Task 2 reads that data
const task2 = {
  name: 'use-posts',
  run: async (config, ctx) => {
    console.log(ctx.globals.posts);  // ['Post 1', 'Post 2']
  }
};
```

---

## Learn More

- **[Built-in Tasks](./builtins/README.md)** — All built-in tasks with docs
- **[Custom Tasks](./custom-tasks.md)** — Write your own tasks
- **[Architecture](./architecture.md)** — Deep dive into the pipeline

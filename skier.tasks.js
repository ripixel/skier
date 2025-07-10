// @ts-check
/** @type {import('./dist/taskRegistry').TaskDef[]} */
exports.tasks = [
  {
    name: 'hello',
    title: 'Say hello',
    run: async () => {
      await new Promise(r => setTimeout(r, 800));
      console.log('👋 Hello from Skier!');
    }
  },
  {
    name: 'wait',
    title: 'Wait for a bit',
    run: async () => {
      await new Promise(r => setTimeout(r, 1200));
      console.log('⏳ Done waiting!');
    }
  },
  {
    name: 'goodbye',
    title: 'Say goodbye',
    run: async () => {
      await new Promise(r => setTimeout(r, 500));
      console.log('👋 Goodbye!');
    }
  }
];

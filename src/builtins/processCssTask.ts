import { TaskDef } from '../taskRegistry';
import fs from 'fs-extra';
import path from 'path';
import CleanCSS from 'clean-css';

export type ProcessCssConfig = {
  from: string;
  to: string;
  minify?: boolean;
};

export function processCssTask(config: ProcessCssConfig): TaskDef {
  return {
    name: 'process-css',
    title: `Process CSS from ${config.from} to ${config.to}`,
    run: async () => {
      try {
        await fs.ensureDir(config.to);
        const files = await fs.readdir(config.from);
        for (const file of files) {
          if (path.extname(file) === '.css') {
            const srcPath = path.join(config.from, file);
            const destPath = path.join(config.to, file);
            let css = await fs.readFile(srcPath, 'utf8');
            if (config.minify) {
              const output = new CleanCSS({}).minify(css);
              if (output.errors.length) {
                throw new Error(`[skier] CSS minification errors in ${file}: ${output.errors.join(', ')}`);
              }
              css = output.styles;
            }
            await fs.writeFile(destPath, css, 'utf8');
            console.log(`[skier] Processed CSS: ${srcPath} -> ${destPath}`);
          }
        }
      } catch (err) {
        throw new Error(`[skier] Failed to process CSS: ${err}`);
      }
    }
  };
}

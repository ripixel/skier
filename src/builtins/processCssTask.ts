import { TaskDef } from '../taskRegistry';
import fs from 'fs-extra';
import path from 'path';
import CleanCSS from 'clean-css';

export type ProcessCssConfig = {
  from: string; // source directory
  to: string;   // output directory
  output: string; // output filename (e.g. styles.min.css)
  minify?: boolean;
};

export function processCssTask(config: ProcessCssConfig): TaskDef {
  return {
    name: 'process-css',
    title: `Process CSS bundle: ${config.output}`,
    run: async () => {
      try {
        await fs.ensureDir(config.to);
        const files = (await fs.readdir(config.from)).filter(f => path.extname(f) === '.css');
        let concatenated = '';
        for (const file of files) {
          const filePath = path.join(config.from, file);
          const css = await fs.readFile(filePath, 'utf8');
          concatenated += css + '\n';
        }
        let outputCss = concatenated;
        if (config.minify) {
          const output = new CleanCSS({}).minify(concatenated);
          if (output.errors.length) {
            throw new Error(`[skier] CSS minification errors for ${config.output}: ${output.errors.join(', ')}`);
          }
          outputCss = output.styles;
        }
        const outFile = path.join(config.to, config.output);
        await fs.writeFile(outFile, outputCss, 'utf8');
        console.log(`[skier] Built CSS bundle: ${outFile}`);
      } catch (err) {
        throw new Error(`[skier] Failed to process CSS: ${err}`);
      }
    }
  };
}

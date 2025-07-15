import { TaskDef } from '../types';
import fs from 'fs-extra';
import path from 'path';
import CleanCSS from 'clean-css';

export interface BundleCssConfig {
  from: string; // source directory
  to: string;   // output directory
  output: string; // output filename (e.g. styles.min.css)
  minify?: boolean;
}

export function bundleCssTask(config: BundleCssConfig): TaskDef<BundleCssConfig> {
  return {
    name: 'bundle-css',
    title: `Bundle CSS from ${config.from}`,
    config,
    run: async (cfg, ctx) => {
      try {
        if (ctx.logger) ctx.logger.debug(`Processing CSS bundle: ${cfg.output}`);
        await fs.ensureDir(cfg.to);
        const files = (await fs.readdir(cfg.from)).filter(f => path.extname(f) === '.css');
        let concatenated = '';
        for (const file of files) {
          const filePath = path.join(cfg.from, file);
          const css = await fs.readFile(filePath, 'utf8');
          concatenated += css + '\n';
        }
        let outputCss = concatenated;
        if (cfg.minify) {
          const output = new CleanCSS({}).minify(concatenated);
          if (output.errors.length) {
            throw new Error(`[skier] CSS minification errors for ${cfg.output}: ${output.errors.join(', ')}`);
          }
          outputCss = output.styles;
          if (ctx.logger) {
            ctx.logger.debug(`Minified CSS: ${cfg.output}`);
          }
        }
        const outFile = path.join(cfg.to, cfg.output);
        await fs.writeFile(outFile, outputCss, 'utf8');
        if (ctx.logger) {
          ctx.logger.debug(`Processed CSS: ${outFile}`);
        }
        return {};
      } catch (err) {
        throw new Error(`[skier] Failed to process CSS: ${err}`);
      }
    }
  };
}

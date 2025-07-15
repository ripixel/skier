import { TaskDef } from '../../types';
import { ensureDir, readdir, readFileUtf8, writeFileUtf8 } from '../../utils/fileHelpers';
import { extname, join } from '../../utils/pathHelpers';
import CleanCSS from 'clean-css';

export interface BundleCssConfig {
  from: string; // source directory
  to: string; // output directory
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
        await ensureDir(cfg.to);
        const files = (await readdir(cfg.from)).filter((f: string) => extname(f) === '.css');
        let concatenated = '';
        for (const file of files) {
          const filePath = join(cfg.from, file);
          const css = await readFileUtf8(filePath);
          concatenated += css + '\n';
        }
        let outputCss = concatenated;
        if (cfg.minify) {
          const output = new CleanCSS({}).minify(concatenated);
          if (output.errors.length) {
            throw new Error(
              `[skier] CSS minification errors for ${cfg.output}: ${output.errors.join(', ')}`,
            );
          }
          outputCss = output.styles;
          if (ctx.logger) {
            ctx.logger.debug(`Minified CSS: ${cfg.output}`);
          }
        }
        const outFile = join(cfg.to, cfg.output);
        await writeFileUtf8(outFile, outputCss);
        if (ctx.logger) {
          ctx.logger.debug(`Processed CSS: ${outFile}`);
        }
        return {};
      } catch (err) {
        throw new Error(`[skier] Failed to process CSS: ${err}`);
      }
    },
  };
}

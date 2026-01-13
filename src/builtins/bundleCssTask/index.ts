import { TaskDef } from '../../types.js';
import { ensureDir, readdir, readFileUtf8, writeFileUtf8 } from '../../utils/fileHelpers.js';
import { extname, join } from '../../utils/pathHelpers.js';
import { throwTaskError } from '../../utils/errors.js';
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
        ctx.logger.debug(`Processing CSS bundle: ${cfg.output}`);
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
            throwTaskError(
              ctx,
              'bundle-css',
              `CSS minification errors for ${cfg.output}: ${output.errors.join(', ')}`,
            );
          }
          outputCss = output.styles;
          ctx.logger.debug(`Minified CSS: ${cfg.output}`);
        }
        const outFile = join(cfg.to, cfg.output);
        await writeFileUtf8(outFile, outputCss);
        ctx.logger.debug(`Wrote CSS: ${outFile}`);
        return {};
      } catch (err) {
        if (err instanceof Error && err.message.startsWith('[skier/')) {
          throw err; // Already a SkierTaskError
        }
        throwTaskError(
          ctx,
          'bundle-css',
          `Failed to process CSS`,
          err instanceof Error ? err : undefined,
        );
      }
    },
  };
}

import { TaskDef } from '../../types';
import { ensureDir, writeFileUtf8, findFilesRecursive } from '../../utils/fileHelpers';
import { join } from '../../utils/pathHelpers';
import { throwTaskError, validateRequiredConfig } from '../../utils/errors';

export interface GenerateSitemapConfig {
  /** Directory to scan for .html files */
  scanDir: string;
  /** Directory to output sitemap file to */
  outDir: string;
  /** (Optional) site base URL for <loc> tags */
  siteUrl?: string;
}

export function generateSitemapTask(
  config: GenerateSitemapConfig,
): TaskDef<GenerateSitemapConfig, Record<string, never>> {
  return {
    name: 'generate-sitemap',
    title: `Generate sitemap.xml in ${config.scanDir}`,
    config,
    run: async (cfg, ctx) => {
      validateRequiredConfig(ctx, 'generate-sitemap', cfg, ['scanDir', 'outDir']);

      try {
        await ensureDir(cfg.scanDir);

        // Use findFilesRecursive to collect all .html files
        const allHtmlFiles = await findFilesRecursive(cfg.scanDir, '.html');

        // Convert to relative paths from scanDir
        const htmlFiles = allHtmlFiles.map((f) =>
          f.startsWith(cfg.scanDir) ? f.slice(cfg.scanDir.length).replace(/^\/+/, '') : f,
        );

        if (htmlFiles.length === 0) {
          ctx.logger.warn('No HTML files found in outDir for sitemap generation.');
        }

        const sitemapEntries = htmlFiles
          .map((relPath) => {
            const url = '/' + relPath.replace(/^\/+/, '');
            const loc = cfg.siteUrl ? `${cfg.siteUrl.replace(/\/$/, '')}${url}` : url;
            return `<url><loc>${loc}</loc></url>`;
          })
          .join('\n    ');

        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n    ${sitemapEntries}\n</urlset>\n`;
        const outPath = join(cfg.outDir, 'sitemap.xml');
        await writeFileUtf8(outPath, xml);
        ctx.logger.debug(`Generated sitemap.xml at ${outPath}`);

        return {};
      } catch (err) {
        if (err instanceof Error && err.message.startsWith('[skier/')) {
          throw err;
        }
        throwTaskError(
          ctx,
          'generate-sitemap',
          'Failed to generate sitemap',
          err instanceof Error ? err : undefined,
        );
      }
    },
  };
}

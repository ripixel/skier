import { TaskDef } from '../../types';
import fs from 'fs-extra';
import path from 'path';

export interface GenerateSitemapConfig {
  /**
   * Directory to scan for .html files
   */
  scanDir: string;
  /**
   * Directory to output sitemap file to
   */
  outDir: string;
  /**
   * (Optional) site base URL for <loc> tags
   */
  siteUrl?: string;
}

export function generateSitemapTask(config: GenerateSitemapConfig): TaskDef<GenerateSitemapConfig> {
  return {
    name: 'generate-sitemap',
    title: `Generate sitemap.xml in ${config.scanDir}`,
    config,
    run: async (cfg, ctx) => {
      try {
        await fs.ensureDir(cfg.scanDir);
        // Recursively find all .html files in outDir
        const htmlFiles: string[] = [];
        async function findHtmlFiles(dir: string, relBase: string) {
          const entries = await fs.readdir(dir, { withFileTypes: true });
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const relPath = path.join(relBase, entry.name);
            if (entry.isDirectory()) {
              await findHtmlFiles(fullPath, relPath);
            } else if (entry.isFile() && entry.name.endsWith('.html')) {
              htmlFiles.push(relPath.replace(/\\/g, '/'));
            }
          }
        }
        await findHtmlFiles(cfg.scanDir, '');
        if (htmlFiles.length === 0) {
          if (ctx.logger) ctx.logger.warn('No HTML files found in outDir for sitemap generation.');
        }
        const sitemapEntries = htmlFiles.map(relPath => {
          const url = '/' + relPath.replace(/^\/+/, '');
          const loc = cfg.siteUrl ? `${cfg.siteUrl.replace(/\/$/, '')}${url}` : url;
          return `<url><loc>${loc}</loc></url>`;
        }).join('\n    ');
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n    ${sitemapEntries}\n</urlset>\n`;
        const outPath = path.join(cfg.outDir, 'sitemap.xml');
        await fs.writeFile(outPath, xml, 'utf8');
        if (ctx.logger) {
          ctx.logger.debug(`Generated sitemap.xml at ${outPath}`);
        }
      } catch (err) {
        if (ctx.logger) {
          ctx.logger.error(`Failed to generate sitemap: ${err}`);
        }
        throw new Error(`[skier] Failed to generate sitemap: ${err}`);
      }
    }
  };
}

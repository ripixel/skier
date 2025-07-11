import { TaskDef } from '../taskRegistry';
import fs from 'fs-extra';
import path from 'path';

export interface GenerateSitemapConfig {
  /**
   * Array of URLs to include in the sitemap (e.g. ['/about', '/blog/post-1'])
   */
  urls: string[];
  /**
   * Output directory for sitemap.xml
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
    title: `Generate sitemap.xml in ${config.outDir}`,
    config,
    run: async (cfg: GenerateSitemapConfig, ctx) => {
      try {
        await fs.ensureDir(cfg.outDir);
        const sitemapEntries = cfg.urls.map(url => {
          const loc = cfg.siteUrl ? `${cfg.siteUrl.replace(/\/$/, '')}${url}` : url;
          return `<url><loc>${loc}</loc></url>`;
        }).join('\n    ');
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n    ${sitemapEntries}\n</urlset>\n`;
        const outPath = path.join(cfg.outDir, 'sitemap.xml');
        await fs.writeFile(outPath, xml, 'utf8');
        if (ctx.logger) {
          ctx.logger.task(`Generated sitemap.xml at ${outPath}`);
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

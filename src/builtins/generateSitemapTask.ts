import { TaskDef } from '../taskRegistry';
import fs from 'fs-extra';
import path from 'path';

export type GenerateSitemapConfig = {
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
};

export function generateSitemapTask(config: GenerateSitemapConfig): TaskDef {
  return {
    name: 'generate-sitemap',
    title: `Generate sitemap.xml in ${config.outDir}`,
    run: async () => {
      try {
        await fs.ensureDir(config.outDir);
        const sitemapEntries = config.urls.map(url => {
          const loc = config.siteUrl ? `${config.siteUrl.replace(/\/$/, '')}${url}` : url;
          return `<url><loc>${loc}</loc></url>`;
        }).join('\n    ');
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n    ${sitemapEntries}\n</urlset>\n`;
        const outPath = path.join(config.outDir, 'sitemap.xml');
        await fs.writeFile(outPath, xml, 'utf8');
        console.log(`[skier] Generated sitemap.xml at ${outPath}`);
      } catch (err) {
        throw new Error(`[skier] Failed to generate sitemap: ${err}`);
      }
    }
  };
}

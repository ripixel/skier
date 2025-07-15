import { Feed } from 'feed';
import { ensureDir, writeFileUtf8 } from '../../utils/fileHelpers';
import { join } from '../../utils/pathHelpers';
import type { SkierItem, TaskDef } from '../../types';

export interface GenerateFeedConfig {
  articles: SkierItem[];
  outDir: string;
  site: {
    title: string;
    description: string;
    id: string;
    link: string;
    language: string;
    favicon: string;
    copyright: string;
    feedLinks: {
      json: string;
      atom: string;
    };
    author: {
      name: string;
      email: string;
      link: string;
    };
  };
}

export function generateFeedTask(
  config: GenerateFeedConfig,
): TaskDef<GenerateFeedConfig, { rssPath: string; jsonPath: string; atomPath: string }> {
  return {
    name: 'generate-feed',
    title: 'Generate RSS/Atom/JSON Feeds',
    config,
    run: async (cfg, ctx) => {
      const logger = ctx.logger;
      const feed = new Feed({
        title: cfg.site.title,
        description: cfg.site.description,
        id: cfg.site.id,
        link: cfg.site.link,
        language: cfg.site.language,
        favicon: cfg.site.favicon,
        copyright: cfg.site.copyright,
        feedLinks: cfg.site.feedLinks,
        author: cfg.site.author,
      });
      // Sort articles by dateObj descending (most recent first)
      const sortedArticles = [...cfg.articles].sort((a, b) => {
        if (!a.dateObj || !b.dateObj) return 0;
        return b.dateObj.getTime() - a.dateObj.getTime();
      });
      sortedArticles.forEach((article, i) => {
        if (!article.title || !article.link || !article.body) {
          throw new Error(
            `[skier/generateRssFeed] Article at index ${i} is missing required fields (title, link, body)`,
          );
        }
        if (
          !article.dateObj ||
          !(article.dateObj instanceof Date) ||
          isNaN(article.dateObj.getTime())
        ) {
          throw new Error(
            `[skier/generateRssFeed] Article '${article.title}' is missing a valid dateObj. Ensure your itemised task outputs a valid dateObj for each item.`,
          );
        }
        feed.addItem({
          title: article.title,
          id: article.link,
          link: article.link,
          description: article.excerpt || article.body,
          content: article.body,
          date: article.dateObj,
          author: [cfg.site.author],
        });
      });
      const rssPath = join(cfg.outDir, 'rss.xml');
      const jsonPath = join(cfg.outDir, 'json.json');
      const atomPath = join(cfg.outDir, 'atom.xml');
      await ensureDir(cfg.outDir);
      await writeFileUtf8(rssPath, feed.rss2());
      await writeFileUtf8(jsonPath, feed.json1());
      await writeFileUtf8(atomPath, feed.atom1());
      logger.debug(`Wrote RSS feed to ${rssPath}`);
      logger.debug(`Wrote JSON feed to ${jsonPath}`);
      logger.debug(`Wrote Atom feed to ${atomPath}`);
      return {
        rssPath,
        jsonPath,
        atomPath,
      };
    },
  };
}

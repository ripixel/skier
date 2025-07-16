import { join, extname, dirname } from '../../utils/pathHelpers';
import { readdir, stat, pathExists } from '../../utils/fileHelpers';

export interface MarkdownFile {
  absPath: string;
  relPath: string;
  dir: string;
}

/**
 * Recursively find all .md files under a directory, returning absolute and relative paths.
 */
export async function findMarkdownFiles(root: string): Promise<MarkdownFile[]> {
  const results: MarkdownFile[] = [];
  async function walk(current: string, relBase: string) {
    const entries = await readdir(current);
    for (const entry of entries) {
      const abs = join(current, entry);
      const rel = relBase ? join(relBase, entry) : entry;
      const st = await stat(abs);
      if (st.isDirectory()) {
        await walk(abs, rel);
      } else if (st.isFile() && extname(entry) === '.md') {
        results.push({ absPath: abs, relPath: rel, dir: dirname(rel) });
      }
    }
  }
  await walk(root, '');
  return results;
}

/**
 * Find the nearest template file (template.hbs/html) up the directory tree from a given file.
 * Returns absolute path or undefined if not found.
 */
export async function findNearestTemplate(startDir: string, root: string, templateExt: string): Promise<string | undefined> {
  let current = startDir;
  while (true) {
    const candidate = join(current, `template${templateExt}`);
    if (await pathExists(candidate)) return candidate;
    if (current === root) break;
    current = dirname(current);
  }
  return undefined;
}

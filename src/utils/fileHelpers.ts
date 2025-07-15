import fs from 'fs-extra';
import path from 'path';

export async function ensureDir(dir: string) {
  return fs.ensureDir(dir);
}

export async function readFileUtf8(file: string): Promise<string> {
  return fs.readFile(file, 'utf8');
}

export async function writeFileUtf8(file: string, content: string): Promise<void> {
  return fs.writeFile(file, content, 'utf8');
}

export async function findFilesRecursive(dir: string, ext: string): Promise<string[]> {
  let results: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(await findFilesRecursive(fullPath, ext));
    } else if (entry.isFile() && entry.name.endsWith(ext)) {
      results.push(fullPath);
    }
  }
  return results;
}

export async function copyDir(src: string, dest: string) {
  return fs.copy(src, dest, { overwrite: true, errorOnExist: false });
}

export async function removeDir(dir: string) {
  return fs.remove(dir);
}

export function filterByExtension(files: string[], ext: string): string[] {
  return files.filter(f => path.extname(f) === ext);
}

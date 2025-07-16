// Shared path helpers to eliminate direct path import in built-ins

/**
 * Returns the directory name of a path (POSIX-only, no Windows support).
 */
export function dirname(filePath: string): string {
  if (!filePath) return '';
  const parts = filePath.split('/');
  parts.pop();
  return parts.length ? parts.join('/') : '';
}

/**
 * Returns the extension of the path, including the leading dot (e.g., ".md").
 */
export function extname(filePath: string): string {
  const i = filePath.lastIndexOf('.');
  return i >= 0 ? filePath.slice(i) : '';
}

/**
 * Returns the last portion of a path, optionally removing a provided extension.
 */
export function basename(filePath: string, ext?: string): string {
  let base = filePath.substring(filePath.lastIndexOf('/') + 1);
  if (ext && base.endsWith(ext)) {
    base = base.slice(0, -ext.length);
  }
  return base;
}

/**
 * Joins all given path segments together using '/' as separator.
 */
export function join(...segments: string[]): string {
  return segments.join('/').replace(/\/+/g, '/');
}

/**
 * Returns the relative path from fromPath to toPath (POSIX-only, no Windows support).
 */
export function relativePath(fromPath: string, toPath: string): string {
  if (!fromPath.endsWith('/')) fromPath += '/';
  if (toPath.startsWith(fromPath)) {
    return toPath.slice(fromPath.length);
  }
  // fallback: remove common prefix
  let i = 0;
  while (i < fromPath.length && fromPath[i] === toPath[i]) i++;
  return toPath.slice(i).replace(/^\//, '');
}

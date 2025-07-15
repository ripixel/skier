import * as path from 'path';

export function normalizeHtml(html: string): string {
  return html.replace(/\r\n/g, '\n').replace(/\s+/g, ' ').trim();
}

export function getTestAssetPath(...segments: string[]): string {
  return path.join(__dirname, 'builtins', ...segments);
}

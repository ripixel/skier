export function titleFromFilename(filename: string): string {
  // Remove extension and leading date if present
  let name = filename.replace(/\.[^.]+$/, '');
  const datePrefix = name.match(/^\d{4}-\d{2}-\d{2}[-_]?(.+)$/);
  if (datePrefix?.[1]) {
    name = datePrefix[1];
  }
  // Replace dashes/underscores with spaces and capitalize
  return name
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export function excerptFromMarkdown(md: string, maxLength = 200): string {
  // Simple excerpt: first paragraph or first maxLength chars
  const firstPara = md.split(/\n\s*\n/)[0] ?? '';
  if (firstPara.length > maxLength) {
    return firstPara.slice(0, maxLength) + '...';
  }
  return firstPara;
}

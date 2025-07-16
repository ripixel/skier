/**
 * Rewrites all internal <a href> links in the provided HTML string according to the config.
 * - stripPrefix: string or string[] of prefixes to remove from hrefs
 * - fromExt: extension to replace (default: '.md')
 * - toExt: extension to use in output (default: '.html')
 * - rootRelative: if true, ensures links start with '/'
 */
export function rewriteLinks(
  html: string,
  opts: {
    stripPrefix?: string | string[];
    fromExt?: string;
    toExt?: string;
    rootRelative?: boolean;
    prefix?: string;
  } = {}
): string {
  const { stripPrefix, fromExt = '.md', toExt = '.html', rootRelative = true } = opts;
  const prefixes = Array.isArray(stripPrefix) ? stripPrefix : stripPrefix ? [stripPrefix] : [];
  return html.replace(/<a\s+([^>]*?)href="([^"]+)"([^>]*)>/g, (match, pre, href, post) => {
    // Ignore external links and anchors
    if (/^(https?:)?\/\//.test(href) || href.startsWith('#')) return match;
    let newHref = href;
    // Remove any configured prefixes
    for (const prefix of prefixes) {
      if (newHref.startsWith(prefix)) {
        newHref = newHref.slice(prefix.length);
        if (!newHref.startsWith('/')) newHref = '/' + newHref;
      }
    }
    // Convert extension (even before # or ?)
    if (fromExt) {
      const extRe = new RegExp(
        fromExt.replace(/[.*+?^${}()|[\]\\]/g, '\$&') + '(?=($|[#?]))'
      );
      if (typeof toExt !== 'undefined') {
        if (toExt === '') {
          newHref = newHref.replace(extRe, '');
        } else {
          newHref = newHref.replace(extRe, toExt);
        }
      }
    }
    // Prefix section if requested (and not external/anchor/../)
    if (
      opts.prefix &&
      !/^([a-zA-Z]+:|#|\/|\.\.\/)/.test(newHref)
    ) {
      newHref = opts.prefix.replace(/\/$/, '') + '/' + newHref.replace(/^\//, '');
    }
    // Ensure root-relative if requested
    if (rootRelative && !newHref.startsWith('/')) newHref = '/' + newHref;
    return `<a ${pre}href="${newHref}"${post}>`;
  });
}

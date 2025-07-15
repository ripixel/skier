import { marked } from 'marked';
import hljs from 'highlight.js';

const renderer = new marked.Renderer();
renderer.code = (code, infostring) => {
  const lang = (infostring || '').match(/\S*/)?.[0];
  if (lang && hljs.getLanguage(lang)) {
    const highlighted = hljs.highlight(code, { language: lang }).value;
    return `<pre><code class="hljs language-${lang}">${highlighted}</code></pre>`;
  }
  const auto = hljs.highlightAuto(code).value;
  return `<pre><code class="hljs">${auto}</code></pre>`;
};
marked.setOptions({ renderer });

export async function renderMarkdown(md: string): Promise<string> {
  return marked.parse(md);
}

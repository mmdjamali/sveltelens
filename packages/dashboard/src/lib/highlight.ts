import hljs from 'highlight.js/lib/core';
import json from 'highlight.js/lib/languages/json';
import sql from 'highlight.js/lib/languages/sql';

// ponytail: core build + the two languages we actually render, not the 190-language bundle.
hljs.registerLanguage('json', json);
hljs.registerLanguage('sql', sql);

export function highlight(code: string, language: 'json' | 'sql'): string {
  return hljs.highlight(code, { language, ignoreIllegals: true }).value;
}

import hljs from 'highlight.js/lib/core';
import css from 'highlight.js/lib/languages/css';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import sql from 'highlight.js/lib/languages/sql';
import xml from 'highlight.js/lib/languages/xml';

// ponytail: core build plus the languages a captured body or query can plausibly be,
// not the 190-language bundle. `xml` is highlight.js' HTML/XML/SVG grammar.
const LANGUAGES = { css, javascript, json, sql, xml };
for (const [name, definition] of Object.entries(LANGUAGES)) hljs.registerLanguage(name, definition);

export type Language = keyof typeof LANGUAGES;

const BY_CONTENT_TYPE: [RegExp, Language][] = [
  [/json/, 'json'],
  [/html|xml|svg/, 'xml'],
  [/javascript|ecmascript/, 'javascript'],
  [/css/, 'css'],
];

/** Language for a response's Content-Type, or null when we have nothing better than plain text. */
export function languageFor(contentType: string | null): Language | null {
  if (!contentType) return null;
  const type = contentType.split(';', 1)[0].trim().toLowerCase();
  return BY_CONTENT_TYPE.find(([pattern]) => pattern.test(type))?.[1] ?? null;
}

export function highlight(code: string, language: Language): string {
  return hljs.highlight(code, { language, ignoreIllegals: true }).value;
}

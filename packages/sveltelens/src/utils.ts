import { randomUUID } from 'node:crypto';
import { BODY_TRUNCATE_BYTES, type BodyCapture } from './types.js';

export function generateId(): string {
  return randomUUID();
}

export function redactHeaders(
  headers: Record<string, string>,
  redact: string[]
): Record<string, string> {
  const redactSet = new Set(redact.map((h) => h.toLowerCase()));
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    result[key] = redactSet.has(key.toLowerCase()) ? '[redacted]' : value;
  }
  return result;
}

export function headersToObject(headers: Headers | Record<string, string> | undefined | null): Record<string, string> {
  if (!headers) return {};
  if (headers instanceof Headers) {
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }
  return { ...headers };
}

const TEXTUAL_CONTENT_TYPE = /^(text\/|application\/(json|xml|x-www-form-urlencoded|javascript)|.*\+json)/i;

export function isTextualContentType(contentType: string | null): boolean {
  if (!contentType) return false;
  return TEXTUAL_CONTENT_TYPE.test(contentType);
}

function redactJsonValue(value: unknown, redactSet: Set<string>): unknown {
  if (Array.isArray(value)) return value.map((v) => redactJsonValue(v, redactSet));
  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      result[key] = redactSet.has(key.toLowerCase()) ? '[redacted]' : redactJsonValue(val, redactSet);
    }
    return result;
  }
  return value;
}

/** Redacts named keys anywhere in a JSON body, at any nesting depth. Non-JSON or unparseable text is returned unchanged. */
export function redactJsonBody(text: string, redactKeys: string[]): string {
  if (redactKeys.length === 0) return text;
  try {
    const parsed = JSON.parse(text);
    const redactSet = new Set(redactKeys.map((k) => k.toLowerCase()));
    return JSON.stringify(redactJsonValue(parsed, redactSet));
  } catch {
    return text;
  }
}

export function captureBody(
  text: string | null,
  contentType: string | null,
  redactKeys: string[] = []
): BodyCapture {
  if (text === null) {
    return { contentType, size: 0, truncated: false, text: null };
  }
  if (!isTextualContentType(contentType)) {
    return { contentType, size: Buffer.byteLength(text), truncated: false, text: null };
  }
  const redactedText = contentType && /json/i.test(contentType) ? redactJsonBody(text, redactKeys) : text;
  const size = Buffer.byteLength(redactedText);
  const truncated = size > BODY_TRUNCATE_BYTES;
  const truncatedText = truncated
    ? Buffer.from(redactedText).subarray(0, BODY_TRUNCATE_BYTES).toString()
    : redactedText;
  return { contentType, size, truncated, text: truncatedText };
}

export function matchesIgnore(path: string, patterns: (string | RegExp)[]): boolean {
  return patterns.some((pattern) => {
    if (pattern instanceof RegExp) return pattern.test(path);
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
      return regex.test(path);
    }
    return path.startsWith(pattern);
  });
}

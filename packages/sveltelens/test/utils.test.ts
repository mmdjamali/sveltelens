import { describe, it, expect } from 'vitest';
import { captureBody, redactJsonBody } from '../src/utils.js';

describe('redactJsonBody', () => {
  it('redacts a top-level matching key', () => {
    const result = redactJsonBody('{"password":"hunter2","name":"bob"}', ['password']);
    expect(JSON.parse(result)).toEqual({ password: '[redacted]', name: 'bob' });
  });

  it('redacts a nested matching key', () => {
    const result = redactJsonBody('{"user":{"password":"x"}}', ['password']);
    expect(JSON.parse(result)).toEqual({ user: { password: '[redacted]' } });
  });

  it('matches keys case-insensitively', () => {
    const result = redactJsonBody('{"Password":"x"}', ['password']);
    expect(JSON.parse(result)).toEqual({ Password: '[redacted]' });
  });

  it('returns non-JSON text unchanged without throwing', () => {
    expect(redactJsonBody('not json', ['password'])).toBe('not json');
  });

  it('is a no-op when redactKeys is empty', () => {
    const text = '{"password":"hunter2"}';
    expect(redactJsonBody(text, [])).toBe(text);
  });
});

describe('captureBody', () => {
  it('redacts JSON body fields and computes size from the redacted text', () => {
    const longSecret = 'x'.repeat(100);
    const text = JSON.stringify({ password: longSecret, name: 'bob' });
    const result = captureBody(text, 'application/json', ['password']);
    expect(result.text).not.toBeNull();
    expect(JSON.parse(result.text as string)).toEqual({ password: '[redacted]', name: 'bob' });
    // Size should reflect the redacted (shorter) text, not the original.
    expect(result.size).toBeLessThan(Buffer.byteLength(text));
    expect(result.size).toBe(Buffer.byteLength(result.text as string));
  });

  it('does not redact non-JSON content types', () => {
    const text = 'password=hunter2';
    const result = captureBody(text, 'text/plain', ['password']);
    expect(result.text).toBe(text);
  });
});

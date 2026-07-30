import { describe, it, expect } from 'vitest';
import { ENTRY_TYPES, ENTRY_TYPE_META, entryTypeForSlug } from '../src/lib/entry-types';

describe('entry type registry', () => {
  it('gives every type a distinct slug that maps back to it', () => {
    const slugs = ENTRY_TYPES.map((type) => ENTRY_TYPE_META[type].slug);
    expect(new Set(slugs).size).toBe(ENTRY_TYPES.length);

    for (const type of ENTRY_TYPES) {
      expect(entryTypeForSlug(ENTRY_TYPE_META[type].slug)).toBe(type);
    }
  });

  it('rejects a slug no type owns, so the routes can 404 on it', () => {
    expect(entryTypeForSlug('bogus')).toBeNull();
    // The type values themselves are not routes — only the slugs are.
    expect(entryTypeForSlug('request')).toBeNull();
  });

  it('fills in every field each type needs to render', () => {
    for (const type of ENTRY_TYPES) {
      const meta = ENTRY_TYPE_META[type];
      expect(meta.label).toBeTruthy();
      expect(meta.badgeLabel).toBeTruthy();
      expect(meta.emptyMessage).toBeTruthy();
      expect(meta.icon).toBeTruthy();
      expect(meta.table).toBeTruthy();
      expect(meta.detail).toBeTruthy();
    }
  });
});

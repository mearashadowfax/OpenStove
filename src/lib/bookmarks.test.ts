import { describe, expect, it } from 'vitest';
import {
  BOOKMARKS_MAX_BYTES,
  parseBookmarks,
  serializeBookmarks,
  toggleBookmark,
} from './bookmarks';

describe('parseBookmarks', () => {
  it('round-trips a serialised list', () => {
    expect(parseBookmarks(serializeBookmarks(['a', 'b']))).toEqual(['a', 'b']);
  });

  it('accepts a URI-encoded value', () => {
    expect(parseBookmarks(encodeURIComponent('["a"]'))).toEqual(['a']);
  });

  it('is empty for missing, malformed or non-list values', () => {
    expect(parseBookmarks(undefined)).toEqual([]);
    expect(parseBookmarks('')).toEqual([]);
    expect(parseBookmarks('not json')).toEqual([]);
    expect(parseBookmarks('{"a":1}')).toEqual([]);
  });

  it('drops non-string entries', () => {
    expect(parseBookmarks('["a", 1, null, "b"]')).toEqual(['a', 'b']);
  });
});

describe('toggleBookmark', () => {
  it('adds an absent id and removes a present one', () => {
    expect(toggleBookmark(['a'], 'b')).toEqual({
      status: 'added',
      ids: ['a', 'b'],
    });
    expect(toggleBookmark(['a', 'b'], 'a')).toEqual({
      status: 'removed',
      ids: ['b'],
    });
  });

  it('refuses to add past the cookie cap but still removes', () => {
    const id = 'x'.repeat(100);
    const full: string[] = [];
    while (serializeBookmarks([...full, id]).length <= BOOKMARKS_MAX_BYTES) {
      full.push(id + full.length);
    }

    expect(toggleBookmark(full, id + 'more')).toEqual({
      status: 'full',
      ids: full,
    });
    expect(toggleBookmark(full, full[0]).status).toBe('removed');
  });
});

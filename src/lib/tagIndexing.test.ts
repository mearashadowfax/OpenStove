import { describe, expect, it } from 'vitest';
import { isIndexedTag, MIN_RECIPES_FOR_INDEXED_TAG } from './tagIndexing';

describe('isIndexedTag', () => {
  it('indexes a tag only once it has enough recipes', () => {
    expect(MIN_RECIPES_FOR_INDEXED_TAG).toBe(4);
    expect(isIndexedTag(1)).toBe(false);
    expect(isIndexedTag(2)).toBe(false);
    expect(isIndexedTag(3)).toBe(false);
    expect(isIndexedTag(MIN_RECIPES_FOR_INDEXED_TAG)).toBe(true);
  });
});

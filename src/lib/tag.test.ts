import { describe, expect, it } from 'vitest';
import { tagHref, tagLabel } from './tag';

describe('tag', () => {
  it('labels a tag with a leading capital', () => {
    expect(tagLabel('salad')).toBe('Salad');
    expect(tagLabel('')).toBe('');
  });

  it('builds a URL-safe tag path', () => {
    expect(tagHref('salad')).toBe('/recipes/tag/salad');
    expect(tagHref('one pot')).toBe('/recipes/tag/one%20pot');
  });
});

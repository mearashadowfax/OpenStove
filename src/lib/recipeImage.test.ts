import { describe, expect, it } from 'vitest';
import { PLACEHOLDER_IMAGE, resolveRecipeImage } from './recipeImage';

const cdn = { baseUrl: 'https://cdn.example.com/' };

describe('resolveRecipeImage', () => {
  it('prefixes a filename with the CDN base URL', () => {
    expect(resolveRecipeImage('tomato-soup.avif', cdn)).toEqual({
      src: 'https://cdn.example.com/tomato-soup.avif',
      fallbackSrc: PLACEHOLDER_IMAGE,
      mimeType: 'image/avif',
      isPlaceholder: false,
    });
  });

  it('strips legacy /images/ prefixes and leading slashes', () => {
    expect(resolveRecipeImage('/images/pie.jpg', cdn).src).toBe(
      'https://cdn.example.com/pie.jpg'
    );
    expect(resolveRecipeImage('/pie.webp', cdn).mimeType).toBe('image/webp');
  });

  it('passes full URLs through untouched', () => {
    const resolved = resolveRecipeImage('https://example.com/a.JPG?x=1', cdn);
    expect(resolved.src).toBe('https://example.com/a.JPG?x=1');
    expect(resolved.mimeType).toBe('image/jpeg');
  });

  it('falls back to the placeholder without a value or a base URL', () => {
    for (const resolved of [
      resolveRecipeImage('', cdn),
      resolveRecipeImage(undefined, cdn),
      resolveRecipeImage('tomato-soup.avif', { baseUrl: undefined }),
    ]) {
      expect(resolved.src).toBe(PLACEHOLDER_IMAGE);
      expect(resolved.isPlaceholder).toBe(true);
      expect(resolved.mimeType).toBe('image/png');
    }
  });
});

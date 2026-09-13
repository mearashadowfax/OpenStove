/**
 * Resolve a recipe's `image` field to everything a renderer needs.
 *
 * Frontmatter stores a CDN filename (`tomato-soup.avif`), a full HTTPS URL,
 * or nothing. Filenames are served from PUBLIC_IMAGE_BASE_URL (Vercel Blob);
 * without a base URL or a value, the placeholder is used. The placeholder
 * lives in `public/` so the same URL works as the client-side `onerror`
 * fallback.
 */

export const PLACEHOLDER_IMAGE = '/placeholder-recipe.png';

export interface ResolvedRecipeImage {
  src: string;
  fallbackSrc: string;
  mimeType: string;
  isPlaceholder: boolean;
}

export interface ResolveRecipeImageOptions {
  /** CDN base URL; defaults to PUBLIC_IMAGE_BASE_URL. Pass `undefined` for none. */
  baseUrl?: string;
}

const MIME_TYPES: Record<string, string> = {
  avif: 'image/avif',
  webp: 'image/webp',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
};

function mimeTypeOf(src: string): string {
  const extension = src.split(/[?#]/)[0].split('.').pop()?.toLowerCase() ?? '';
  return MIME_TYPES[extension] ?? 'image/png';
}

export function resolveRecipeImage(
  image: string | undefined | null,
  options: ResolveRecipeImageOptions = {}
): ResolvedRecipeImage {
  const baseUrl =
    'baseUrl' in options
      ? options.baseUrl
      : import.meta.env.PUBLIC_IMAGE_BASE_URL;

  const src = resolveSrc(image?.trim() ?? '', baseUrl);
  return {
    src,
    fallbackSrc: PLACEHOLDER_IMAGE,
    mimeType: mimeTypeOf(src),
    isPlaceholder: src === PLACEHOLDER_IMAGE,
  };
}

function resolveSrc(value: string, baseUrl: string | undefined): string {
  if (!value) return PLACEHOLDER_IMAGE;
  if (/^https?:\/\//i.test(value)) return value;

  const base = baseUrl?.replace(/\/$/, '');
  if (!base) return PLACEHOLDER_IMAGE;

  const filename = value.replace(/^\/images\//, '').replace(/^\//, '');
  return `${base}/${filename}`;
}

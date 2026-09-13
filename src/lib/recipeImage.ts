import placeholderUrl from '../images/placeholder.png?url';

/**
 * Resolve a recipe image field to a displayable URL.
 * Frontmatter stores a filename (e.g. `tomato-soup.avif`) or a full HTTPS URL.
 * Filenames are prefixed with PUBLIC_IMAGE_BASE_URL when set (CDN / Vercel Blob).
 * Without a base URL or image value, returns the local placeholder.
 */
export function resolveRecipeImage(image: string | undefined | null): string {
  const value = image?.trim();
  if (!value) {
    return placeholderUrl;
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  const base = import.meta.env.PUBLIC_IMAGE_BASE_URL?.replace(/\/$/, '');
  if (!base) {
    return placeholderUrl;
  }

  const filename = value.replace(/^\/images\//, '').replace(/^\//, '');
  return `${base}/${filename}`;
}

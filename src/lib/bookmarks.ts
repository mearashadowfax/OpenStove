/**
 * Bookmarks: the reader's saved recipe ids, kept in one cookie so the
 * browser (Bookmark.astro) and the server-rendered saved page read and
 * write the same thing. This module is the contract; both import it.
 */

export const BOOKMARKS_COOKIE = 'bookmarks';
export const BOOKMARKS_MAX_AGE_DAYS = 180;
/** Browsers cap a cookie at ~4 KB; leave headroom for the attributes. */
export const BOOKMARKS_MAX_BYTES = 3500;

/** Cookie value -> ids. Tolerates a missing, malformed or URI-encoded value. */
export function parseBookmarks(raw: string | undefined | null): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(decodeIfEncoded(raw));
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === 'string')
      : [];
  } catch {
    return [];
  }
}

export function serializeBookmarks(ids: readonly string[]): string {
  return JSON.stringify(ids);
}

export type BookmarkToggle =
  | { status: 'added' | 'removed'; ids: string[] }
  | { status: 'full'; ids: string[] };

/** Add `id` if absent, remove it if present; refuse to add past the cookie cap. */
export function toggleBookmark(
  ids: readonly string[],
  id: string
): BookmarkToggle {
  if (ids.includes(id)) {
    return { status: 'removed', ids: ids.filter(existing => existing !== id) };
  }

  const next = [...ids, id];
  if (serializeBookmarks(next).length > BOOKMARKS_MAX_BYTES) {
    return { status: 'full', ids: [...ids] };
  }
  return { status: 'added', ids: next };
}

function decodeIfEncoded(value: string): string {
  return value.startsWith('%') ? decodeURIComponent(value) : value;
}

/**
 * Which tag pages search engines should index.
 *
 * A tag page with only a few recipes is a near-duplicate of those recipes'
 * cards, and search engines decline to index such thin pages. Those pages are
 * marked noindex and left out of the sitemap; they still exist and are still
 * linked.
 */

export const MIN_RECIPES_FOR_INDEXED_TAG = 4;

export function isIndexedTag(recipeCount: number): boolean {
  return recipeCount >= MIN_RECIPES_FOR_INDEXED_TAG;
}

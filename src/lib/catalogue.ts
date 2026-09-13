import type { CollectionEntry } from 'astro:content';

/**
 * The recipe catalogue: which recipes, in what order, on which page.
 *
 * Pure: pages pass in the collection (`await getCollection('recipes')`)
 * and get back a page of recipes plus everything needed to render links.
 */

export type Recipe = CollectionEntry<'recipes'>;

export const RECIPES_PER_PAGE = 9;
export const MIN_QUERY_LENGTH = 2;

export interface RecipePage {
  items: Recipe[];
  page: number;
  totalPages: number;
  totalItems: number;
  /** Path of a given page number, in this listing's URL style. */
  pathFor: (page: number) => string;
}

export interface ListOptions {
  /** Requested page; clamped into range. Default 1. */
  page?: number;
  perPage?: number;
  /** `newest` (default) sorts by pubDate desc; `given` keeps the input order. */
  order?: 'newest' | 'given';
  pathFor?: (page: number) => string;
}

const newestFirst = (a: Recipe, b: Recipe) =>
  b.data.pubDate.valueOf() - a.data.pubDate.valueOf();

export function listRecipes(
  recipes: Recipe[],
  {
    page = 1,
    perPage = RECIPES_PER_PAGE,
    order = 'newest',
    pathFor = () => '',
  }: ListOptions = {}
): RecipePage {
  const ordered = order === 'newest' ? [...recipes].sort(newestFirst) : recipes;
  const totalPages = Math.max(1, Math.ceil(ordered.length / perPage));
  const current = Math.min(Math.max(1, page), totalPages);

  return {
    items: ordered.slice((current - 1) * perPage, current * perPage),
    page: current,
    totalPages,
    totalItems: ordered.length,
    pathFor,
  };
}

/** Parse a page number from a URL param; anything unusable is page 1. */
export function parsePage(raw: string | null | undefined): number {
  const page = Number.parseInt(raw ?? '', 10);
  return Number.isFinite(page) && page >= 1 ? page : 1;
}

/** `/recipes`, `/recipes?page=2` — for server-rendered listings. */
export function queryPaging(
  basePath: string,
  params: Record<string, string> = {}
): (page: number) => string {
  return page => {
    const search = new URLSearchParams(params);
    if (page > 1) search.set('page', String(page));
    const query = search.toString();
    return query ? `${basePath}?${query}` : basePath;
  };
}

/** `/recipes/tag/salad`, `/recipes/tag/salad/2` — for prerendered listings. */
export function segmentPaging(basePath: string): (page: number) => string {
  return page => (page > 1 ? `${basePath}/${page}` : basePath);
}

export function byTag(recipes: Recipe[], tag: string): Recipe[] {
  return recipes.filter(recipe => (recipe.data.tags ?? []).includes(tag));
}

export function byIds(recipes: Recipe[], ids: readonly string[]): Recipe[] {
  const wanted = new Set(ids);
  return recipes.filter(recipe => wanted.has(recipe.id));
}

export function allTags(recipes: Recipe[]): string[] {
  const tags = new Set<string>();
  for (const recipe of recipes) {
    for (const tag of recipe.data.tags ?? []) tags.add(tag);
  }
  return [...tags].sort();
}

/**
 * Full-text search over title, description, author, id, notes, steps,
 * ingredient names and tags. Title matches come first, then everything
 * else; newest first within each group. A query shorter than
 * MIN_QUERY_LENGTH matches nothing.
 */
export function searchRecipes(recipes: Recipe[], query: string): Recipe[] {
  const q = query.trim().toLowerCase();
  if (q.length < MIN_QUERY_LENGTH) return [];

  const titleMatches: Recipe[] = [];
  const otherMatches: Recipe[] = [];

  for (const recipe of [...recipes].sort(newestFirst)) {
    if (recipe.data.title.toLowerCase().includes(q)) {
      titleMatches.push(recipe);
    } else if (searchableText(recipe).some(text => text.includes(q))) {
      otherMatches.push(recipe);
    }
  }

  return [...titleMatches, ...otherMatches];
}

function searchableText(recipe: Recipe): string[] {
  const { data } = recipe;
  return [
    recipe.id,
    data.description,
    data.author,
    ...(data.recipeNotes ?? []),
    ...(data.tags ?? []),
    ...data.steps.flatMap(step => step.actions),
    ...(data.ingredients ?? []).flatMap(group =>
      group.items.map(item => item.name)
    ),
  ].map(text => text.toLowerCase());
}

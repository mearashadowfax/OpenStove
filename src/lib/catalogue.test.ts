import { describe, expect, it } from 'vitest';
import {
  allTags,
  byIds,
  byTag,
  listRecipes,
  parsePage,
  queryPaging,
  searchRecipes,
  segmentPaging,
  type Recipe,
} from './catalogue';

function recipe(
  id: string,
  pubDate: string,
  extra: Partial<Recipe['data']> = {}
): Recipe {
  return {
    id,
    collection: 'recipes',
    data: {
      title: id.replace(/-/g, ' '),
      description: '',
      pubDate: new Date(pubDate),
      cookingTime: 10,
      image: '',
      imageAlt: '',
      author: 'anonymous',
      steps: [{ actions: ['Cook.'] }],
      ...extra,
    },
  } as Recipe;
}

const soup = recipe('tomato-soup', '2024-03-01', {
  tags: ['soup', 'vegetarian'],
  ingredients: [{ items: [{ name: 'tomatoes' }, { name: 'basil' }] }],
});
const salad = recipe('greek-salad', '2024-02-01', {
  tags: ['salad'],
  description: 'Crunchy and fresh with feta.',
});
const stew = recipe('irish-stew', '2024-01-01', {
  author: 'Basil Fawlty',
  recipeNotes: ['Better the next day.'],
});
const all = [stew, soup, salad];

describe('listRecipes', () => {
  it('sorts newest first and pages', () => {
    const page1 = listRecipes(all, { perPage: 2 });
    expect(page1.items.map(r => r.id)).toEqual(['tomato-soup', 'greek-salad']);
    expect(page1).toMatchObject({ page: 1, totalPages: 2, totalItems: 3 });

    const page2 = listRecipes(all, { perPage: 2, page: 2 });
    expect(page2.items.map(r => r.id)).toEqual(['irish-stew']);
  });

  it('clamps out-of-range pages', () => {
    expect(listRecipes(all, { perPage: 2, page: 9 }).page).toBe(2);
    expect(listRecipes(all, { perPage: 2, page: 0 }).page).toBe(1);
    expect(listRecipes([], {}).totalPages).toBe(1);
  });

  it('keeps the given order when asked', () => {
    expect(listRecipes(all, { order: 'given' }).items.map(r => r.id)).toEqual([
      'irish-stew',
      'tomato-soup',
      'greek-salad',
    ]);
  });

  it('carries the path builder through', () => {
    const page = listRecipes(all, { pathFor: segmentPaging('/recipes/tag/x') });
    expect(page.pathFor(2)).toBe('/recipes/tag/x/2');
  });
});

describe('paging paths', () => {
  it('query style omits page=1 and keeps other params', () => {
    const path = queryPaging('/recipes/search', { query: 'a b' });
    expect(path(1)).toBe('/recipes/search?query=a+b');
    expect(path(3)).toBe('/recipes/search?query=a+b&page=3');
    expect(queryPaging('/recipes')(1)).toBe('/recipes');
    expect(queryPaging('/recipes')(2)).toBe('/recipes?page=2');
  });

  it('segment style appends the page number', () => {
    expect(segmentPaging('/recipes/tag/soup')(1)).toBe('/recipes/tag/soup');
    expect(segmentPaging('/recipes/tag/soup')(2)).toBe('/recipes/tag/soup/2');
  });
});

describe('parsePage', () => {
  it('accepts positive integers and defaults everything else to 1', () => {
    expect(parsePage('3')).toBe(3);
    expect(parsePage('0')).toBe(1);
    expect(parsePage('-2')).toBe(1);
    expect(parsePage('abc')).toBe(1);
    expect(parsePage(null)).toBe(1);
  });
});

describe('filters', () => {
  it('byTag, byIds and allTags', () => {
    expect(byTag(all, 'soup')).toEqual([soup]);
    expect(byIds(all, ['greek-salad', 'missing']).map(r => r.id)).toEqual([
      'greek-salad',
    ]);
    expect(allTags(all)).toEqual(['salad', 'soup', 'vegetarian']);
  });
});

describe('searchRecipes', () => {
  it('puts title matches first, then other matches, newest first', () => {
    // "basil" is in the soup's ingredients and the stew's author.
    expect(searchRecipes(all, 'basil').map(r => r.id)).toEqual([
      'tomato-soup',
      'irish-stew',
    ]);
    // "salad" is greek-salad's title and tag.
    expect(searchRecipes(all, 'SALAD').map(r => r.id)).toEqual(['greek-salad']);
  });

  it('searches notes, description and tags', () => {
    expect(searchRecipes(all, 'next day').map(r => r.id)).toEqual([
      'irish-stew',
    ]);
    expect(searchRecipes(all, 'feta').map(r => r.id)).toEqual(['greek-salad']);
    expect(searchRecipes(all, 'vegetarian').map(r => r.id)).toEqual([
      'tomato-soup',
    ]);
  });

  it('matches nothing below the minimum query length', () => {
    expect(searchRecipes(all, 's')).toEqual([]);
    expect(searchRecipes(all, '  ')).toEqual([]);
  });
});

import { describe, expect, it } from 'vitest';
import { recipeJsonLd, type RecipeData } from './recipeJsonLd';

const base: RecipeData = {
  title: 'Creamy Tomato Soup',
  description: 'A cozy weeknight soup.',
  pubDate: new Date('2024-02-07T00:00:00.000Z'),
  cookingTime: 35,
  image: '',
  imageAlt: '',
  author: 'Alex',
  steps: [
    { title: 'Prep', actions: ['Chop the tomatoes.', 'Mince the garlic.'] },
    { actions: ['Simmer until soft.'] },
  ],
};

const options = {
  url: 'https://openstove.org/recipes/creamy-tomato-soup',
  imageUrl: 'https://openstove.org/placeholder-recipe.png',
};

describe('recipeJsonLd', () => {
  it('describes a minimal recipe', () => {
    const jsonLd = recipeJsonLd(base, options);

    expect(jsonLd).toMatchObject({
      '@type': 'Recipe',
      name: 'Creamy Tomato Soup',
      url: options.url,
      image: options.imageUrl,
      author: { '@type': 'Person', name: 'Alex' },
      datePublished: '2024-02-07T00:00:00.000Z',
      cookTime: 'PT35M',
      recipeInstructions: [
        {
          position: 1,
          name: 'Prep',
          text: 'Chop the tomatoes. Mince the garlic.',
        },
        {
          position: 2,
          name: 'Step 2',
          text: 'Simmer until soft.',
          url: `${options.url}#step-2`,
        },
      ],
    });
    expect(jsonLd).not.toHaveProperty('recipeYield');
    expect(jsonLd).not.toHaveProperty('recipeIngredient');
    expect(jsonLd).not.toHaveProperty('keywords');
    expect(jsonLd).not.toHaveProperty('recipeCategory');
    expect(jsonLd).not.toHaveProperty('recipeCuisine');
  });

  it('derives keywords, category and cuisine from tags', () => {
    const jsonLd = recipeJsonLd(
      { ...base, tags: ['soup', 'tomatoes', 'italian', 'vegetarian'] },
      options
    );

    expect(jsonLd.keywords).toBe('soup, tomatoes, italian, vegetarian');
    expect(jsonLd.recipeCategory).toEqual(['Soup']);
    expect(jsonLd.recipeCuisine).toEqual(['Italian']);
  });

  it('maps a multi-word tag to its category', () => {
    expect(
      recipeJsonLd({ ...base, tags: ['side dish'] }, options).recipeCategory
    ).toEqual(['Side dish']);
  });

  it('omits category and cuisine when no tag names one', () => {
    const jsonLd = recipeJsonLd({ ...base, tags: ['tomatoes'] }, options);

    expect(jsonLd.keywords).toBe('tomatoes');
    expect(jsonLd).not.toHaveProperty('recipeCategory');
    expect(jsonLd).not.toHaveProperty('recipeCuisine');
  });

  it('adds yield and formatted ingredient lines when present', () => {
    const jsonLd = recipeJsonLd(
      {
        ...base,
        servings: 4,
        ingredients: [
          {
            items: [
              { quantity: '1/2', unit: 'cup', name: 'cream' },
              { name: 'salt to taste' },
            ],
          },
        ],
      },
      options
    );

    expect(jsonLd.recipeYield).toBe('4 servings');
    expect(jsonLd.recipeIngredient).toEqual(['½ cup cream', 'salt to taste']);
  });

  it('falls back to Anonymous for a blank author', () => {
    expect(recipeJsonLd({ ...base, author: '' }, options).author).toEqual({
      '@type': 'Person',
      name: 'Anonymous',
    });
  });
});

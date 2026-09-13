import type { CollectionEntry } from 'astro:content';
import { formatIngredientLine } from './quantity';

export type RecipeData = CollectionEntry<'recipes'>['data'];

export interface RecipeJsonLdOptions {
  /** Canonical absolute URL of the recipe page. */
  url: string;
  /** Absolute URL of the recipe image. */
  imageUrl: string;
}

/** schema.org/Recipe structured data for one recipe. */
export function recipeJsonLd(
  recipe: RecipeData,
  { url, imageUrl }: RecipeJsonLdOptions
): Record<string, unknown> {
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.title,
    description: recipe.description,
    image: imageUrl,
    url,
    author: { '@type': 'Person', name: recipe.author || 'Anonymous' },
    publisher: {
      '@type': 'Organization',
      name: 'OpenStove',
      url: 'https://openstove.org',
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    datePublished: recipe.pubDate.toISOString(),
    cookTime: `PT${recipe.cookingTime}M`,
    totalTime: `PT${recipe.cookingTime}M`,
  };

  if (recipe.servings) {
    jsonLd.recipeYield = `${recipe.servings} servings`;
  }

  if (recipe.ingredients && recipe.ingredients.length > 0) {
    jsonLd.recipeIngredient = recipe.ingredients.flatMap(group =>
      group.items.map(item => formatIngredientLine(item))
    );
  }

  if (recipe.steps.length > 0) {
    jsonLd.recipeInstructions = recipe.steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.title || `Step ${index + 1}`,
      text: step.actions.join(' '),
    }));
  }

  return jsonLd;
}

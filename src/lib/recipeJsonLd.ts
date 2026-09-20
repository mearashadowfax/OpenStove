import type { CollectionEntry } from 'astro:content';
import { formatIngredientLine } from './quantity';

export type RecipeData = CollectionEntry<'recipes'>['data'];

export interface RecipeJsonLdOptions {
  /** Canonical absolute URL of the recipe page. */
  url: string;
  /** Absolute URL of the recipe image. */
  imageUrl: string;
}

/** Fragment id of the nth (1-based) step on a recipe page; the JSON-LD step `url` points here. */
export function stepAnchorId(position: number): string {
  return `step-${position}`;
}

/** Tags that name a schema.org recipeCategory (the kind of dish or course). */
const CATEGORY_TAGS: Record<string, string> = {
  breakfast: 'Breakfast',
  bread: 'Bread',
  dessert: 'Dessert',
  dip: 'Dip',
  main: 'Main course',
  salad: 'Salad',
  sandwich: 'Sandwich',
  sidedish: 'Side dish',
  snack: 'Snack',
  soup: 'Soup',
};

/** Tags that name a schema.org recipeCuisine (a regional or national cooking tradition). */
const CUISINE_TAGS: Record<string, string> = {
  asian: 'Asian',
  australian: 'Australian',
  chinese: 'Chinese',
  french: 'French',
  georgian: 'Georgian',
  german: 'German',
  greek: 'Greek',
  indian: 'Indian',
  irish: 'Irish',
  italian: 'Italian',
  japanese: 'Japanese',
  mexican: 'Mexican',
  'middle-eastern': 'Middle Eastern',
  moroccan: 'Moroccan',
  russian: 'Russian',
  swedish: 'Swedish',
  thai: 'Thai',
  ukrainian: 'Ukrainian',
  uyghur: 'Uyghur',
};

function pickLabels(
  tags: readonly string[],
  labels: Record<string, string>
): string[] {
  return tags.flatMap(tag => labels[tag] ?? []);
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

  const tags = recipe.tags ?? [];
  if (tags.length > 0) {
    jsonLd.keywords = tags.join(', ');
  }
  const categories = pickLabels(tags, CATEGORY_TAGS);
  if (categories.length > 0) {
    jsonLd.recipeCategory = categories;
  }
  const cuisines = pickLabels(tags, CUISINE_TAGS);
  if (cuisines.length > 0) {
    jsonLd.recipeCuisine = cuisines;
  }

  if (recipe.ingredients && recipe.ingredients.length > 0) {
    jsonLd.recipeIngredient = recipe.ingredients.flatMap(group =>
      group.items.map(item => formatIngredientLine(item))
    );
  }

  if (recipe.steps.length > 0) {
    jsonLd.recipeInstructions = recipe.steps.map((step, index) => {
      const position = index + 1;
      return {
        '@type': 'HowToStep',
        position,
        name: step.title || `Step ${position}`,
        text: step.actions.join(' '),
        url: `${url}#${stepAnchorId(position)}`,
      };
    });
  }

  return jsonLd;
}

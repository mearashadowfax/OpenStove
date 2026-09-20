import type { CollectionEntry } from 'astro:content';
import { formatIngredientLine } from './quantity';
import { stepAnchorId } from './recipeSteps';

export type RecipeData = CollectionEntry<'recipes'>['data'];

export interface RecipeJsonLdOptions {
  /** Canonical absolute URL of the recipe page. */
  url: string;
  /** Absolute URL of the recipe image. */
  imageUrl: string;
}

/** schema.org recipeCategory (the kind of dish or course) for the tags that name one. */
const DISH_KIND_BY_TAG: Record<string, string> = {
  breakfast: 'Breakfast',
  bread: 'Bread',
  dessert: 'Dessert',
  dip: 'Dip',
  main: 'Main course',
  salad: 'Salad',
  sandwich: 'Sandwich',
  'side dish': 'Side dish',
  snack: 'Snack',
  soup: 'Soup',
};

/** schema.org recipeCuisine (a regional or national cooking tradition) for the tags that name one. */
const CUISINE_BY_TAG: Record<string, string> = {
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

/** The schema.org values named by a recipe's tags, in tag order. */
function schemaValuesFor(
  tags: readonly string[],
  valueByTag: Record<string, string>
): string[] {
  return tags.flatMap(tag => valueByTag[tag] ?? []);
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
  const dishKinds = schemaValuesFor(tags, DISH_KIND_BY_TAG);
  if (dishKinds.length > 0) {
    jsonLd.recipeCategory = dishKinds;
  }
  const cuisines = schemaValuesFor(tags, CUISINE_BY_TAG);
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

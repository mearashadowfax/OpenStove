import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
import { QUANTITY_PATTERN, QUANTITY_PATTERN_MESSAGE } from './lib/quantity';

const recipes = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/recipes' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    recipeNotes: z.array(z.string()).optional(),
    pubDate: z.date(),
    cookingTime: z.number(),
    servings: z.number().optional(),
    scalable: z.boolean().optional(),
    image: z
      .string()
      .describe(
        'CDN filename (e.g. tomato-soup.avif), full HTTPS URL, or empty for placeholder'
      ),
    imageAlt: z.string(),
    author: z.string().default('anonymous'),
    tags: z.array(z.string()).optional(),
    steps: z.array(
      z.object({
        title: z.string().optional(),
        actions: z.array(z.string()),
      })
    ),
    ingredients: z
      .array(
        z.object({
          title: z.string().optional(),
          items: z.array(
            z.object({
              quantity: z
                .string()
                .regex(QUANTITY_PATTERN, QUANTITY_PATTERN_MESSAGE)
                .optional(),
              unit: z.string().optional(),
              name: z.string(),
            })
          ),
        })
      )
      .optional(),
  }),
});

export const collections = { recipes };

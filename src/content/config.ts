import { z, defineCollection } from "astro:content";

const recipesCollection = defineCollection({
    type: "content",
    schema: z.object ({
    title: z.string(),
    description: z.string(),
    recipeNotes: z.array(z.string()).optional(),
    pubDate: z.date(),
    cookingTime: z.number(),
    author: z.string().default('anonymous'),
    tags: z.array(z.string()).optional(),
    steps: z.array(
        z.object({
          title: z.string().optional(),
          actions: z.array(z.string()),
        })
      ),
    ingredients: z.array(
      z.object({
        title: z.string().optional(),
        items: z.array(
          z.object({
            quantity: z.string().optional(),
            name: z.string()
          })
        )})).optional(), 
    }),
});

export const collections = {
    'recipes': recipesCollection,
};
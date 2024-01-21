import { z, defineCollection } from "astro:content";

const recipesCollection = defineCollection({
    type: "content",
    schema: ({ image }) => z.object ({
    title: z.string(),
    description: z.string(),
    recipeNotes: z.string().optional(),
    pubDate: z.date(),
    cookingTime: z.number(),
    image: image(),
    imageAlt: z.string(),
    author: z.string().default('Anonymous'),
    tags: z.array(z.string()),
    })
});

export const collections = {
    'recipes': recipesCollection,
};
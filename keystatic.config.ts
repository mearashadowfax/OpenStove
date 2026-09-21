import { config, fields, collection } from '@keystatic/core';
import { QUANTITY_PATTERN, QUANTITY_PATTERN_MESSAGE } from './src/lib/quantity';

const useGithub = import.meta.env.PROD;

export default config({
  storage: useGithub
    ? {
        kind: 'github',
        repo: 'mearashadowfax/OpenStove',
      }
    : {
        kind: 'local',
      },
  collections: {
    recipes: collection({
      label: 'Recipes',
      slugField: 'title',
      path: 'src/content/recipes/*',
      format: { contentField: 'body' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        cardTitle: fields.text({
          label: 'Card title',
          description:
            'Optional shorter title for recipe cards; leave empty to use the full title.',
          validation: { isRequired: false },
        }),
        description: fields.text({ label: 'Description', multiline: true }),
        author: fields.text({ label: 'Author', defaultValue: 'anonymous' }),
        pubDate: fields.date({ label: 'Publication date' }),
        image: fields.text({
          label: 'Image filename or URL',
          description:
            'CDN filename (e.g. tomato-soup.avif) or full HTTPS URL. Photos are not stored in git.',
        }),
        imageAlt: fields.text({ label: 'Image alt text' }),
        cookingTime: fields.integer({ label: 'Cooking time (minutes)' }),
        servings: fields.integer({
          label: 'Servings',
          validation: { isRequired: false },
        }),
        scalable: fields.checkbox({ label: 'Scalable', defaultValue: true }),
        tags: fields.array(fields.text({ label: 'Tag' }), {
          label: 'Tags',
          itemLabel: props => props.value || 'Tag',
        }),
        steps: fields.array(
          fields.object({
            title: fields.text({ label: 'Step title' }),
            actions: fields.array(
              fields.text({ label: 'Action', multiline: true }),
              {
                label: 'Actions',
                itemLabel: props => props.value || 'Action',
              }
            ),
          }),
          {
            label: 'Steps',
            itemLabel: props => props.fields.title.value || 'Step',
          }
        ),
        ingredients: fields.array(
          fields.object({
            title: fields.text({ label: 'Group title' }),
            items: fields.array(
              fields.object({
                quantity: fields.text({
                  label: 'Quantity',
                  validation: {
                    pattern: {
                      regex: QUANTITY_PATTERN,
                      message: QUANTITY_PATTERN_MESSAGE,
                    },
                  },
                }),
                unit: fields.text({ label: 'Unit' }),
                name: fields.text({ label: 'Name' }),
              }),
              {
                label: 'Items',
                itemLabel: props => props.fields.name.value || 'Ingredient',
              }
            ),
          }),
          {
            label: 'Ingredients',
            itemLabel: props => props.fields.title.value || 'Ingredient group',
          }
        ),
        recipeNotes: fields.array(
          fields.text({ label: 'Note', multiline: true }),
          {
            label: 'Recipe notes',
            itemLabel: props => props.value || 'Note',
          }
        ),
        body: fields.emptyContent({ extension: 'md' }),
      },
    }),
  },
});

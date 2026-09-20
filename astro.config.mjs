import { defineConfig, fontProviders } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import robotsTxt from 'astro-robots-txt';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';
import metaTags from 'astro-meta-tags';
import react from '@astrojs/react';
import keystatic from '@keystatic/astro';

import vercel from '@astrojs/vercel';
import { readRecipeTagCounts } from './src/lib/recipeTagCounts';
import { isIndexedTag } from './src/lib/tagIndexing';
import { tagHref } from './src/lib/tag';

/** Pages served with a noindex meta tag; they stay crawlable but out of the sitemap. */
const NOINDEX_PATHS = ['/contribute', '/recipes/saved', '/recipes/search'];

const thinTagPaths = [...readRecipeTagCounts('./src/content/recipes')]
  .filter(([, count]) => !isIndexedTag(count))
  .map(([tag]) => tagHref(tag));

const sitemapExcludedPaths = new Set([...NOINDEX_PATHS, ...thinTagPaths]);

// https://astro.build/config
export default defineConfig({
  site: 'https://openstove.org',
  prefetch: true,
  trailingSlash: 'never',

  // Old URLs that search engines still request; each was renamed in place.
  redirects: {
    '/recipes/baked-pizza-with-tomatoes-cheese-olives-salami-fried-egg':
      '/recipes/baked-pizza',
    '/recipes/baked-potatoes-garlic-herbs-chanterelles':
      '/recipes/baked-potatoes-garlic-herbs',
    '/recipes/coconut-chocolate-balls-candy-dessert':
      '/recipes/coconut-chocolate-balls',
    '/recipes/fresh-garden-vegetables-salad-mix':
      '/recipes/fresh-garden-vegetables-salad',
    '/recipes/garlic-aioli-chicken-wings-with-glazed-yams':
      '/recipes/garlic-aioli-chicken-wings',
    '/recipes/homemade-chicken-noodle-soup': '/recipes/chicken-noodle-soup',
    '/recipes/homemade-creamy-pumpkin-soup': '/recipes/creamy-pumpkin-soup',
    '/recipes/homemade-pound-cake-with-almonds': '/recipes/pound-cake',
    '/recipes/italian-bolognese-sauce-with-thyme':
      '/recipes/italian-bolognese-sauce',
    '/recipes/juicy-pork-steak-with-rosemary-and-tomatoes':
      '/recipes/juicy-pork-steak',
    '/recipes/penne-pasta-with-pesto': '/recipes/pasta-with-pesto',
    '/recipes/raw-avocado-chocolate-mousse-with-hazelnuts':
      '/recipes/raw-avocado-chocolate-mousse',
    '/recipes/russian-olivier-salad-with-salmon-caviar':
      '/recipes/olivier-salad',
    '/recipes/tag/Italian': '/recipes/tag/italian',
    // Tags merged into their plural / broader form.
    '/recipes/tag/almond': '/recipes/tag/almonds',
    '/recipes/tag/black%20beans': '/recipes/tag/beans',
    '/recipes/tag/black beans': '/recipes/tag/beans',
    '/recipes/tag/egg': '/recipes/tag/eggs',
    '/recipes/tag/mushroom': '/recipes/tag/mushrooms',
    '/recipes/tag/noodle': '/recipes/tag/noodles',
    '/recipes/tag/potato': '/recipes/tag/potatoes',
    '/recipes/tag/tomato': '/recipes/tag/tomatoes',
  },

  fonts: [
    {
      name: 'Figtree',
      cssVariable: '--font-figtree',
      provider: fontProviders.google(),
      weights: [400, 500, 600, 700, 800],
      styles: ['normal'],
      subsets: ['latin', 'latin-ext'],
      fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'],
    },
    {
      name: 'Fraunces',
      cssVariable: '--font-fraunces',
      provider: fontProviders.google(),
      weights: [500, 600, 700],
      styles: ['normal'],
      subsets: ['latin', 'latin-ext'],
      fallbacks: ['ui-serif', 'Georgia', 'serif'],
    },
  ],

  integrations: [
    robotsTxt({
      policy: [
        {
          userAgent: '*',
          allow: '/',
          disallow: ['/404', '/keystatic', '/api'],
          crawlDelay: 1,
        },
      ],
    }),
    sitemap({
      filter: page => !sitemapExcludedPaths.has(new URL(page).pathname),
    }),
    icon(),
    metaTags(),
    react(),
    keystatic(),
  ],

  vite: {
    plugins: [tailwindcss()],
  },

  output: 'server',

  experimental: {
    clientPrerender: true,
  },

  adapter: vercel({
    // Use Vercel Image Optimization in production instead of bundling Sharp
    // into the serverless function (avoids pnpm/@img native binary NFT issues).
    imageService: true,
  }),
});

import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import robotsTxt from 'astro-robots-txt';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';
import metaTags from 'astro-meta-tags';
import react from '@astrojs/react';
import keystatic from '@keystatic/astro';

import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  site: 'https://openstove.org',
  prefetch: true,
  trailingSlash: 'never',

  integrations: [
    robotsTxt({
      policy: [
        {
          userAgent: '*',
          allow: '/',
          disallow: [
            '/404',
            '/recipes/saved',
            '/recipes/search',
            '/contribute',
            '/keystatic',
            '/api',
          ],
          crawlDelay: 1,
        },
      ],
    }),
    sitemap(),
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

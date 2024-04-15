import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import robotsTxt from "astro-robots-txt";
import sitemap from "@astrojs/sitemap";
import icon from "astro-icon";
import metaTags from "astro-meta-tags";

// https://astro.build/config
export default defineConfig({
  site: "https://openstove.org",
  prefetch: true,
  integrations: [tailwind(), robotsTxt({
    policy: [{
      userAgent: 'Googlebot',
      allow: '/',
      disallow: '',
      crawlDelay: 10
    }, {
      userAgent: 'Yandex',
      allow: '/',
      disallow: '',
      crawlDelay: 2
    }, {
      userAgent: 'archive.org_bot',
      allow: '/',
      disallow: '',
      crawlDelay: 2
    }, {
      userAgent: '*',
      allow: '',
      disallow: '/'
    }]
  }), sitemap(), icon(), metaTags()],
  output: 'server',
  experimental: {
    clientPrerender: true
  }
});
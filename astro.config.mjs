import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";

import icon from "astro-icon";

// https://astro.build/config
export default defineConfig({
  prefetch: true,
  integrations: [tailwind(), icon()],
  output: 'server',
  experimental: {
    clientPrerender: true,
  },
});
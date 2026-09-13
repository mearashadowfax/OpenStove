<div align="center">
  <a href="https://openstove.org" target="_blank"><img src="src/icons/logo-readme.svg" alt="OpenStove Logo"/></a>
</div>
<p>&nbsp;</p>

**OpenStove** is a curated collection of community-crafted recipes – no ads, no fees, just a love for food and shared knowledge. Browse it live at [openstove.org](https://openstove.org).

Application code and recipe text live in this public repository. Recipes are Markdown files managed through Astro content collections, while recipe photographs are stored separately in Vercel Blob so licensed image files stay out of the public Git history.

## Features

- Community-maintained Markdown recipes
- Search, tags, pagination, and cookie-based bookmarks (per browser, no account)
- Ingredient scaling
- Print-friendly recipe pages and browser PDF export
- Public recipe contribution form with GitHub Issue review
- Keystatic CMS for maintainers
- Recipe images delivered through Vercel Blob
- Responsive light and dark themes

## Technology

- [Astro 7](https://astro.build/) with server rendering
- [Tailwind CSS 4](https://tailwindcss.com/)
- TypeScript
- [Keystatic](https://keystatic.com/) for Git-backed content editing
- [Vercel](https://vercel.com/) for hosting and serverless routes
- [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) for recipe photographs
- GitHub Issues for form submissions
- Cloudflare Turnstile for optional spam protection

## Project structure

```text
src/
├── components/          Reusable Astro components
├── content/recipes/     Markdown recipe collection
├── images/              UI illustrations
├── layouts/             Shared page layouts
├── lib/                 Image and contribution utilities
├── pages/               Pages and server API routes
└── styles/              Tailwind v4 global styles
keystatic.config.ts      Maintainer CMS schema
scripts/                 Maintainer utilities
vercel.json              Production headers and CSP
```

## Getting started

```bash
git clone https://github.com/mearashadowfax/OpenStove.git
cd OpenStove
pnpm install
cp .env.example .env
pnpm dev
```

Available scripts:

```bash
pnpm dev            # Start the local server with hot reloading
pnpm build          # Type-check and create the production server build
pnpm preview        # Serve the production build locally
pnpm test           # Run the test suite
pnpm format:check   # Check formatting
pnpm format:fix     # Apply formatting
```

For other Astro CLI commands, see [Astro's CLI documentation](https://docs.astro.build/en/reference/cli-reference/).

## Recipes

Recipes live in [`src/content/recipes`](src/content/recipes) and are validated by [`src/content.config.ts`](src/content.config.ts). The Markdown filename is the recipe ID and URL path – do not add a separate `slug` field to recipe frontmatter:

```text
src/content/recipes/creamy-tomato-soup.md
→ /recipes/creamy-tomato-soup
```

### Images

Recipe photographs are publicly readable from Vercel Blob, but their source files are kept out of this repository for licensing reasons. Frontmatter stores only the Blob filename:

```yaml
image: 'tomato-soup.avif'
imageAlt: 'A bowl of creamy tomato soup'
```

The application combines the filename with `PUBLIC_IMAGE_BASE_URL`. Without that variable (e.g. in a fresh local setup), or when an image is unavailable, recipe pages display the repository's fallback image.

To upload photographs, keep the originals in a private local or backed-up directory and run:

```bash
BLOB_READ_WRITE_TOKEN=vercel_blob_... \
pnpm upload:images --dir /path/to/private-recipe-images
```

The script uploads AVIF files under the `recipes/` Blob prefix without random suffixes and prints the required `PUBLIC_IMAGE_BASE_URL`.

Never commit recipe photographs or Blob write tokens to this repository.

## Contributing recipes

There are two supported workflows:

1. Use the [online contribution form](https://openstove.org/contribute). It creates a GitHub Issue containing generated Markdown for maintainer review.
2. Follow [`CONTRIBUTING.md`](CONTRIBUTING.md) and open a pull request.

The contribution API requires:

```text
GITHUB_TOKEN       Fine-grained PAT with Issues: read and write
GITHUB_REPO        mearashadowfax/OpenStove
```

Cloudflare Turnstile is supported through `PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`.

## Keystatic CMS

Maintainers can edit recipe Markdown through Keystatic:

- **Local**: run `pnpm dev` and open [http://127.0.0.1:4321/keystatic](http://127.0.0.1:4321/keystatic). Local mode reads and writes the working tree directly.
- **Production**: uses GitHub authentication; only users with write access to the OpenStove repository can make changes.

## Production deployment

1. Import this repository into Vercel.
2. Connect a public-read Vercel Blob store.
3. Upload recipe AVIFs and set `PUBLIC_IMAGE_BASE_URL`.
4. Configure the contribution and Keystatic environment variables.
5. Deploy the `main` branch.
6. Verify recipe images, `/contribute`, `/keystatic`, and print/PDF output.

See [`.env.example`](.env.example) for the complete environment variable list.

## License

OpenStove code and recipe text are licensed under [CC BY-NC-SA 4.0](http://creativecommons.org/licenses/by-nc-sa/4.0/) – see the [full license](https://github.com/mearashadowfax/OpenStove/blob/main/LICENSE) for details. Recipe photographs are not included in this repository and are licensed separately.

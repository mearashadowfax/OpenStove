<div align="center">
  <a href="https://openstove.org" target="_blank"><img src="src/icons/logo-readme.svg" alt="OpenStove Logo"/></a>
</div>
<p>&nbsp;</p>

**OpenStove** is a community recipe site where every recipe is a Markdown file in this repository. Readers get recipes with no ads, no fees, and no account – just the dish, scalable to any number of servings. Contributors add a recipe with a form or a pull request, and because both the code and the recipe text are open, anyone can fork the whole site and run their own.

Browse it live at [openstove.org](https://openstove.org).

- **Open content.** 80+ recipes, licensed under CC BY-NC-SA 4.0, each one a plain Markdown file you can copy, edit, or fork.
- **No account needed.** Bookmarks are stored in your browser only. Nothing to sign up for, nothing tracked.
- **Cooks for any table.** A servings stepper scales every quantity, and a US / metric toggle converts cups, pounds and ounces to grams and millilitres.
- **Two ways to contribute.** A web form that needs no Git knowledge, or a pull request for a Markdown file. Both are reviewed by maintainers on GitHub.
- **Print-ready.** Every recipe page prints cleanly and exports to PDF from the browser.
- **Built to fork.** Astro, Tailwind CSS, Keystatic CMS and Vercel. Clone, `pnpm dev`, and you have a working recipe site.

A recipe is one file. Its name is its URL:

```yaml
# src/content/recipes/creamy-tomato-soup.md  →  openstove.org/recipes/creamy-tomato-soup
---
title: 'Creamy tomato soup'
cookingTime: 40
ingredients:
  - items:
      - { quantity: '2', unit: 'cup', name: 'vegetable broth' }
      - { quantity: '1/4', unit: 'cup', name: 'heavy cream' }
steps:
  - actions: ['Simmer for 25 minutes, then blend until smooth.']
tags: ['soup', 'vegetarian']
---
```

---

## Table of contents

- [Getting started](#getting-started)
- [Contributing a recipe](#contributing-a-recipe)
- [Recipe format](#recipe-format)
- [Recipe photos](#recipe-photos)
- [Editing with Keystatic](#editing-with-keystatic)
- [Deploying your own](#deploying-your-own)
- [Project structure](#project-structure)
- [Built with](#built-with)
- [License](#license)

---

## Getting started

You need **Node.js 22.12 or newer** and [pnpm](https://pnpm.io/installation).

```bash
git clone https://github.com/mearashadowfax/OpenStove.git
cd OpenStove
pnpm install
cp .env.example .env
pnpm dev
```

Open [http://localhost:4321](http://localhost:4321). The site runs fully without any environment variables: recipe pages show a placeholder photo, and the contribute form is disabled until you add GitHub credentials (see [Deploying your own](#deploying-your-own)).

Other scripts:

```bash
pnpm build          # Type-check and create the production build
pnpm preview        # Serve the production build locally
pnpm test           # Run the test suite
pnpm format:check   # Check formatting
pnpm format:fix     # Apply formatting
```

---

## Contributing a recipe

**No Git?** Use the [contribution form](https://openstove.org/contribute). It opens a GitHub Issue with the generated Markdown, which maintainers review and merge.

**Prefer a pull request?** Add a file to `src/content/recipes/` and open a PR. The full guide, including the recipe template and naming rules, is in [`CONTRIBUTING.md`](CONTRIBUTING.md).

> Recipe text you contribute is licensed under CC BY-NC-SA 4.0, like the rest of the project. Photo rights stay with you unless you grant them explicitly.

---

## Recipe format

Recipes live in [`src/content/recipes`](src/content/recipes) and are validated against the schema in [`src/content.config.ts`](src/content.config.ts) at build time. The frontmatter **is** the recipe; the Markdown body is unused.

The filename is the recipe ID and URL path, so **do not add a `slug` field** to the frontmatter.

Key rules:

- **Quantities are numbers only.** `'1/2'`, `'1.5'`, `'1 1/2'` and `'3-4'` are valid; `'125g'` is rejected. Put the unit in `unit`.
- **Scaling.** By default a recipe is written for one serving and readers get a stepper. For a whole dish (cake, pie, loaf) set `servings: 8` and `scalable: false`; readers then see "Serves 8".
- **Tags.** Lowercase, up to three, each one gets its own page.

A blank copy with no placeholders is in [`Ready-to-go-Template.md`](Ready-to-go-Template.md).

---

## Recipe photos

Photos are **not** in this repository. They are served from Vercel Blob so licensed image files stay out of the public Git history. Frontmatter stores only the filename:

```yaml
image: 'tomato-soup.avif'
imageAlt: 'A bowl of creamy tomato soup'
```

The site prepends `PUBLIC_IMAGE_BASE_URL` to that filename. Without the variable, or when a photo is missing, the page shows the fallback image from `public/placeholder-recipe.png`.

To upload photos, keep the originals in a private directory and run:

```bash
BLOB_READ_WRITE_TOKEN=vercel_blob_... \
pnpm upload:images --dir /path/to/private-recipe-images
```

The script uploads every `.avif` under the `recipes/` Blob prefix and prints the `PUBLIC_IMAGE_BASE_URL` to set.

> **Never commit recipe photos or Blob write tokens to this repository.**

---

## Editing with Keystatic

Maintainers can edit recipes in a web UI instead of raw YAML:

- **Locally:** run `pnpm dev` and open [http://127.0.0.1:4321/keystatic](http://127.0.0.1:4321/keystatic). It reads and writes files in your working tree directly.
- **In production:** `/keystatic` uses GitHub authentication. Only users with write access to the repository can make changes.

---

## Deploying your own

OpenStove is built for [Vercel](https://vercel.com/), using server rendering and serverless routes.

1. Fork and import this repository into Vercel.
2. Create a public-read Vercel Blob store and connect it to the project.
3. Upload your recipe photos with `pnpm upload:images` and set `PUBLIC_IMAGE_BASE_URL`.
4. Set the contribute-form variables. All three are required in production:
   ```text
   GITHUB_TOKEN               Fine-grained PAT with Issues: read and write
   GITHUB_REPO                your-user/your-fork
   TURNSTILE_SECRET_KEY       Cloudflare Turnstile secret (spam protection)
   PUBLIC_TURNSTILE_SITE_KEY  Cloudflare Turnstile site key
   ```
   Locally, Turnstile is waived; only the GitHub variables are needed.
5. Set the Keystatic GitHub-app variables if you want the production CMS.
6. Deploy the `main` branch, then check recipe images, `/contribute`, `/keystatic` and print output.

[`.env.example`](.env.example) lists every variable with a comment.

---

## Project structure

```text
src/
├── components/          Reusable Astro components
├── content/recipes/     Markdown recipe collection
├── images/              UI illustrations
├── layouts/             Shared page layouts
├── lib/                 Quantity parsing, scaling, image and contribution utilities
├── pages/               Pages and server API routes
└── styles/              Tailwind v4 global styles
keystatic.config.ts      Maintainer CMS schema
scripts/                 Photo upload and build utilities
vercel.json              Production headers and CSP
```

---

## Built with

- [Astro 7](https://astro.build/) with server rendering
- [Tailwind CSS 4](https://tailwindcss.com/)
- TypeScript
- [Keystatic](https://keystatic.com/) for Git-backed content editing
- [Vercel](https://vercel.com/) for hosting and serverless routes, [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) for photos
- GitHub Issues for form submissions
- [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/) for spam protection

---

## License

Code and recipe text are licensed under [CC BY-NC-SA 4.0](http://creativecommons.org/licenses/by-nc-sa/4.0/) – see [`LICENSE`](LICENSE). Recipe photographs are not included in this repository and are licensed separately.

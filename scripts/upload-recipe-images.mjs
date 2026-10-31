#!/usr/bin/env node
/**
 * Upload recipe AVIFs from a local folder to Vercel Blob.
 *
 *   pnpm upload:images                  upload photos not yet in the store
 *   pnpm upload:images tomato-soup.avif upload (and overwrite) specific photos
 *   pnpm upload:images --all            re-upload every photo, overwriting
 *   pnpm upload:images --dry-run        show what would be uploaded
 *
 * BLOB_READ_WRITE_TOKEN is read from .env.local (`vercel env pull .env.local`).
 * Photos are read from --dir, else RECIPE_IMAGES_DIR, else ../OpenStoveImages
 * next to the repo.
 */

import { list, put } from '@vercel/blob';
import { readdir, readFile } from 'node:fs/promises';
import { basename, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    dir: { type: 'string' },
    prefix: { type: 'string', default: 'recipes' },
    all: { type: 'boolean', default: false },
    'dry-run': { type: 'boolean', default: false },
  },
});

const sourceDir = resolve(
  values.dir ??
    process.env.RECIPE_IMAGES_DIR ??
    join(repoRoot, '..', 'OpenStoveImages')
);
const prefix = values.prefix;
const dryRun = values['dry-run'];

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error(
    'BLOB_READ_WRITE_TOKEN is not set. Run `vercel env pull .env.local` or add it to .env.local.'
  );
  process.exit(1);
}

let available;
try {
  available = (await readdir(sourceDir)).filter(
    name => extname(name).toLowerCase() === '.avif'
  );
} catch {
  console.error(
    `Cannot read ${sourceDir}. Pass --dir or set RECIPE_IMAGES_DIR.`
  );
  process.exit(1);
}

/** Every pathname already under the prefix in the Blob store. */
async function listUploaded() {
  const uploaded = new Set();
  let cursor;
  do {
    const page = await list({ prefix: `${prefix}/`, cursor });
    for (const blob of page.blobs) uploaded.add(basename(blob.pathname));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return uploaded;
}

let files;
if (positionals.length > 0) {
  files = positionals.map(arg => basename(arg));
  const missing = files.filter(file => !available.includes(file));
  if (missing.length > 0) {
    console.error(`Not found in ${sourceDir}: ${missing.join(', ')}`);
    process.exit(1);
  }
} else if (values.all) {
  files = available;
} else {
  const uploaded = await listUploaded();
  files = available.filter(file => !uploaded.has(file));
}

if (files.length === 0) {
  console.log(
    `Nothing to upload: every photo in ${sourceDir} is in the store.`
  );
  process.exit(0);
}

console.log(
  `${dryRun ? 'Would upload' : 'Uploading'} ${files.length} file(s) from ${sourceDir}…`
);

let baseUrl = '';

for (const file of files) {
  if (dryRun) {
    console.log(`  ${file}`);
    continue;
  }
  const body = await readFile(join(sourceDir, file));
  const blob = await put(`${prefix}/${file}`, body, {
    access: 'public',
    contentType: 'image/avif',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  baseUrl ||= blob.url.slice(0, blob.url.lastIndexOf('/'));
  console.log(`✓ ${file} → ${blob.url}`);
}

if (baseUrl && process.env.PUBLIC_IMAGE_BASE_URL !== baseUrl) {
  console.log(`\nSet PUBLIC_IMAGE_BASE_URL=${baseUrl}`);
}

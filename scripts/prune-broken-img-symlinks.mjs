/**
 * Removes broken @img/* symlinks under pnpm's virtual store.
 * Stale musl/glibc Sharp links (e.g. after a sharp major bump) cause
 * @astrojs/vercel NFT bundling to fail with ENOENT on realpath().
 */
import fs from 'node:fs';
import path from 'node:path';

const imgDir = path.join('node_modules', '.pnpm', 'node_modules', '@img');

if (!fs.existsSync(imgDir)) {
  process.exit(0);
}

for (const name of fs.readdirSync(imgDir)) {
  const fullPath = path.join(imgDir, name);
  try {
    fs.realpathSync(fullPath);
  } catch {
    fs.unlinkSync(fullPath);
    console.log(`[prune-broken-img-symlinks] removed ${fullPath}`);
  }
}

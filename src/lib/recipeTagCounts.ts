/**
 * Counts how many recipes carry each tag by reading recipe frontmatter
 * directly from disk. Used by astro.config.mjs, where `astro:content`
 * is not available, to keep thin tag pages out of the sitemap.
 *
 * Handles both frontmatter forms: `tags: ['a', 'b']` and a `- a` block list.
 */
import fs from 'node:fs';
import path from 'node:path';

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---/;
const INLINE_TAGS = /^tags:\s*\[([^\]]*)\]/m;
const BLOCK_TAGS = /^tags:\s*\r?\n((?:[ \t]+-[^\n]*\r?\n?)+)/m;

const unquote = (value: string): string =>
  value.trim().replace(/^(['"])(.*)\1$/, '$2');

function tagsOf(markdown: string): string[] {
  const frontmatter = markdown.match(FRONTMATTER)?.[1] ?? '';
  const inline = frontmatter.match(INLINE_TAGS);
  if (inline) {
    return inline[1].split(',').map(unquote).filter(Boolean);
  }
  const block = frontmatter.match(BLOCK_TAGS);
  if (block) {
    return block[1]
      .split('\n')
      .map(line => unquote(line.replace(/^[ \t]+-/, '')))
      .filter(Boolean);
  }
  return [];
}

/** tag → number of recipes carrying it */
export function readRecipeTagCounts(recipesDir: string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const file of fs.readdirSync(recipesDir)) {
    // Same file rule as the recipes collection in src/content.config.ts.
    if (!/^[^_].*\.mdx?$/.test(file)) continue;
    const markdown = fs.readFileSync(path.join(recipesDir, file), 'utf8');
    for (const tag of tagsOf(markdown)) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return counts;
}

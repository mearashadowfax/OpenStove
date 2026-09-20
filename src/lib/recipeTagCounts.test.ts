import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { readRecipeTagCounts } from './recipeTagCounts';

function recipesDir(files: Record<string, string>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'recipes-'));
  for (const [name, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, name), content);
  }
  return dir;
}

describe('readRecipeTagCounts', () => {
  it('counts inline and block-list tags, skipping drafts and untagged recipes', () => {
    const dir = recipesDir({
      'a.md': '---\ntitle: A\ntags: [\'soup\', "italian", tomato]\n---\n',
      'b.md': '---\ntitle: B\ntags:\n  - soup\n  - "vegan"\nsteps: []\n---\n',
      'c.md': '---\ntitle: C\n---\n',
      '_draft.md': "---\ntags: ['soup']\n---\n",
    });

    expect(readRecipeTagCounts(dir)).toEqual(
      new Map([
        ['soup', 2],
        ['italian', 1],
        ['tomato', 1],
        ['vegan', 1],
      ])
    );
  });
});

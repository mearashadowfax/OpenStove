import { describe, expect, it, vi } from 'vitest';
import {
  CONTRIBUTE_FIELDS,
  RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_MS,
  buildRecipeMarkdown,
  createContributionHandler,
  isContributionConfigured,
  parseContribution,
  type ContributePayload,
} from './contribution';

function formOf(fields: Record<string, string>): FormData {
  const form = new FormData();
  for (const [name, value] of Object.entries(fields)) form.set(name, value);
  return form;
}

const validFields = {
  title: 'Creamy Tomato Soup!',
  description: 'A cozy weeknight soup.',
  author: 'Alex',
  cookingTime: '35',
  servings: '1',
  ingredients: '2|cups|tomatoes\n1|tbsp|olive oil',
  steps: '## Prep\nChop the tomatoes.\n## Cook\nSimmer until soft.',
  notes: 'Add cream at the end.',
  tags: 'soup, vegetarian',
};

const validPayload: ContributePayload = {
  title: 'Creamy Tomato Soup!',
  description: 'A cozy weeknight soup.',
  author: 'Alex',
  cookingTime: 35,
  servings: 1,
  scalable: true,
  ingredients: '2|cups|tomatoes\n1|tbsp|olive oil',
  steps: '## Prep\nChop the tomatoes.\n## Cook\nSimmer until soft.',
  notes: 'Add cream at the end.',
  tags: 'soup, vegetarian',
  imageUrl: '',
};

describe('CONTRIBUTE_FIELDS', () => {
  it('has unique names and a label on every field', () => {
    const names = CONTRIBUTE_FIELDS.map(field => field.name);
    expect(new Set(names).size).toBe(names.length);
    expect(CONTRIBUTE_FIELDS.every(field => field.label.length > 0)).toBe(true);
  });
});

describe('isContributionConfigured', () => {
  it('needs GitHub always and Turnstile only in production', () => {
    const github = { GITHUB_TOKEN: 't', GITHUB_REPO: 'o/r' };
    expect(isContributionConfigured({ ...github, PROD: false })).toBe(true);
    expect(isContributionConfigured({ ...github, PROD: true })).toBe(false);
    expect(
      isContributionConfigured({
        ...github,
        PROD: true,
        TURNSTILE_SECRET_KEY: 's',
      })
    ).toBe(true);
    expect(isContributionConfigured({ GITHUB_TOKEN: 't', PROD: false })).toBe(
      false
    );
  });
});

describe('parseContribution', () => {
  it('accepts a valid submission', () => {
    const result = parseContribution(formOf(validFields));
    expect(result).toEqual({ ok: true, payload: validPayload });
  });

  it('rejects missing required fields', () => {
    const { title: _, ...withoutTitle } = validFields;
    expect(parseContribution(formOf(withoutTitle))).toEqual({
      ok: false,
      message: 'Dish title is required.',
    });
  });

  it('enforces the field table limits', () => {
    expect(
      parseContribution(formOf({ ...validFields, title: 'x'.repeat(121) }))
    ).toMatchObject({ ok: false, message: /at most 120/ });
    expect(
      parseContribution(formOf({ ...validFields, cookingTime: '1000' }))
    ).toMatchObject({ ok: false, message: /between 1 and 999/ });
    expect(
      parseContribution(formOf({ ...validFields, cookingTime: 'soon' }))
    ).toMatchObject({ ok: false });
  });

  it('models servings and scalability independently', () => {
    expect(
      parseContribution(formOf({ ...validFields, servings: '4' }))
    ).toMatchObject({ ok: true, payload: { servings: 4, scalable: true } });
    expect(
      parseContribution(
        formOf({ ...validFields, servings: '8', fixedServings: 'on' })
      )
    ).toMatchObject({ ok: true, payload: { servings: 8, scalable: false } });
    expect(parseContribution(formOf({ ...validFields, servings: '' }))).toEqual(
      { ok: false, message: 'Servings is required.' }
    );
  });
});

describe('buildRecipeMarkdown', () => {
  const today = new Date('2026-09-14T12:00:00Z');

  it('builds slug and frontmatter from a valid payload', () => {
    const { slug, markdown } = buildRecipeMarkdown(validPayload, today);

    expect(slug).toBe('creamy-tomato-soup');
    expect(markdown).toContain('title: "Creamy Tomato Soup!"');
    expect(markdown).toContain("author: 'Alex'");
    expect(markdown).toContain('pubDate: 2026-09-14');
    expect(markdown).toContain('cookingTime: 35');
    expect(markdown).not.toContain('servings:');
    expect(markdown).not.toContain('scalable:');
    expect(markdown).toContain("quantity: '2'");
    expect(markdown).toContain("name: 'tomatoes'");
    expect(markdown).toContain("title: 'Prep'");
    expect(markdown).toContain("tags: ['soup', 'vegetarian']");
    expect(markdown).toContain("recipeNotes:\n  - 'Add cream at the end.'");
  });

  it('writes servings when they matter and scalable: false when fixed', () => {
    const scalable = buildRecipeMarkdown(
      { ...validPayload, servings: 4 },
      today
    ).markdown;
    expect(scalable).toContain('cookingTime: 35\nservings: 4\n');
    expect(scalable).not.toContain('scalable:');

    const fixed = buildRecipeMarkdown(
      { ...validPayload, servings: 8, scalable: false },
      today
    ).markdown;
    expect(fixed).toContain('cookingTime: 35\nservings: 8\nscalable: false\n');
  });

  it('supports ingredient groups and two-part lines', () => {
    const { markdown } = buildRecipeMarkdown(
      {
        ...validPayload,
        ingredients: '## Crust\n2 | eggs\nsalt\n## Filling\n1/2|cup|sugar',
      },
      today
    );
    expect(markdown).toContain(
      "ingredients:\n  - title: 'Crust'\n    items:\n      - quantity: '2'\n        unit: ''\n        name: 'eggs'\n      - quantity: ''\n        unit: ''\n        name: 'salt'\n  - title: 'Filling'\n    items:\n      - quantity: '1/2'\n        unit: 'cup'\n        name: 'sugar'\n"
    );
  });

  it('defaults anonymous author and limits tags to three', () => {
    const { markdown } = buildRecipeMarkdown(
      {
        ...validPayload,
        author: '  ',
        tags: 'a, b, c, d, e',
        imageUrl: 'https://example.com/photo.jpg',
      },
      today
    );
    expect(markdown).toContain("author: 'anonymous'");
    expect(markdown).toContain("tags: ['a', 'b', 'c']");
    expect(markdown).toContain('image: "https://example.com/photo.jpg"');
  });

  it('escapes YAML-sensitive strings with JSON.stringify', () => {
    const { markdown } = buildRecipeMarkdown(
      {
        ...validPayload,
        title: "Chef's Special: Soup",
        description: 'Line one: two',
      },
      today
    );
    expect(markdown).toContain('"Chef\'s Special: Soup"');
    expect(markdown).toContain('"Line one: two"');
  });
});

describe('createContributionHandler', () => {
  function setup(
    overrides: Partial<Parameters<typeof createContributionHandler>[0]> = {}
  ) {
    let time = 1_000_000;
    const createIssue = vi.fn(async () => ({
      url: 'https://github.com/o/r/issues/1',
    }));
    const verifyHuman = vi.fn(async () => true);
    const handle = createContributionHandler({
      verifyHuman,
      createIssue,
      now: () => time,
      ...overrides,
    });
    const submit = (
      fields: Record<string, string> = validFields,
      ip = '1.1.1.1'
    ) => handle({ form: formOf(fields), ip, contentLength: 1000 });
    return {
      submit,
      createIssue,
      verifyHuman,
      advance: (ms: number) => (time += ms),
    };
  }

  it('creates an issue for a valid submission', async () => {
    const { submit, createIssue } = setup();
    await expect(submit()).resolves.toEqual({
      ok: true,
      status: 200,
      issueUrl: 'https://github.com/o/r/issues/1',
    });
    expect(createIssue).toHaveBeenCalledWith({
      title: 'Recipe submission: Creamy Tomato Soup!',
      body: expect.stringContaining(
        'src/content/recipes/creamy-tomato-soup.md'
      ),
    });
  });

  it('silently accepts honeypot submissions without creating an issue', async () => {
    const { submit, createIssue, verifyHuman } = setup();
    await expect(submit({ ...validFields, website: 'spam' })).resolves.toEqual({
      ok: true,
      status: 200,
    });
    expect(verifyHuman).not.toHaveBeenCalled();
    expect(createIssue).not.toHaveBeenCalled();
  });

  it('refuses when the human check fails', async () => {
    const { submit, createIssue } = setup({ verifyHuman: async () => false });
    await expect(submit()).resolves.toMatchObject({ ok: false, status: 400 });
    expect(createIssue).not.toHaveBeenCalled();
  });

  it('returns the field error for an invalid submission', async () => {
    const { submit } = setup();
    await expect(submit({ ...validFields, steps: '' })).resolves.toEqual({
      ok: false,
      status: 400,
      message: 'Steps is required.',
    });
  });

  it('rejects oversized bodies', async () => {
    const { createIssue } = setup();
    const handle = createContributionHandler({
      verifyHuman: async () => true,
      createIssue,
    });
    await expect(
      handle({ form: formOf(validFields), ip: null, contentLength: 200_000 })
    ).resolves.toMatchObject({ ok: false, status: 413 });
  });

  it('rate limits per ip and resets after the window', async () => {
    const { submit, advance } = setup();
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      await expect(submit()).resolves.toMatchObject({ ok: true });
    }
    await expect(submit()).resolves.toMatchObject({ ok: false, status: 429 });
    await expect(submit(validFields, '2.2.2.2')).resolves.toMatchObject({
      ok: true,
    });
    advance(RATE_LIMIT_WINDOW_MS + 1);
    await expect(submit()).resolves.toMatchObject({ ok: true });
  });

  it('maps tracker failures to a 502 with an auth hint', async () => {
    const auth = setup({
      createIssue: async () => ({ failed: true, status: 401 }),
    });
    await expect(auth.submit()).resolves.toEqual({
      ok: false,
      status: 502,
      message: 'Could not create GitHub issue (auth).',
    });
    const other = setup({
      createIssue: async () => ({ failed: true, status: 500 }),
    });
    await expect(other.submit()).resolves.toMatchObject({
      status: 502,
      message: /try again later/,
    });
  });
});

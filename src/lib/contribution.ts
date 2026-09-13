/**
 * Contribution intake: a reader's recipe submission, from the form's
 * fields to a GitHub issue for maintainers.
 *
 * One field table drives both the form and validation; the handler owns
 * spam checks, rate limiting, Markdown generation and the issue body.
 * The two things it cannot do itself (prove a human, create an issue)
 * are ports, so the route in production and the tests each plug in
 * their own adapters.
 */

// ---------------------------------------------------------------- fields

export type ContributeFieldKind =
  'text' | 'textarea' | 'number' | 'url' | 'checkbox';

export interface ContributeField {
  name: string;
  label: string;
  kind: ContributeFieldKind;
  required?: boolean;
  /** maxlength for text kinds, maximum value for numbers. */
  max?: number;
  min?: number;
  rows?: number;
  description?: string;
  placeholder?: string;
  /** Layout hint: `half` fields sit side by side on wide screens. */
  width?: 'full' | 'half';
  mono?: boolean;
  /** Initial value for number fields. */
  defaultValue?: number;
}

export const CONTRIBUTE_FIELDS: readonly ContributeField[] = [
  {
    name: 'title',
    label: 'Dish title',
    kind: 'text',
    required: true,
    max: 120,
  },
  {
    name: 'description',
    label: 'Short description',
    kind: 'textarea',
    required: true,
    max: 500,
    rows: 3,
  },
  {
    name: 'author',
    label: 'Your name or alias',
    kind: 'text',
    max: 80,
    placeholder: 'anonymous',
    width: 'half',
  },
  {
    name: 'cookingTime',
    label: 'Cooking time (minutes)',
    kind: 'number',
    required: true,
    min: 1,
    max: 999,
    defaultValue: 30,
    width: 'half',
  },
  {
    name: 'servings',
    label: 'Servings',
    kind: 'number',
    required: true,
    min: 1,
    max: 99,
    defaultValue: 1,
    width: 'half',
    description: 'How many servings the quantities below make.',
  },
  {
    name: 'fixedServings',
    label: "Readers can't scale this recipe",
    kind: 'checkbox',
    width: 'half',
    description:
      'Tick for whole cakes, pies and loaves. Otherwise readers can multiply the quantities up or down.',
  },
  {
    name: 'ingredients',
    label: 'Ingredients',
    kind: 'textarea',
    required: true,
    max: 10_000,
    rows: 8,
    mono: true,
    description:
      'One ingredient per line as quantity | unit | name (or quantity | name, or just a name). Start a group with ## Group title',
    placeholder:
      '## For the dressing\n1/2 | cup | olive oil\nSalt and pepper to taste',
  },
  {
    name: 'steps',
    label: 'Steps',
    kind: 'textarea',
    required: true,
    max: 15_000,
    rows: 10,
    mono: true,
    description:
      'One action per line. Start a new section with ## Section title',
    placeholder: '## Prep\nChop the onions.\n## Cook\nSauté until soft.',
  },
  {
    name: 'notes',
    label: 'Recipe notes',
    kind: 'textarea',
    max: 1000,
    rows: 3,
    placeholder: 'Tips, substitutions, warnings…',
  },
  {
    name: 'tags',
    label: 'Tags',
    kind: 'text',
    max: 120,
    placeholder: 'soup, vegetarian, quick (max 3)',
  },
  {
    name: 'imageUrl',
    label: 'Image URL (optional)',
    kind: 'url',
    max: 500,
    placeholder: 'https://',
    description:
      'Link to a photo you own or have rights to use. Do not upload binaries via PR – maintainers host licensed photos separately.',
  },
];

/** The honeypot field name; a bot that fills it gets a silent success. */
export const HONEYPOT_FIELD = 'website';
export const TURNSTILE_FIELD = 'cf-turnstile-response';
export const MAX_TAGS = 3;
export const MAX_BODY_BYTES = 100_000;
export const RATE_LIMIT_MAX = 5;
export const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

// -------------------------------------------------------------- config

export interface ContributionEnv {
  GITHUB_TOKEN?: string;
  GITHUB_REPO?: string;
  TURNSTILE_SECRET_KEY?: string;
  PROD: boolean;
}

/** True when the form can be submitted in this environment. Used by the form and the route. */
export function isContributionConfigured(env: ContributionEnv): boolean {
  if (!env.GITHUB_TOKEN || !env.GITHUB_REPO) return false;
  return !env.PROD || Boolean(env.TURNSTILE_SECRET_KEY);
}

// ------------------------------------------------------------- payload

export interface ContributePayload {
  title: string;
  description: string;
  author: string;
  cookingTime: number;
  /** How many servings the quantities make; the scaler's starting point. */
  servings: number;
  /** Whether readers may change the servings. */
  scalable: boolean;
  ingredients: string;
  steps: string;
  notes: string;
  tags: string;
  imageUrl: string;
}

export type ParseResult =
  { ok: true; payload: ContributePayload } | { ok: false; message: string };

/** Validate the submitted fields against CONTRIBUTE_FIELDS. */
export function parseContribution(form: FormData): ParseResult {
  const values: Record<string, string | number | boolean | undefined> = {};

  for (const field of CONTRIBUTE_FIELDS) {
    const raw = String(form.get(field.name) ?? '').trim();

    if (field.kind === 'checkbox') {
      values[field.name] = raw !== '';
      continue;
    }

    if (!raw) {
      if (field.required) return fail(`${field.label} is required.`);
      values[field.name] = field.kind === 'number' ? undefined : '';
      continue;
    }

    if (field.kind === 'number') {
      const value = Number(raw);
      if (
        !Number.isFinite(value) ||
        (field.min !== undefined && value < field.min) ||
        (field.max !== undefined && value > field.max)
      ) {
        return fail(
          `${field.label} must be a number between ${field.min ?? 0} and ${field.max ?? '∞'}.`
        );
      }
      values[field.name] = value;
      continue;
    }

    if (field.max !== undefined && raw.length > field.max) {
      return fail(`${field.label} must be at most ${field.max} characters.`);
    }
    values[field.name] = raw;
  }

  return {
    ok: true,
    payload: {
      title: values.title as string,
      description: values.description as string,
      author: values.author as string,
      cookingTime: values.cookingTime as number,
      servings: values.servings as number,
      scalable: values.fixedServings !== true,
      ingredients: values.ingredients as string,
      steps: values.steps as string,
      notes: values.notes as string,
      tags: values.tags as string,
      imageUrl: values.imageUrl as string,
    },
  };
}

function fail(message: string): ParseResult {
  return { ok: false, message };
}

// ------------------------------------------------------------ markdown

interface IngredientItem {
  quantity?: string;
  unit?: string;
  name: string;
}
interface IngredientGroup {
  title?: string;
  items: IngredientItem[];
}
interface Step {
  title?: string;
  actions: string[];
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** `## Title` starts a group; lines are `qty | unit | name`, `qty | name`, or a bare name. */
function parseIngredients(raw: string): IngredientGroup[] {
  const groups: IngredientGroup[] = [];
  let current: IngredientGroup = { items: [] };

  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('## ')) {
      if (current.items.length > 0 || current.title) groups.push(current);
      current = { title: trimmed.slice(3).trim(), items: [] };
      continue;
    }

    const parts = trimmed.split('|').map(part => part.trim());
    if (parts.length >= 3) {
      current.items.push({
        quantity: parts[0] || undefined,
        unit: parts[1] || undefined,
        name: parts.slice(2).join(' | '),
      });
    } else if (parts.length === 2) {
      current.items.push({ quantity: parts[0] || undefined, name: parts[1] });
    } else {
      current.items.push({ name: trimmed });
    }
  }

  if (current.items.length > 0 || current.title) groups.push(current);
  return groups;
}

/** `## Title` starts a step; every other non-empty line is an action. */
function parseSteps(raw: string): Step[] {
  const steps: Step[] = [];
  let current: Step = { actions: [] };

  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('## ')) {
      if (current.actions.length > 0 || current.title) steps.push(current);
      current = { title: trimmed.slice(3).trim(), actions: [] };
      continue;
    }

    current.actions.push(trimmed);
  }

  if (current.actions.length > 0 || current.title) steps.push(current);
  if (steps.length === 0) steps.push({ actions: ['Add cooking steps.'] });
  return steps;
}

function yamlString(value: string): string {
  if (/['\n:#[\]{}|>*&!]/.test(value)) {
    return JSON.stringify(value);
  }
  return `'${value}'`;
}

export function buildRecipeMarkdown(
  payload: ContributePayload,
  today: Date = new Date()
): { slug: string; markdown: string } {
  const slug = slugify(payload.title) || 'untitled-recipe';
  const author = payload.author.trim() || 'anonymous';
  const tags = payload.tags
    .split(',')
    .map(tag => tag.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, MAX_TAGS);
  const notes = payload.notes
    .split('\n')
    .map(note => note.trim())
    .filter(Boolean);
  const image = payload.imageUrl.trim();

  let md = `---
title: ${yamlString(payload.title.trim())}
description: ${yamlString(payload.description.trim())}

author: ${yamlString(author)}
pubDate: ${today.toISOString().slice(0, 10)}

image: ${yamlString(image)}
imageAlt: ${yamlString(image ? payload.title.trim() : '')}

cookingTime: ${payload.cookingTime}
`;

  // A scalable single-serving recipe is the schema default; say nothing.
  if (payload.servings > 1 || !payload.scalable) {
    md += `servings: ${payload.servings}\n`;
  }
  if (!payload.scalable) md += `scalable: false\n`;

  md += `\nsteps:\n`;
  for (const step of parseSteps(payload.steps)) {
    md += `  - title: ${yamlString(step.title || '')}\n`;
    md += `    actions:\n`;
    for (const action of step.actions) md += `      - ${yamlString(action)}\n`;
  }

  md += `\ningredients:\n`;
  for (const group of parseIngredients(payload.ingredients)) {
    md += group.title
      ? `  - title: ${yamlString(group.title)}\n    items:\n`
      : `  - items:\n`;
    for (const item of group.items) {
      md += `      - quantity: ${yamlString(item.quantity || '')}\n`;
      md += `        unit: ${yamlString(item.unit || '')}\n`;
      md += `        name: ${yamlString(item.name)}\n`;
    }
  }

  if (notes.length > 0) {
    md += `\nrecipeNotes:\n`;
    for (const note of notes) md += `  - ${yamlString(note)}\n`;
  }

  if (tags.length > 0) {
    md += `\ntags: [${tags.map(tag => yamlString(tag)).join(', ')}]\n`;
  }

  md += `---\n`;
  return { slug, markdown: md };
}

// ------------------------------------------------------------- handler

export interface ContributionPorts {
  /** Prove the submitter is human (Turnstile in production). */
  verifyHuman: (token: string, ip: string | null) => Promise<boolean>;
  /** Open the review issue; `null` means the tracker refused. */
  createIssue: (issue: {
    title: string;
    body: string;
  }) => Promise<{ url?: string } | { failed: true; status: number }>;
  now?: () => number;
}

export interface ContributionSubmission {
  form: FormData;
  ip: string | null;
  contentLength: number;
}

export type ContributionResult =
  | { ok: true; status: 200; issueUrl?: string }
  | { ok: false; status: 400 | 413 | 429 | 502; message: string };

/**
 * Build the handler once per process; it keeps the rate-limit window.
 * Note: on serverless hosts each instance has its own window.
 */
export function createContributionHandler({
  verifyHuman,
  createIssue,
  now = Date.now,
}: ContributionPorts): (
  submission: ContributionSubmission
) => Promise<ContributionResult> {
  const windows = new Map<string, { count: number; resetAt: number }>();

  function withinRateLimit(ip: string): boolean {
    const time = now();
    const entry = windows.get(ip);
    if (!entry || time > entry.resetAt) {
      windows.set(ip, { count: 1, resetAt: time + RATE_LIMIT_WINDOW_MS });
      return true;
    }
    if (entry.count >= RATE_LIMIT_MAX) return false;
    entry.count += 1;
    return true;
  }

  return async ({ form, ip, contentLength }) => {
    if (!withinRateLimit(ip ?? 'unknown')) {
      return refuse(429, 'Too many submissions. Please try again later.');
    }
    if (contentLength > MAX_BODY_BYTES) {
      return refuse(413, 'Submission is too large.');
    }
    if (String(form.get(HONEYPOT_FIELD) ?? '').trim()) {
      return { ok: true, status: 200 };
    }
    if (!(await verifyHuman(String(form.get(TURNSTILE_FIELD) ?? ''), ip))) {
      return refuse(400, 'Spam check failed. Please try again.');
    }

    const parsed = parseContribution(form);
    if (!parsed.ok) return refuse(400, parsed.message);

    const { slug, markdown } = buildRecipeMarkdown(
      parsed.payload,
      new Date(now())
    );
    const issue = await createIssue({
      title: `Recipe submission: ${parsed.payload.title}`,
      body: issueBody(slug, markdown),
    });

    if ('failed' in issue) {
      return refuse(
        502,
        issue.status === 401 || issue.status === 403
          ? 'Could not create GitHub issue (auth).'
          : 'Could not create GitHub issue. Please try again later.'
      );
    }
    return { ok: true, status: 200, issueUrl: issue.url };
  };
}

function refuse(
  status: 400 | 413 | 429 | 502,
  message: string
): ContributionResult {
  return { ok: false, status, message };
}

function issueBody(slug: string, markdown: string): string {
  return [
    '## Recipe submission via /contribute',
    '',
    `**Suggested filename:** \`src/content/recipes/${slug}.md\``,
    '',
    '### Review checklist',
    '- [ ] Validate ingredients / steps',
    '- [ ] Add licensed photo to CDN and set `image` filename',
    '- [ ] Merge into content collection',
    '',
    '### Generated Markdown',
    '',
    '```markdown',
    markdown,
    '```',
  ].join('\n');
}

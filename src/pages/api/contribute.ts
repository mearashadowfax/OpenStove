import type { APIRoute } from 'astro';
import { buildRecipeMarkdown } from '@/lib/contributeMarkdown';

export const prerender = false;

const FIELD_LIMITS = {
  title: 200,
  description: 1000,
  author: 100,
  ingredients: 10_000,
  steps: 15_000,
  notes: 5_000,
  tags: 200,
  imageUrl: 500,
} as const;

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count += 1;
  return true;
}

function tooLong(value: string, max: number): boolean {
  return value.length > max;
}

async function verifyTurnstile(
  token: string,
  ip: string | null
): Promise<boolean> {
  const secret = import.meta.env.TURNSTILE_SECRET_KEY;

  // Require Turnstile in production; optional in local/dev
  if (!secret) {
    return !import.meta.env.PROD;
  }

  if (!token) return false;

  const body = new URLSearchParams();
  body.set('secret', secret);
  body.set('response', token);
  if (ip) body.set('remoteip', ip);

  const res = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    { method: 'POST', body }
  );
  const data = (await res.json()) as { success?: boolean };
  return Boolean(data.success);
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const githubToken = import.meta.env.GITHUB_TOKEN;
  const githubRepo = import.meta.env.GITHUB_REPO;

  if (!githubToken || !githubRepo) {
    return Response.json(
      { ok: false, error: 'Contribution form is not configured.' },
      { status: 503 }
    );
  }

  if (import.meta.env.PROD && !import.meta.env.TURNSTILE_SECRET_KEY) {
    return Response.json(
      { ok: false, error: 'Contribution form is not configured.' },
      { status: 503 }
    );
  }

  const ip = clientAddress ?? 'unknown';
  if (!checkRateLimit(ip)) {
    return Response.json(
      { ok: false, error: 'Too many submissions. Please try again later.' },
      { status: 429 }
    );
  }

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > 100_000) {
    return Response.json(
      { ok: false, error: 'Submission is too large.' },
      { status: 413 }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json(
      { ok: false, error: 'Invalid form data.' },
      { status: 400 }
    );
  }

  // Honeypot
  if (String(form.get('website') || '').trim()) {
    return Response.json({ ok: true, url: undefined });
  }

  const turnstileToken = String(form.get('cf-turnstile-response') || '');
  const turnstileOk = await verifyTurnstile(
    turnstileToken,
    clientAddress ?? null
  );
  if (!turnstileOk) {
    return Response.json(
      { ok: false, error: 'Spam check failed. Please try again.' },
      { status: 400 }
    );
  }

  const title = String(form.get('title') || '').trim();
  const description = String(form.get('description') || '').trim();
  const cookingTime = Number(form.get('cookingTime'));
  const ingredients = String(form.get('ingredients') || '').trim();
  const steps = String(form.get('steps') || '').trim();
  const author = String(form.get('author') || '').trim();
  const notes = String(form.get('notes') || '').trim();
  const tags = String(form.get('tags') || '').trim();
  const imageUrl = String(form.get('imageUrl') || '').trim();

  if (
    !title ||
    !description ||
    !ingredients ||
    !steps ||
    !Number.isFinite(cookingTime)
  ) {
    return Response.json(
      { ok: false, error: 'Please fill in all required fields.' },
      { status: 400 }
    );
  }

  if (
    tooLong(title, FIELD_LIMITS.title) ||
    tooLong(description, FIELD_LIMITS.description) ||
    tooLong(author, FIELD_LIMITS.author) ||
    tooLong(ingredients, FIELD_LIMITS.ingredients) ||
    tooLong(steps, FIELD_LIMITS.steps) ||
    tooLong(notes, FIELD_LIMITS.notes) ||
    tooLong(tags, FIELD_LIMITS.tags) ||
    tooLong(imageUrl, FIELD_LIMITS.imageUrl)
  ) {
    return Response.json(
      { ok: false, error: 'One or more fields exceed the maximum length.' },
      { status: 400 }
    );
  }

  if (cookingTime < 1 || cookingTime > 999) {
    return Response.json(
      { ok: false, error: 'Cooking time must be between 1 and 999 minutes.' },
      { status: 400 }
    );
  }

  const payload = {
    title,
    description,
    author,
    cookingTime,
    ingredients,
    steps,
    notes,
    tags,
    imageUrl,
  };

  const { slug, markdown } = buildRecipeMarkdown(payload);

  const issueBody = [
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

  const [owner, repo] = githubRepo.split('/');
  if (!owner || !repo) {
    return Response.json(
      { ok: false, error: 'GITHUB_REPO must be owner/repo.' },
      { status: 500 }
    );
  }

  const ghRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/issues`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
        'User-Agent': 'OpenStove-Contribute',
      },
      body: JSON.stringify({
        title: `Recipe submission: ${title}`,
        body: issueBody,
      }),
    }
  );

  if (!ghRes.ok) {
    const errText = await ghRes.text();
    console.error('GitHub issue create failed', ghRes.status, errText);
    return Response.json(
      {
        ok: false,
        error:
          ghRes.status === 403 || ghRes.status === 401
            ? 'Could not create GitHub issue (auth).'
            : 'Could not create GitHub issue. Please try again later.',
      },
      { status: 502 }
    );
  }

  const issue = (await ghRes.json()) as { html_url?: string };
  return Response.json({ ok: true, url: issue.html_url });
};

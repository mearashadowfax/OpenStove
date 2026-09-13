import type { APIRoute } from 'astro';
import {
  createContributionHandler,
  isContributionConfigured,
} from '@/lib/contribution';

export const prerender = false;

const env = {
  GITHUB_TOKEN: import.meta.env.GITHUB_TOKEN,
  GITHUB_REPO: import.meta.env.GITHUB_REPO,
  TURNSTILE_SECRET_KEY: import.meta.env.TURNSTILE_SECRET_KEY,
  PROD: import.meta.env.PROD,
};

/** Turnstile adapter; without a secret (local/dev) everyone is human. */
async function verifyHuman(token: string, ip: string | null): Promise<boolean> {
  const secret = env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;

  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set('remoteip', ip);

  const res = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    { method: 'POST', body }
  );
  const data = (await res.json()) as { success?: boolean };
  return Boolean(data.success);
}

/** GitHub Issues adapter. */
async function createIssue(issue: { title: string; body: string }) {
  const res = await fetch(
    `https://api.github.com/repos/${env.GITHUB_REPO}/issues`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
        'User-Agent': 'OpenStove-Contribute',
      },
      body: JSON.stringify(issue),
    }
  );

  if (!res.ok) {
    console.error('GitHub issue create failed', res.status, await res.text());
    return { failed: true as const, status: res.status };
  }
  const created = (await res.json()) as { html_url?: string };
  return { url: created.html_url };
}

const handleContribution = createContributionHandler({
  verifyHuman,
  createIssue,
});

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!isContributionConfigured(env)) {
    return Response.json(
      { ok: false, error: 'Contribution form is not configured.' },
      { status: 503 }
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

  const result = await handleContribution({
    form,
    ip: clientAddress ?? null,
    contentLength: Number(request.headers.get('content-length') || 0),
  });

  return result.ok
    ? Response.json({ ok: true, url: result.issueUrl })
    : Response.json(
        { ok: false, error: result.message },
        { status: result.status }
      );
};

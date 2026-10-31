import type { APIRoute } from 'astro';

export const prerender = true;

export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL('sitemap-index.xml', site).href;
  const body = [
    'User-agent: *',
    'Disallow: /404',
    'Disallow: /keystatic',
    'Disallow: /api',
    'Allow: /',
    'Crawl-delay: 1',
    `Sitemap: ${sitemap}`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};

/** Publish surface labels — IRL /irl/ = Web 4.0, /b/ = Traditional Web. */

export type PublishSurfaceNarrative = {
  liveRightNow?: string;
  web4Page?: { url?: string; label?: string; description?: string };
  traditionalWebPage?: { url?: string; label?: string; description?: string };
  merchantApi?: { url?: string; label?: string; description?: string };
};

export function buildLiveRightNowFallback(input: {
  slug?: string;
  irlUrl?: string;
  url?: string;
  origin?: string;
}): string {
  const origin = input.origin ?? 'https://bigsearchai.com';
  const slug = input.slug ?? '';
  const enc = slug ? encodeURIComponent(slug) : '{slug}';
  const web4PageUrl = input.irlUrl ?? `${origin}/irl/${enc}`;
  const traditionalWebPageUrl = input.url ?? `${origin}/b/${enc}`;
  const merchantApiUrl = slug ? `${origin}/api/v1/merchants/${enc}` : `${origin}/api/v1/merchants/{slug}`;

  return `Live right now:

Web 4.0 page: ${web4PageUrl} — the machine-readable entity record
Traditional Web page: ${traditionalWebPageUrl} — the human-readable AI directory listing
llms.txt — grounding text for AI models (what they'll cite)
mcp.json — tool discovery for AI agents
openapi.json — merchant read API
Merchant API — live data endpoint (${merchantApiUrl})`;
}

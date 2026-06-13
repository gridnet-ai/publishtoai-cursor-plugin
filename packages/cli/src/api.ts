import { irlApiUrl, requireApiKey } from './config.js';
import type { ValidateResult } from './validate-local.js';

export type VerifyDomainResponse = {
  verified?: boolean;
  trustTier?: string;
  reason?: string;
  message?: string;
  error?: string;
  irlUrl?: string;
};

export type PublishResponse = {
  indexed?: boolean;
  url?: string;
  irlUrl?: string;
  entityScore?: number;
  slug?: string;
  pageId?: string;
  vcap?: Record<string, boolean>;
  searchUrl?: string;
  surfaces?: {
    llmsTxt?: string;
    mcpJson?: string;
    openapiJson?: string;
  };
  visibility?: {
    bigSearchEligible?: boolean;
    indexNow?: string;
    googleIndexing?: string;
  };
  error?: string;
  details?: unknown;
  suggestions?: string[];
};

export type StatusResponse = {
  slug?: string;
  indexed?: boolean;
  url?: string;
  irlUrl?: string;
  entityScore?: number;
  name?: string;
  status?: string;
  surfaces?: {
    llmsTxt?: string;
    mcpJson?: string;
    openapiJson?: string;
  };
  updatedAt?: unknown;
  error?: string;
};

export type CheckResponse = {
  slug?: string;
  url?: string;
  indexed?: boolean;
  irlUrl?: string;
  entityScore?: number;
  readiness?: string;
  hint?: string;
  error?: string;
};

export type RemoteValidateResponse = {
  valid: boolean;
  entityScore?: number;
  vcap?: Record<string, boolean>;
  errors?: unknown;
};

async function parseJson<T>(res: Response): Promise<T> {
  return (await res.json()) as T;
}

export async function remoteValidate(page: unknown): Promise<RemoteValidateResponse> {
  const res = await fetch(irlApiUrl('/validate'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(page),
  });
  return parseJson<RemoteValidateResponse>(res);
}

export async function publishPage(
  page: unknown,
  apiKey: string,
): Promise<{ status: number; data: PublishResponse }> {
  const res = await fetch(irlApiUrl('/publish'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify(page),
  });
  return { status: res.status, data: await parseJson<PublishResponse>(res) };
}

export async function getStatus(slug: string): Promise<{ status: number; data: StatusResponse }> {
  const res = await fetch(irlApiUrl(`/${encodeURIComponent(slug)}`));
  return { status: res.status, data: await parseJson<StatusResponse>(res) };
}

export async function checkReadiness(
  query: { slug?: string; url?: string },
): Promise<{ status: number; data: CheckResponse }> {
  const params = new URLSearchParams();
  if (query.slug) params.set('slug', query.slug);
  if (query.url) params.set('url', query.url);
  const res = await fetch(`${irlApiUrl('/check')}?${params.toString()}`);
  return { status: res.status, data: await parseJson<CheckResponse>(res) };
}

export async function verifyDomain(
  slug: string,
  domain: string,
  apiKey: string,
): Promise<{ status: number; data: VerifyDomainResponse }> {
  const res = await fetch(irlApiUrl('/verify'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({ slug, domain }),
  });
  return { status: res.status, data: await parseJson<VerifyDomainResponse>(res) };
}

/** Side-effect-free API key check: invalid body → 400 means key accepted. */
export async function verifyApiKey(apiKey: string): Promise<'valid' | 'invalid' | 'missing'> {
  const res = await fetch(irlApiUrl('/publish'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({}),
  });
  if (res.status === 401 || res.status === 403) return 'invalid';
  return 'valid';
}

export function mapValidateToRemote(data: RemoteValidateResponse): ValidateResult {
  if (!data.valid) return { valid: false, errors: data.errors };
  return {
    valid: true,
    entityScore: data.entityScore,
    vcap: data.vcap as ValidateResult['vcap'],
  };
}

export function getApiKeyOrExit(): string {
  return requireApiKey();
}

/**
 * BigSearch publish schema — kept in sync with bigsearch/functions/src/lib/web4pageSpec/validate.ts
 * until @web4page/spec npm package ships media + offerImageUrl (v1.1+).
 */
import { z } from 'zod';

const httpUrl = z.string().url().refine((u) => /^https?:\/\//i.test(u), {
  message: 'Must be http(s) URL',
});

export const Web4OfferLineSchema = z.union([
  z.string().min(1).max(200),
  z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    price: z.string().max(80).optional(),
    imageUrl: httpUrl.optional(),
    offerImageUrl: httpUrl.optional(),
  }),
]);

export const Web4PageMediaSchema = z.object({
  logoUrl: httpUrl.optional(),
  logoImageUrl: httpUrl.optional(),
  coverUrl: httpUrl.optional(),
  coverImageUrl: httpUrl.optional(),
  galleryImageUrls: z.array(httpUrl).max(12).optional(),
});

export const EntitySchema = z.object({
  name: z.string().min(1),
  type: z.enum(['business', 'institution', 'person', 'organization', 'research']),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  url: z.string().url().optional(),
  location: z
    .object({
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      zip: z.string().optional(),
    })
    .optional(),
});

export const Web4PageSchema = z.object({
  $schema: z.literal('https://web4page.org/spec/v1'),
  entity: EntitySchema,
  read: z.object({
    grounding: z.string().min(10),
    llms_txt: z.string().url().optional(),
    products: z.array(Web4OfferLineSchema).optional(),
    services: z.array(Web4OfferLineSchema).optional(),
    keywords: z.array(z.string()).optional(),
  }),
  media: Web4PageMediaSchema.optional(),
  discover: z
    .object({
      json_ld: z.record(z.unknown()).optional(),
      entity_score: z.number().min(0).max(100).nullable().optional(),
      crawl_permissions: z.array(z.string()).default(['*']),
    })
    .optional(),
  write: z
    .object({
      openapi_url: z.string().url().optional(),
      actions: z.array(z.string()).optional(),
      compliance: z.array(z.string()).optional(),
    })
    .optional(),
  act: z
    .object({
      mcp_endpoint: z.string().url().optional(),
      agent_capabilities: z.array(z.string()).optional(),
      auth: z.enum(['none', 'api_key', 'oauth2', 'did']).optional(),
    })
    .optional(),
  meta: z
    .object({
      created_at: z.string().optional(),
      updated_at: z.string().optional(),
      spec_version: z.string().optional(),
      published_by: z.string().optional(),
      parent_slug: z.string().optional(),
    })
    .optional(),
});

export type Web4Page = z.infer<typeof Web4PageSchema>;

export function getVcap(page: Web4Page): {
  read: boolean;
  discover: boolean;
  write: boolean;
  act: boolean;
} {
  return {
    read: page.read.grounding.length >= 10,
    discover: page.read.grounding.length >= 10,
    write: !!page.write?.openapi_url,
    act: !!page.act?.mcp_endpoint,
  };
}

/** Entity trust score 0–100 (matches @web4page/spec v1 heuristic). */
export function calculateEntityScore(page: Web4Page): number {
  let score = 0;
  if (page.read.grounding.length > 100) score += 20;
  if (page.read.grounding.length > 300) score += 10;
  if (page.read.llms_txt) score += 5;
  if ((page.read.products?.length ?? 0) > 0) score += 5;
  if (page.discover?.json_ld) score += 15;
  if (page.entity.url) score += 5;
  if (page.entity.location) score += 5;
  if (page.write?.openapi_url) score += 15;
  if ((page.write?.compliance?.length ?? 0) > 0) score += 5;
  if (page.act?.mcp_endpoint) score += 15;
  return Math.min(score, 100);
}

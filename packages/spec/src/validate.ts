import { z } from 'zod';

const httpUrl = z.string().url().refine((u) => /^https?:\/\//i.test(u), {
  message: 'Must be http(s) URL',
});

/** Single product/service line — string label or rich object with image. */
export const Web4OfferLineSchema = z.union([
  z.string().min(1).max(200),
  z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    price: z.string().max(80).optional(),
    imageUrl: httpUrl.optional(),
    /** Alias for imageUrl in agent-facing publish payloads. */
    offerImageUrl: httpUrl.optional(),
  }),
]);

export type Web4OfferLine = z.infer<typeof Web4OfferLineSchema>;

export const Web4PageMediaSchema = z.object({
  logoUrl: httpUrl.optional(),
  logoImageUrl: httpUrl.optional(),
  coverUrl: httpUrl.optional(),
  coverImageUrl: httpUrl.optional(),
  galleryImageUrls: z.array(httpUrl).max(12).optional(),
});

export type Web4PageMedia = z.infer<typeof Web4PageMediaSchema>;

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
  /** Human-visible page media — maps to merchant identity + offer images. */
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

export const TYPE_PREFIX: Record<Web4Page['entity']['type'], string> = {
  business: 'b',
  institution: 'i',
  person: 'p',
  organization: 'o',
  research: 'r',
};

export type VcapSurfaceKey = 'visibility' | 'citability' | 'actionability' | 'performability';

/** Legacy read/discover/write/act keys mapped to RFC-0001 V/C/A/P. */
export const VCAP_LEGACY_KEYS = {
  visibility: 'read',
  citability: 'discover',
  actionability: 'act',
  performability: 'write',
} as const;

export function getVcapSurfaces(page: Web4Page): Record<VcapSurfaceKey, boolean> {
  return {
    visibility: page.read.grounding.length >= 10,
    citability: page.read.grounding.length >= 10,
    actionability: !!page.act?.mcp_endpoint,
    performability: !!page.write?.openapi_url,
  };
}

export function getVcap(page: Web4Page): {
  read: boolean;
  discover: boolean;
  write: boolean;
  act: boolean;
} {
  const surfaces = getVcapSurfaces(page);
  return {
    read: surfaces.visibility,
    discover: surfaces.citability,
    write: surfaces.performability,
    act: surfaces.actionability,
  };
}

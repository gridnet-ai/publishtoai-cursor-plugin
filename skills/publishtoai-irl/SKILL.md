---
name: publishtoai-irl
description: >-
  Publish a business to BigSearch AI with full VCAP surfaces (Web 4.0 IRL page,
  Traditional Web directory listing, llms.txt, mcp.json, openapi.json). Use when
  the user wants AI discoverability, publishtoai publish, web4page.json, or IRL
  indexing. Always API-key-first; device login is local-terminal fallback only.
---

# PublishToAI — Publish to Big Search

Publish a business to **Big Search AI** (`bigsearchai.com`) with complete **VCAP** surfaces so ChatGPT, Claude, Gemini, Perplexity, and Big Search multi-model search can discover and cite the entity.

**Canonical repo:** [gridnet-ai/publishtoai-cursor-plugin](https://github.com/gridnet-ai/publishtoai-cursor-plugin)  
**Live pricing (fetch before quoting tiers):** [bigsearchai.com/pricing](https://bigsearchai.com/pricing)  
**Optional flow doc:** [CLI device login & publish](https://bigsearchai.com/docs/cli-device-login-and-publish-flow)

**Publish funnel (human step):** [bigsearchai.com/api](https://bigsearchai.com/api)  
Append `?source=replit` on Replit, `?source=cursor` on Cursor, `?source=lovable` on Lovable, `?source=publishtoai` from publishtoai.com.

---

## Flow (follow in order)

```mermaid
flowchart TB
  A([Business website + brief]) --> B[Run npx publishtoai]
  B --> C[publishtoai init]
  C --> D[Edit web4page.json — entity, grounding, media, offerImageUrl]
  D --> E[publishtoai validate]
  E --> F[Human: Start building at bigsearchai.com/api → API key in Developer tab]
  F --> G[Set BIGSEARCH_API_KEY]
  G --> H[publishtoai publish]
  H --> I{Publish OK?}
  I -->|Yes| J[VCAP surfaces live]
  I -->|No key — local terminal only| K[Fallback: device login]
  K --> H
  J --> L[Verify all V/C/A/P URLs HTTP 200]
  L --> M{Custom domain?}
  M -->|Yes| N[publishtoai verify --show-dns]
  M -->|No| O[Explain outcomes to owner]
  N --> O
  O --> P([Done — Web 4.0 /irl/slug + Traditional Web /b/slug discoverable])
```

---

## VCAP (RFC-0001 IRL on BigSearch AI)

| Surface | What | URLs |
|---------|------|------|
| **V** Visibility | Web 4.0 IRL (machine-readable entity) + Traditional Web directory listing | `/irl/{slug}`, `/b/{slug}` |
| **C** Citability | Model grounding brief | `/irl/{slug}/llms.txt` |
| **A** Actionability | MCP tool discovery | `/irl/{slug}/mcp.json` |
| **P** Performability | OpenAPI + merchant read API | `/irl/{slug}/openapi.json`, `/api/v1/merchants/{slug}` |

Full URLs (replace `{slug}`):

- `https://bigsearchai.com/irl/{slug}` — **Web 4.0 page** (machine-readable entity record)
- `https://bigsearchai.com/b/{slug}` — **Traditional Web page** (human-readable AI directory listing)
- `https://bigsearchai.com/irl/{slug}/llms.txt`
- `https://bigsearchai.com/irl/{slug}/mcp.json`
- `https://bigsearchai.com/irl/{slug}/openapi.json`
- `https://bigsearchai.com/api/v1/merchants/{slug}`
- `https://bigsearchai.com/api/v1/merchants/{slug}/offers`
- `https://bigsearchai.com/api/v1/merchants/{slug}/faqs`

---

## End-to-end steps

### 1. Install CLI

```bash
npx publishtoai
npx publishtoai publish
```

All subcommands: `init`, `validate`, `publish`, `login`, `status`, `check`, `doctor`, `verify`.

### 2. Init and edit web4page.json

```bash
publishtoai init
```

Edit `web4page.json` ([web4page.org spec](https://web4page.org/spec/v1)):

- `entity.name`, `entity.slug`, `entity.description`, `entity.url`
- `entity.location` — city/region if local business
- `read.grounding` — 2–3 sentences written for AI models (specific, not generic)
- `read.keywords` — 8–12 relevant search terms
- `read.products` / `read.services` — offerings (see **Media & offer images** below)
- `media` — hero, logo, gallery URLs (absolute `https://`; required for a styled page with images)

### 3. Validate locally

```bash
publishtoai validate
```

Fix schema errors before publish.

### Media & offer images (styled `/irl/{slug}` page)

Publishing **text-only** `web4page.json` produces a live IRL, but the human Web 4.0 page (`https://bigsearchai.com/irl/{slug}`) will have **no cover, gallery, or offer photos**. The React renderer is already wired — you must supply image URLs in the publish payload.

**Where images come from:** Scrape or upload from the business website (hero, logo, product photos). Use absolute `https://` URLs the browser can load (same origin, CDN, or Firebase Storage after upload). Do not use relative paths.

#### `media` block (page-level)

| Field | Maps to | Notes |
|-------|---------|--------|
| `coverImageUrl` | `identity.coverUrl` | Hero / banner — **most important** |
| `coverUrl` | same | Alias for `coverImageUrl` |
| `logoImageUrl` | `identity.logoUrl` | Square or wordmark |
| `logoUrl` | same | Alias for `logoImageUrl` |
| `galleryImageUrls` | `identity.galleryImageUrls` | Array, max 12 |

#### `read.products` / `read.services` (per-offer)

Each line may be:

- **String** — title only (legacy; no image on first publish)
- **Object** — `title`, optional `description`, `price`, and **`offerImageUrl`** (preferred) or `imageUrl` (alias)

| Field | Maps to |
|-------|---------|
| `offerImageUrl` / `imageUrl` | `offers[].imageUrl` + `imageUrls[]` |

#### Republish safety

If you republish with **string-only** product/service lines (title labels only), Big Search **preserves existing offer images** when the title matches a prior publish. Use this when rescanning copy without re-supplying image URLs — you will **not** wipe images that were set in the builder or a previous rich publish.

To **replace** an offer image, publish an object line with the same `title` and a new `offerImageUrl`.

After `publishtoai publish`, verify the **styled** human page (not only `llms.txt`):

```bash
curl -I "https://bigsearchai.com/irl/good-cookie"
open "https://bigsearchai.com/irl/good-cookie"
```

You should see cover, gallery, and offer images on `/irl/{slug}`. Machine surfaces (`/llms.txt`, `/mcp.json`, `/openapi.json`) remain separate paths.

**Do not skip images** when the business site has usable photos — text-only publish is an incomplete owner outcome.

### 4. Auth — API key first (required in Replit, Cursor agents, CI)

**Before `publishtoai publish`**, obtain an API key:

1. Ask the human to open [bigsearchai.com/api](https://bigsearchai.com/api)  
   - Replit: `https://bigsearchai.com/api?source=replit`  
   - Cursor: `https://bigsearchai.com/api?source=cursor`  
   - Lovable: `https://bigsearchai.com/api?source=lovable`  
   - PublishToAI: `https://bigsearchai.com/api?source=publishtoai`
2. They click **Start building**, sign up or sign in, then open **Account → Developer → Generate & copy key**
3. Set environment variable `BIGSEARCH_API_KEY` (Replit secret, `.env`, or `export`)

**Do NOT link the human straight to `/account?tab=developer`** — always use the `/api` landing page first.

**Do NOT rely on device login in server/headless environments** — Replit and CI kill long-running CLI poll processes.

Auth resolution order:

1. `BIGSEARCH_API_KEY` environment variable ← **preferred for agents/CI**
2. `~/.publishtoai/config.json` → `apiKey` ← device login saves here (local only)

### 5. Publish (headless when key is set)

```bash
publishtoai publish
```

With `BIGSEARCH_API_KEY` set, publish runs with no browser step.

Multi-IRL projects:

```bash
publishtoai publish --all
publishtoai publish -f path/to/web4page.json
```

### 6. Device login fallback (local terminal only)

Use **only** when:

- Publish fails with missing/invalid API key, **and**
- You are on the developer's machine with an interactive browser (not Replit, not headless CI)

```bash
publishtoai login
# or: publishtoai publish  (auto-starts login if no key)
```

Device login URL uses `source=publishtoai`:

`https://bigsearch-fd03f.web.app/cli-auth?code=XXXX&source=publishtoai`

Use **`.web.app`** for device login — the custom domain `/cli-auth` can 503 on cold CDN.

Sign in, authorize, copy the API key shown in the browser if needed, then retry publish.

### 7. Confirm publish output

CLI/API should report:

- `irlUrl` (Web 4.0 page): `https://bigsearchai.com/irl/{slug}`
- `url` (Traditional Web page): `https://bigsearchai.com/b/{slug}`
- `surfaceNarrative.liveRightNow` — canonical owner-facing copy (prefer this)
- `vcapUrls` — all four V/C/A/P URLs
- `vcapComplete` — `true` when publish gate passed
- `merchantApi` — base URL for Performability read API
- `indexed` / `entityScore`

### 8. Verify VCAP (all must return HTTP 200)

```bash
curl -I "https://bigsearchai.com/irl/{slug}"
curl -I "https://bigsearchai.com/b/{slug}"
curl -I "https://bigsearchai.com/irl/{slug}/llms.txt"
curl -I "https://bigsearchai.com/irl/{slug}/mcp.json"
curl -I "https://bigsearchai.com/irl/{slug}/openapi.json"
curl -I "https://bigsearchai.com/api/v1/merchants/{slug}"
```

### 9. Optional trust upgrade

```bash
publishtoai verify --show-dns
```

DNS TXT at `_bigsearch.{domain}` → IRL Secure on `irls.{domain}`.

Legacy apex TXT `bigsearch-irl-verify={slug}` also accepted during transition.

### 10. Status anytime

```bash
publishtoai status {slug}
publishtoai check --slug {slug}
publishtoai doctor
```

---

## CLI commands

| Command | Description |
|---------|-------------|
| `publishtoai init` | Scaffold `web4page.json` |
| `publishtoai validate` | Local schema validation |
| `publishtoai validate --remote` | Validate via Big Search API |
| `publishtoai publish` | Publish `./web4page.json` |
| `publishtoai publish --all` | Publish every `web4page.json` in tree |
| `publishtoai publish -f path` | Publish a specific file |
| `publishtoai login` | Device login → saves key to `~/.publishtoai/config.json` |
| `publishtoai status {slug}` | Index status |
| `publishtoai check --slug {slug}` | Readiness check |
| `publishtoai doctor` | Verify API key + file + index status |
| `publishtoai verify --show-dns` | DNS instructions for IRL Secure |

---

## Environment

| Variable | Default | Purpose |
|----------|---------|---------|
| `BIGSEARCH_API_KEY` | — | **Required** for publish in agents/CI |
| `BIGSEARCH_API_URL` | `https://bigsearchai.com` | API base (staging override) |

---

## Outcomes — explain to the business owner

### Immediate (seconds)

Use **exactly** this block after publish (replace `{slug}`):

```
Live right now:

Web 4.0 page: https://bigsearchai.com/irl/{slug} — the machine-readable entity record
Traditional Web page: https://bigsearchai.com/b/{slug} — the human-readable AI directory listing
llms.txt — grounding text for AI models (what they'll cite)
mcp.json — tool discovery for AI agents
openapi.json — merchant read API
Merchant API — live data endpoint (https://bigsearchai.com/api/v1/merchants/{slug})
```

- Styled Web 4.0 page at `/irl/{slug}` includes cover + offer images when `media` and `offerImageUrl` are set in web4page.json (no builder required)
- Row in Big Search index (eligible for bigsearchai.com/search results)

### AI models (days–weeks)

- Frontier models crawl `/irl/` and `llms.txt` for grounding
- JSON-LD entity graph on `/irl/` (Web 4.0) and `/b/` (Traditional Web)
- DNS-verify domain for higher IRL trust tier

### Traditional search (plan-dependent)

Fetch [bigsearchai.com/pricing](https://bigsearchai.com/pricing) for current tier names and entitlements. Do not invent or cache stale pricing.

- All tiers: `sitemap-merchants.xml`
- Higher tiers: IndexNow push, Google Indexing API (see pricing page)

Do not promise instant Google page-one ranking. Promise a live canonical AI address, complete VCAP, and an active discovery pipeline.

---

## MCP (Cursor)

The bundled MCP server (`@bigsearch/mcp`) exposes:

- `publish_irl` — publish a `web4page.json` body
- `get_irl_status` — GET index status for a slug
- `check_readiness` — check slug or URL readiness

Set `BIGSEARCH_API_KEY` in Cursor MCP env before invoking tools.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Publish hangs then dies in Replit | Device login poll killed | Use API key from [bigsearchai.com/api](https://bigsearchai.com/api) → Start building → Developer |
| `/cli-auth` 503 on custom domain | CDN cold start | Use `bigsearch-fd03f.web.app/cli-auth` |
| `No BIGSEARCH_API_KEY found` | Key not in env or config | Open [bigsearchai.com/api](https://bigsearchai.com/api), Start building, then Developer tab |
| `invalid_api_key` | Key revoked or wrong | Generate new key or re-run login |
| `API key limit reached` | Plan limit | Revoke unused keys in Account → Developer |
| `/irl/{slug}` is text-only, no images | `web4page.json` missing `media` and offer `offerImageUrl` | Re-read site; add `media.coverImageUrl`, `galleryImageUrls`, and per-offer `offerImageUrl`; republish |
| `/irl/{slug}` shows raw HTML footer on phone | Server served bot lean HTML; hard-refresh or private tab | If persists, check JS console on device |
| Republish removed offer images | Published object lines with empty `offerImageUrl` overriding titles | Use string-only lines to preserve images, or set new `offerImageUrl` explicitly |

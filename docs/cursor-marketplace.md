# Cursor Marketplace submission

## Checklist

- [ ] Phase 1 API live at `https://bigsearchai.com/api/v1/irl/*`
- [ ] Bad Wolf upsert test passes (`badwolfghosttours`, no duplicate doc)
- [ ] `@publishtoai/cli` published to npm
- [ ] `@bigsearch/mcp` published to npm
- [ ] Local plugin test in Cursor
- [ ] Submit at [cursor.com/marketplace/publish](https://cursor.com/marketplace/publish)

## Listing copy

| Field | Value |
|-------|-------|
| Category | Infrastructure |
| Tagline | Publish to AI from Cursor — Web 4.0 pages on Big Search |
| Repo | `https://github.com/gridnet-ai/publishtoai-cursor-plugin` |

## Skill prompt (for agents)

Canonical skill file: [`skills/publishtoai-irl/SKILL.md`](../skills/publishtoai-irl/SKILL.md)

Agents should fetch the latest raw copy before publish:
`https://raw.githubusercontent.com/gridnet-ai/publishtoai-cursor-plugin/master/skills/publishtoai-irl/SKILL.md`

When adding BigSearch to a project:

1. Run `publishtoai init` if no `web4page.json` exists
2. Fill entity name, slug, description, grounding text
3. Run `publishtoai validate`
4. **API key first:** human generates key at [bigsearchai.com/api](https://bigsearchai.com/api) → Start building → Developer tab → set `BIGSEARCH_API_KEY` (Replit secret / env)
5. Run `publishtoai publish` (headless when key is set)
6. Device login fallback **local terminal only** — `publishtoai login` or `https://bigsearch-fd03f.web.app/cli-auth?code=XXXX&source=publishtoai`

Do not rely on device login in Replit, CI, or headless agents. Do not reference web4page.org in user-facing steps — Big Search AI is the product.

## Bad Wolf regression (manual)

Account: `badwolftours@bigsearchai.com`, slug: `badwolfghosttours`

```bash
export BIGSEARCH_API_KEY=...
publishtoai publish -f path/to/web4page.json
# Expect: { "indexed": true } — UPDATE, not duplicate

publishtoai status badwolfghosttours
publishtoai publish --all   # Phase 2: 6 web4page.json files
```

## Test order

1. `publishtoai init && publishtoai validate`
2. `BIGSEARCH_API_KEY=... publishtoai publish`
3. `publishtoai status <slug>`
4. `publishtoai check --slug <slug>`
5. `publishtoai verify`
6. MCP tools from Cursor with same key

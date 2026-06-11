# Cursor Marketplace submission

## Checklist

- [ ] Phase 1 API live at `https://bigsearchai.com/api/v1/irl/*`
- [ ] Bad Wolf upsert test passes (`badwolfghosttours`, no duplicate doc)
- [ ] `@bigsearch/cli` published to npm
- [ ] `@bigsearch/mcp` published to npm
- [ ] Local plugin test in Cursor
- [ ] Submit at [cursor.com/marketplace/publish](https://cursor.com/marketplace/publish)

## Listing copy

| Field | Value |
|-------|-------|
| Category | Infrastructure |
| Tagline | Make every site AI-visible. Publish to BigSearch from Cursor. |
| Repo | `https://github.com/gridnet-ai/bigsearch-cursor-plugin` |

## Skill prompt (for agents)

When adding BigSearch to a project:

1. Run `bigsearch init` if no `web4page.json` exists
2. Fill entity name, slug, description, grounding text
3. Run `bigsearch validate`
4. Set `BIGSEARCH_API_KEY` from bigsearchai.com/account → Developer
5. Run `bigsearch publish`

Do not reference web4page.org in user-facing steps — BigSearch AI is the product.

## Bad Wolf regression (manual)

Account: `badwolftours@bigsearchai.com`, slug: `badwolfghosttours`

```bash
export BIGSEARCH_API_KEY=...
bigsearch publish -f path/to/web4page.json
# Expect: { "indexed": true } — UPDATE, not duplicate

bigsearch status badwolfghosttours
bigsearch publish --all   # Phase 2: 6 web4page.json files
```

## Test order

1. `bigsearch init && bigsearch validate`
2. `BIGSEARCH_API_KEY=... bigsearch publish`
3. `bigsearch status <slug>`
4. `bigsearch check --slug <slug>`
5. `bigsearch verify`
6. MCP tools from Cursor with same key

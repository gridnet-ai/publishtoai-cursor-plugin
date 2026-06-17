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

Canonical skill file: [`skills/bigsearch-irl/SKILL.md`](../skills/bigsearch-irl/SKILL.md)

Agents should fetch the latest raw copy before publish:
`https://raw.githubusercontent.com/gridnet-ai/bigsearch-cursor-plugin/master/skills/bigsearch-irl/SKILL.md`

When adding BigSearch to a project:

1. Run `bigsearch init` if no `web4page.json` exists
2. Fill entity name, slug, description, grounding text
3. Run `bigsearch validate`
4. **API key first:** human generates key at [Account → Developer](https://bigsearchai.com/account?tab=developer) → set `BIGSEARCH_API_KEY` (Replit secret / env)
5. Run `bigsearch publish` (headless when key is set)
6. Device login fallback **local terminal only** — `bigsearch login` or `https://bigsearch-fd03f.web.app/cli-auth?code=XXXX&source=cli`

Do not rely on device login in Replit, CI, or headless agents. Do not reference web4page.org in user-facing steps — BigSearch AI is the product.

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

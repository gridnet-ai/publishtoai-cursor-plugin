# BigSearch Cursor Plugin

Publish your business to the **BigSearch AI** index from the terminal or Cursor.

```bash
npm install -g @bigsearch/cli

export BIGSEARCH_API_KEY=your-key   # from bigsearchai.com/account → Developer

bigsearch init
bigsearch validate
bigsearch publish
```

Your IRL goes live at `https://bigsearchai.com/irl/{slug}` and is indexed for AI search and citation.

## Get an API key

1. Sign in at [bigsearchai.com/account](https://bigsearchai.com/account)
2. Open the **Developer** tab
3. Generate an API key
4. Export it: `export BIGSEARCH_API_KEY=...`

Auth uses **`BIGSEARCH_API_KEY` only** (no OAuth, no config-file secrets).

## CLI commands

| Command | Description |
|---------|-------------|
| `bigsearch init` | Scaffold `web4page.json` in the current directory |
| `bigsearch validate` | Validate locally against `@bigsearch/cli/web4page-spec` (default) |
| `bigsearch validate --remote` | Validate via BigSearch API |
| `bigsearch publish` | Publish `./web4page.json` to the IRL index |
| `bigsearch publish --all` | Publish every `web4page.json` in the project tree |
| `bigsearch publish -f path` | Publish a specific file |
| `bigsearch status <slug>` | Index status for a slug |
| `bigsearch check --slug <slug>` | Readiness / indexed check |
| `bigsearch check --url <url>` | Hint for URL-based readiness |
| `bigsearch verify` | Verify API key + local file + index status |

### Multi-IRL projects

```text
my-project/
  web4page.json
  pages/
    ghost-walk/web4page.json
    haunted-pub-crawl/web4page.json
```

```bash
bigsearch publish --all
```

## Environment

| Variable | Default | Purpose |
|----------|---------|---------|
| `BIGSEARCH_API_KEY` | — | Required for `publish`, `verify` |
| `BIGSEARCH_API_URL` | `https://bigsearchai.com` | API base (override for staging) |

## Packages

| Package | Description |
|---------|-------------|
| [`@bigsearch/cli`](packages/cli/) | `bigsearch` terminal binary |
| [`@bigsearch/mcp`](packages/mcp/) | MCP server for Cursor |

## Cursor plugin

Install from the [Cursor Marketplace](https://cursor.com/marketplace) (after submission) or clone this repo and point Cursor at `.cursor-plugin/plugin.json`.

The bundled MCP server exposes:

- `publish_irl` — publish a `web4page.json` body
- `get_irl_status` — GET index status for a slug
- `check_readiness` — check slug or URL readiness

## API endpoints (BigSearch only)

The CLI calls **only** `bigsearchai.com`:

- `POST /api/v1/irl/publish` — index (requires API key)
- `POST /api/v1/irl/validate` — remote validation
- `GET /api/v1/irl/{slug}` — status
- `GET /api/v1/irl/check?slug=` or `?url=` — readiness

## License

MIT — see [LICENSE](LICENSE).

# PublishToAI Cursor Plugin

Publish your business to the **Big Search AI** index from the terminal or Cursor.

```bash
npx publishtoai

export BIGSEARCH_API_KEY=your-key   # from bigsearchai.com/api → Developer

publishtoai init
publishtoai validate
publishtoai publish
```

Your IRL goes live at `https://bigsearchai.com/irl/{slug}` and is indexed for AI search and citation.

## Get an API key

1. Open [bigsearchai.com/api](https://bigsearchai.com/api) and click **Start building**
2. Sign in, then open **Account → Developer**
3. Generate an API key
4. Export it: `export BIGSEARCH_API_KEY=...`

Auth resolution order: `BIGSEARCH_API_KEY` env var first, then `~/.publishtoai/config.json` from device login.

## CLI commands

| Command | Description |
|---------|-------------|
| `publishtoai init` | Scaffold `web4page.json` in the current directory |
| `publishtoai validate` | Validate locally against `@publishtoai/cli/web4page-spec` (default) |
| `publishtoai validate --remote` | Validate via Big Search API |
| `publishtoai publish` | Publish `./web4page.json` to the IRL index |
| `publishtoai publish --all` | Publish every `web4page.json` in the project tree |
| `publishtoai publish -f path` | Publish a specific file |
| `publishtoai status <slug>` | Index status for a slug |
| `publishtoai check --slug <slug>` | Readiness / indexed check |
| `publishtoai check --url <url>` | Hint for URL-based readiness |
| `publishtoai verify` | Verify API key + local file + index status |
| `publishtoai login` | Device login → saves key to `~/.publishtoai/config.json` |

### Multi-IRL projects

```text
my-project/
  web4page.json
  pages/
    ghost-walk/web4page.json
    haunted-pub-crawl/web4page.json
```

```bash
publishtoai publish --all
```

## Environment

| Variable | Default | Purpose |
|----------|---------|---------|
| `BIGSEARCH_API_KEY` | — | Required for `publish`, `verify` in agents/CI |
| `BIGSEARCH_API_URL` | `https://bigsearchai.com` | API base (override for staging) |

## Packages

| Package | Description |
|---------|-------------|
| [`@publishtoai/cli`](packages/publishtoai-cli/) | `publishtoai` terminal binary (real implementation) |
| [`publishtoai`](packages/publishtoai/) | Unscoped meta-package → `@publishtoai/cli` |
| [`@bigsearch/cli`](packages/cli/) | Deprecated shim → forwards to `@publishtoai/cli` |
| [`@bigsearch/mcp`](packages/mcp/) | MCP server for Cursor |

## Agent skill

Canonical contract for vibe coders:

[`skills/publishtoai-irl/SKILL.md`](skills/publishtoai-irl/SKILL.md)

Raw URL: `https://raw.githubusercontent.com/gridnet-ai/publishtoai-cursor-plugin/master/skills/publishtoai-irl/SKILL.md`

## Cursor plugin

Install from the [Cursor Marketplace](https://cursor.com/marketplace) (listing name: **publishtoai**) or clone this repo and point Cursor at `.cursor-plugin/plugin.json`.

The bundled MCP server exposes:

- `publish_irl` — publish a `web4page.json` body
- `get_irl_status` — GET index status for a slug
- `check_readiness` — check slug or URL readiness

## API endpoints (Big Search only)

All CLI commands call `https://bigsearchai.com/api/v1/irl/*`. Registry surfaces live at `/irl/{slug}` (Web 4.0) and `/b/{slug}` (Traditional Web).

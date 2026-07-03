# @publishtoai/cli

Publish your business to the Big Search AI index — Web 4.0 IRL pages, Traditional Web listings, and full VCAP surfaces.

Registry and API live on **Big Search** (`bigsearchai.com`). Config is saved to `~/.publishtoai/config.json`.

## Quick start

```bash
npx publishtoai
npx publishtoai init
export BIGSEARCH_API_KEY=your-key
npx publishtoai publish
```

## Auth

1. `BIGSEARCH_API_KEY` environment variable (preferred for agents and CI)
2. Device login: `npx publishtoai login` → saves key to `~/.publishtoai/config.json`

## Install

```bash
npm install -g @publishtoai/cli
```

Same commands as `npx publishtoai`.

## Schema export

```js
import { Web4PageSchema } from '@publishtoai/cli/web4page-spec';
```

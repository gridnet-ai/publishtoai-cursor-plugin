#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { irlApiUrl, requireApiKey } from './config.js';

const TOOLS = [
  {
    name: 'publish_irl',
    description: 'Publish a web4page.json document to the BigSearch AI IRL index. Requires BIGSEARCH_API_KEY.',
    inputSchema: {
      type: 'object',
      properties: {
        web4page: { type: 'object', description: 'Parsed web4page.json object' },
      },
      required: ['web4page'],
    },
  },
  {
    name: 'get_irl_status',
    description: 'Get index status for a slug from BigSearch AI.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'Entity slug' },
      },
      required: ['slug'],
    },
  },
  {
    name: 'check_readiness',
    description: 'Check IRL readiness by slug or URL.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'Indexed slug' },
        url: { type: 'string', description: 'Site URL' },
      },
    },
  },
] as const;

const server = new Server(
  { name: 'bigsearch', version: '1.0.0' },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS.map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: t.inputSchema,
  })),
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'publish_irl') {
    const apiKey = requireApiKey();
    if (!apiKey) {
      return {
        content: [{ type: 'text', text: 'BIGSEARCH_API_KEY is not set.' }],
        isError: true,
      };
    }
    const web4page = (args as { web4page?: unknown })?.web4page;
    const res = await fetch(irlApiUrl('/publish'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
      body: JSON.stringify(web4page ?? {}),
    });
    const data = (await res.json()) as Record<string, unknown>;
    return {
      content: [{ type: 'text', text: JSON.stringify({ status: res.status, ...data }, null, 2) }],
      isError: !res.ok,
    };
  }

  if (name === 'get_irl_status') {
    const slug = String((args as { slug?: string })?.slug ?? '');
    const res = await fetch(irlApiUrl(`/${encodeURIComponent(slug)}`));
    const data = (await res.json()) as Record<string, unknown>;
    return {
      content: [{ type: 'text', text: JSON.stringify({ status: res.status, ...data }, null, 2) }],
      isError: !res.ok,
    };
  }

  if (name === 'check_readiness') {
    const a = args as { slug?: string; url?: string };
    const params = new URLSearchParams();
    if (a.slug) params.set('slug', a.slug);
    if (a.url) params.set('url', a.url);
    const res = await fetch(`${irlApiUrl('/check')}?${params.toString()}`);
    const data = (await res.json()) as Record<string, unknown>;
    return {
      content: [{ type: 'text', text: JSON.stringify({ status: res.status, ...data }, null, 2) }],
      isError: !res.ok,
    };
  }

  return {
    content: [{ type: 'text', text: `Unknown tool: ${name}` }],
    isError: true,
  };
});

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});

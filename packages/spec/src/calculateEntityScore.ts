import type { Web4Page } from './validate';

/** Entity trust score 0–100 (open standard heuristic v1). */
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

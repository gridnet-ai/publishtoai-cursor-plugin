import fs from 'node:fs';
import path from 'node:path';
import { Web4PageSchema, calculateEntityScore, getVcap } from '@web4page/spec';

export type ValidateResult = {
  valid: boolean;
  entityScore?: number;
  vcap?: ReturnType<typeof getVcap>;
  errors?: unknown;
  slug?: string;
};

export function localValidate(page: unknown): ValidateResult {
  const parsed = Web4PageSchema.safeParse(page);
  if (!parsed.success) return { valid: false, errors: parsed.error.flatten() };
  return {
    valid: true,
    entityScore: calculateEntityScore(parsed.data),
    vcap: getVcap(parsed.data),
    slug: parsed.data.entity.slug,
  };
}

export function slugFromPage(page: unknown): string | undefined {
  const parsed = Web4PageSchema.safeParse(page);
  return parsed.success ? parsed.data.entity.slug : undefined;
}

export function readWeb4PageFile(file: string): { path: string; page: unknown } {
  const resolved = path.resolve(process.cwd(), file);
  if (!fs.existsSync(resolved)) throw new Error(`file_not_found:${resolved}`);
  try {
    return { path: resolved, page: JSON.parse(fs.readFileSync(resolved, 'utf-8')) as unknown };
  } catch {
    throw new Error(`invalid_json:${resolved}`);
  }
}

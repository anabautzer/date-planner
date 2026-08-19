import { randomUUID } from 'crypto';
import { Redis } from '@upstash/redis';
import { normalizePlan, type PlanData } from './types';

// The Vercel Marketplace integration for Upstash doesn't always inject the
// plain UPSTASH_REDIS_REST_URL/TOKEN names Redis.fromEnv() expects — a
// custom prefix during setup gets prepended to Upstash's own default names
// (e.g. UPSTASH_REDIS_REST_KV_URL), and older/legacy connections use the
// Vercel KV naming instead. Try the known variants rather than requiring
// one exact name.
function resolveRedisEnv(): { url: string; token: string } {
  // IMPORTANT: must be the REST (https://) endpoint, not a redis:// / rediss://
  // connection string — those exist too (…_KV_URL) but don't work with this
  // REST-based client.
  const url =
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.UPSTASH_REDIS_REST_KV_REST_API_URL ||
    process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN ||
    process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    throw new Error(
      'Variáveis do Upstash Redis não encontradas (verifique a integração na Vercel)'
    );
  }
  if (!url.startsWith('https://')) {
    throw new Error(
      `UPSTASH_REDIS_REST_URL precisa ser o endpoint REST (https://...), não uma connection string. Valor atual começa com: ${url.slice(0, 12)}`
    );
  }
  return { url, token };
}

// Created lazily so importing this module doesn't crash pages/builds
// before those vars exist (e.g. local dev before Upstash is configured).
let _redis: Redis | null = null;
function redis(): Redis {
  if (!_redis) _redis = new Redis(resolveRedisEnv());
  return _redis;
}

// ─────────────────────────────────────────────────────────────
// Server-only persistence for a plan, keyed by an unguessable id.
// Access model: whoever has the link can read/update that plan —
// same trust model as a Google Docs share link. There's no login,
// so treat the id itself as the secret; never log it or expose it
// beyond the invite/results links.
//
// Records expire after 30 days (TTL_SECONDS). Updates use `keepTtl`
// so a guest typing doesn't keep resetting the clock — it always
// expires 30 days from creation.
// ─────────────────────────────────────────────────────────────

const TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
const MAX_PAYLOAD_BYTES = 50_000; // guard against abusive/huge payloads

const keyFor = (id: string) => `plan:${id}`;

export function generatePlanId(): string {
  return randomUUID().replace(/-/g, '');
}

export function assertReasonableSize(data: unknown) {
  const size = Buffer.byteLength(JSON.stringify(data), 'utf8');
  if (size > MAX_PAYLOAD_BYTES) {
    throw new Error('Payload muito grande');
  }
}

export async function createPlan(plan: PlanData): Promise<string> {
  const id = generatePlanId();
  await redis().set(keyFor(id), plan, { ex: TTL_SECONDS });
  return id;
}

export async function getPlan(id: string): Promise<PlanData | null> {
  if (!id) return null;
  try {
    const plan = await redis().get<PlanData>(keyFor(id));
    // Backfills fields missing from plans saved before a schema change —
    // otherwise loading an old plan crashes the moment a tab reads a field
    // that didn't exist when it was written.
    return plan ? normalizePlan(plan) : null;
  } catch (err) {
    // Store unreachable/unconfigured — treat like "not found" so the page
    // can show its friendly notice instead of crashing.
    console.error('[store] getPlan failed:', err);
    return null;
  }
}

export async function patchPlan(
  id: string,
  patch: Partial<Pick<PlanData, 'host' | 'guest'>> & { guestName?: string }
): Promise<PlanData | null> {
  const existing = await getPlan(id);
  if (!existing) return null;
  const updated: PlanData = { ...existing, ...patch };
  await redis().set(keyFor(id), updated, { keepTtl: true });
  return updated;
}

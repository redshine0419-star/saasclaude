import { neon } from '@neondatabase/serverless';

// middleware(edge)에서도 쓰므로 Prisma 대신 Neon HTTP 드라이버로 조회한다.
const TTL_MS = 60_000;
const cache = new Map<string, { slug: string | null; at: number }>();

export function isPlatformHost(host: string): boolean {
  return (
    host === 'growweb.me' || host === 'www.growweb.me' || host.endsWith('.vercel.app') ||
    host === 'localhost' || host === '127.0.0.1' || host.endsWith('.localhost')
  );
}

export function invalidateDomainCache(domain: string) {
  cache.delete(domain);
}

export async function resolveSlugByHost(host: string): Promise<string | null> {
  const hit = cache.get(host);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.slug;
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  try {
    const sql = neon(url);
    const rows = await sql`
      SELECT slug FROM tenants
      WHERE "customDomain" = ${host} AND "customDomainStatus" = 'verified' AND status = 'active'
      LIMIT 1
    `;
    const slug = (rows[0]?.slug as string | undefined) ?? null;
    cache.set(host, { slug, at: Date.now() });
    return slug;
  } catch {
    return null;
  }
}

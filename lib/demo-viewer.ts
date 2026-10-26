import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

/**
 * 데모 학원 관리자 둘러보기 (읽기 전용).
 * 로그인하지 않았거나 그 데모 학원 소속이 아닌 방문자에게 화면만 보여 준다.
 * 저장·삭제·발송 API는 모두 실제 로그인(auth())과 소속을 확인하므로 둘러보기 신분으로는 서버에서 거절된다.
 */
export const DEMO_ADMIN_SLUGS = new Set(['demo-warm', 'demo-result', 'demo-bright']);
/** 실제 구글 계정이 될 수 없는 주소(.invalid) — 둘러보기 전용 */
export const DEMO_VIEWER_EMAIL = 'viewer@demo.invalid';

type AdminSession = { user: { email: string; name?: string | null } } | null;

function isPlatformAdminEmail(email: string) {
  return (process.env.PLATFORM_ADMIN_EMAILS ?? '').split(',').map((e) => e.trim()).includes(email);
}

/** 실제로 관리할 수 있는 사람인지 (그 학원 소속 또는 플랫폼 운영자) */
async function hasRealAccess(slug: string, email: string): Promise<boolean> {
  if (isPlatformAdminEmail(email)) return true;
  const m = await prisma.membership.findFirst({
    where: { OR: [{ tenant: { slug }, user: { email } }, { role: 'platform_admin', user: { email } }] },
    select: { id: true },
  });
  return !!m;
}

/** 관리자 화면용 세션 — 데모 학원이면 권한 없는 방문자를 둘러보기 신분으로 바꾼다 */
export async function adminSession(slug: string): Promise<AdminSession> {
  const session = await auth();
  const email = session?.user?.email ?? null;
  if (!DEMO_ADMIN_SLUGS.has(slug)) return email ? { user: { email, name: session?.user?.name } } : null;
  if (email && (await hasRealAccess(slug, email))) return { user: { email, name: session?.user?.name } };
  return { user: { email: DEMO_VIEWER_EMAIL, name: '데모 둘러보기' } };
}

export function isDemoViewer(email: string | null | undefined): boolean {
  return email === DEMO_VIEWER_EMAIL;
}

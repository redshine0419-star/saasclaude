import { prisma } from '@/lib/prisma';

/** 첫등원 운영자인지 — 환경변수 운영자 목록(PLATFORM_ADMIN_EMAILS) 또는 platform_admin 역할 (플랫폼 화면과 같은 기준) */
export async function isPlatformAdmin(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  if ((process.env.PLATFORM_ADMIN_EMAILS ?? '').split(',').map((e) => e.trim()).includes(email)) return true;
  const m = await prisma.membership.findFirst({ where: { user: { email }, role: 'platform_admin' }, select: { id: true } });
  return !!m;
}

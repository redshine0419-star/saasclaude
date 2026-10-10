import { prisma } from '@/lib/prisma';

// JWT 세션이라 로그인만으로는 users 행이 생기지 않는다. 멤버십을 만들기 전에 반드시 호출한다.
export function ensureUser(email: string, name?: string | null, image?: string | null) {
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name: name ?? null, image: image ?? null },
  });
}

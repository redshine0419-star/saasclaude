import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ isAdmin: false, isInvited: false });
  }

  const role = (session.user as { role?: string })?.role;
  const isAdmin = role === 'admin';

  let isInvited = false;
  if (!isAdmin) {
    const workUser = await prisma.workUser.findUnique({ where: { email: session.user.email } });
    isInvited = !!workUser;
  }

  return NextResponse.json({ isAdmin, isInvited: isAdmin || isInvited });
}

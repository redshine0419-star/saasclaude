import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const session = await auth();
  if (!session?.user?.email) {
    redirect('/auth/signin');
  }

  const membership = await prisma.membership.findFirst({
    where: { tenant: { slug }, user: { email: session.user.email } },
  });
  if (!membership) {
    redirect('/auth/signin');
  }

  return <>{children}</>;
}

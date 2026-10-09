import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getAdminMembership } from '@/lib/admin-auth';
import { hashPhone } from '@/lib/messaging/hash';

type Params = Promise<{ slug: string }>;

export async function GET(_req: NextRequest, { params }: { params: Params }) {
  const { slug } = await params;

  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenant = await prisma.tenant.findUnique({ where: { slug, status: 'active' } });
  if (!tenant) return NextResponse.json({ error: '학원을 찾을 수 없습니다.' }, { status: 404 });

  const membership = await getAdminMembership(tenant.id, session.user.email!);
  if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const consents = await prisma.consent.findMany({
    where: { tenantId: tenant.id },
    include: { lead: { select: { parentName: true, studentGrade: true, phone: true } } },
    orderBy: { grantedAt: 'desc' },
  });

  const rows: string[] = [
    '수신자해시,학부모명,학년,동의유형,동의일시,철회일시,채널',
  ];

  for (const c of consents) {
    const recipientHash = c.lead?.phone ? hashPhone(c.lead.phone) : c.leadId ?? '';
    const name = c.lead?.parentName ?? '';
    const grade = c.lead?.studentGrade ?? '';
    const grantedAt = c.grantedAt ? new Date(c.grantedAt).toISOString() : '';
    const revokedAt = c.revokedAt ? new Date(c.revokedAt).toISOString() : '';
    rows.push([
      recipientHash.slice(0, 8) + '****',
      `"${name}"`,
      grade,
      c.type,
      grantedAt,
      revokedAt,
      c.channel,
    ].join(','));
  }

  const csv = rows.join('\n');
  const filename = `consent-log-${slug}-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

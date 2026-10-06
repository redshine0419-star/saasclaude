import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

type Params = Promise<{ slug: string }>;

export async function GET(req: NextRequest, { params }: { params: Params }) {
  const { slug } = await params;

  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenant = await prisma.tenant.findUnique({ where: { slug, status: 'active' } });
  if (!tenant) return NextResponse.json({ error: '학원을 찾을 수 없습니다.' }, { status: 404 });

  const membership = await prisma.membership.findFirst({
    where: { tenantId: tenant.id, user: { email: session.user.email } },
  });
  if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const url = new URL(req.url);
  const statusFilter = url.searchParams.get('status');

  const leads = await prisma.lead.findMany({
    where: {
      tenantId: tenant.id,
      ...(statusFilter ? { status: statusFilter } : {}),
    },
    orderBy: { createdAt: 'desc' },
    select: {
      createdAt: true,
      parentName: true,
      phone: true,
      studentGrade: true,
      consultType: true,
      source: true,
      status: true,
      statusChangedAt: true,
      marketingConsent: true,
      message: true,
    },
  });

  const STATUS_KO: Record<string, string> = {
    new: '신규',
    contacted: '연락 완료',
    test_booked: '테스트 예약',
    enrolled: '등록',
    not_enrolled: '미등록',
  };
  const CONSULT_KO: Record<string, string> = {
    level_test: '레벨테스트',
    phone: '전화 상담',
    visit: '방문 상담',
  };

  function toKST(d: Date) {
    return new Date(d.getTime() + 9 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 16);
  }

  const header = ['신청일시(KST)', '학부모명', '연락처', '학년', '상담유형', '유입경로', '상태', '상태변경일(KST)', '마케팅동의', '메모'];
  const rows = leads.map((l) => [
    toKST(l.createdAt),
    l.parentName,
    l.phone,
    l.studentGrade ?? '',
    CONSULT_KO[l.consultType] ?? l.consultType,
    l.source ?? '',
    STATUS_KO[l.status] ?? l.status,
    toKST(l.statusChangedAt),
    l.marketingConsent ? 'Y' : 'N',
    (l.message ?? '').replace(/"/g, '""'),
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\r\n');

  const filename = `leads_${slug}_${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse('﻿' + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

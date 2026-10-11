import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getAdminMembership } from '@/lib/admin-auth';
import { getDomainAdapter } from '@/lib/domains/adapter';
import { domainError, normalizeDomain, requiredDnsRecords } from '@/lib/domains/validate';
import { invalidateDomainCache } from '@/lib/domains/resolve';

type Params = Promise<{ slug: string }>;

export async function POST(req: NextRequest, { params }: { params: Params }) {
  const { slug } = await params;

  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenant = await prisma.tenant.findUnique({
    where: { slug, status: 'active' },
    select: { id: true, customDomain: true, customDomainStatus: true },
  });
  if (!tenant) return NextResponse.json({ error: '학원을 찾을 수 없습니다.' }, { status: 404 });

  const membership = await getAdminMembership(tenant.id, session.user.email);
  if (!membership || membership.role !== 'owner') {
    return NextResponse.json({ error: '도메인 연결은 원장만 할 수 있습니다.' }, { status: 403 });
  }

  const adapter = getDomainAdapter();
  if (!adapter) return NextResponse.json({ error: '도메인 연결 기능을 준비 중입니다.' }, { status: 503 });

  const body = await req.json().catch(() => ({}));
  const action = body?.action;

  if (action === 'connect') {
    const domain = normalizeDomain(String(body.domain ?? ''));
    const err = domainError(domain);
    if (err) return NextResponse.json({ error: err }, { status: 400 });
    if (tenant.customDomain) return NextResponse.json({ error: '먼저 연결된 도메인을 해제해 주세요.' }, { status: 409 });

    const taken = await prisma.tenant.findUnique({ where: { customDomain: domain }, select: { id: true } });
    if (taken) return NextResponse.json({ error: '다른 학원이 이미 연결한 도메인입니다.' }, { status: 409 });

    try {
      await adapter.add(domain);
    } catch (e) {
      console.error('[domain] add failed:', domain, e instanceof Error ? e.message : e);
      return NextResponse.json({ error: '도메인을 추가하지 못했습니다. 철자를 확인하거나 잠시 후 다시 시도해 주세요.' }, { status: 502 });
    }
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { customDomain: domain, customDomainStatus: 'pending', customDomainVerifiedAt: null },
    });
    return NextResponse.json({ ok: true, domain, status: 'pending', records: requiredDnsRecords(domain) });
  }

  if (action === 'check') {
    if (!tenant.customDomain) return NextResponse.json({ error: '연결된 도메인이 없습니다.' }, { status: 400 });
    const state = await adapter.check(tenant.customDomain);
    const status = state.verified ? 'verified' : 'pending';
    if (status !== tenant.customDomainStatus) {
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { customDomainStatus: status, customDomainVerifiedAt: state.verified ? new Date() : null },
      });
      invalidateDomainCache(tenant.customDomain);
    }
    return NextResponse.json({
      ok: true,
      domain: tenant.customDomain,
      status,
      records: [...requiredDnsRecords(tenant.customDomain), ...state.verification],
    });
  }

  if (action === 'disconnect') {
    if (tenant.customDomain) {
      await adapter.remove(tenant.customDomain).catch((e) => console.error('[domain] remove failed:', e instanceof Error ? e.message : e));
      invalidateDomainCache(tenant.customDomain);
    }
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { customDomain: null, customDomainStatus: null, customDomainVerifiedAt: null },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
}

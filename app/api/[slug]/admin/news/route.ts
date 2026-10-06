import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { sendMessage } from '@/lib/messaging/send';
import { hashPhone } from '@/lib/messaging/hash';

type Params = Promise<{ slug: string }>;

async function getAuthorizedTenant(slug: string) {
  const session = await auth();
  if (!session?.user?.email) return null;
  const tenant = await prisma.tenant.findUnique({ where: { slug, status: 'active' } });
  if (!tenant) return null;
  const membership = await prisma.membership.findFirst({
    where: { tenantId: tenant.id, user: { email: session.user.email } },
  });
  return membership ? tenant : null;
}

const DEMO_SLUGS = new Set(['demo', 'demo-warm', 'demo-result', 'demo-bright']);
const VALID_CATEGORIES = new Set(['notice', 'recruit', 'exam', 'gallery']);
const VALID_STATUSES = new Set(['draft', 'published', 'scheduled']);

export async function POST(req: NextRequest, { params }: { params: Params }) {
  const { slug } = await params;
  const tenant = await getAuthorizedTenant(slug);
  if (!tenant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: '입력 오류' }, { status: 400 });

  const { title, body: postBody, category = 'notice', status = 'published', sendKakao = false, scheduledAt } = body;
  if (!title?.trim() || !postBody?.trim()) {
    return NextResponse.json({ error: '제목과 내용은 필수입니다.' }, { status: 400 });
  }

  const cat = VALID_CATEGORIES.has(category) ? category : 'notice';
  const stat = VALID_STATUSES.has(status) ? status : 'published';

  const post = await prisma.post.create({
    data: {
      tenantId: tenant.id,
      title: title.trim(),
      body: postBody.trim(),
      category: cat as 'notice' | 'recruit' | 'exam',
      status: stat as 'draft' | 'published' | 'scheduled',
      publishedAt: stat === 'published' ? new Date() : scheduledAt ? new Date(scheduledAt) : null,
      sendKakao: Boolean(sendKakao),
      kakaoScheduledAt: sendKakao && scheduledAt ? new Date(scheduledAt) : sendKakao ? new Date() : null,
    },
  });

  // 즉시 발행 + 카카오 발송 요청인 경우 마케팅 동의자 전체에게 발송
  if (stat === 'published' && sendKakao) {
    // 데모 테넌트는 실제 발송 금지 (SPEC §10)
    if (!DEMO_SLUGS.has(slug)) {
      const now = new Date();
      // 마케팅 동의자 목록 + 각 수신자의 야간 동의 여부를 함께 조회
      const marketingConsents = await prisma.consent.findMany({
        where: {
          tenantId: tenant.id,
          type: 'marketing',
          grantedAt: { not: null },
          revokedAt: null,
        },
        include: {
          lead: {
            select: {
              id: true,
              phone: true,
              consents: {
                where: { type: 'night' },
                select: { grantedAt: true, revokedAt: true },
              },
            },
          },
        },
        distinct: ['leadId'],
      });

      const msgBody = `[${tenant.name}] ${title.trim()}\n\n${postBody.trim().slice(0, 200)}${postBody.trim().length > 200 ? '…' : ''}`;

      for (const consent of marketingConsents) {
        if (!consent.lead.phone) continue;
        const nightConsent = consent.lead.consents.some(
          (c) => c.grantedAt !== null && c.revokedAt === null,
        );
        const recipientHash = hashPhone(consent.lead.phone);
        await sendMessage({
          tenantId: tenant.id,
          recipientId: consent.lead.id,
          recipientHash,
          phone: consent.lead.phone,
          kind: 'campaign',
          body: msgBody,
          isAdvertisement: true,
          consent: { marketing: true, night: nightConsent },
          requestedAt: now,
        }).catch(() => { /* 발송 실패 시 포스트는 유지 */ });
      }

      // 포스트에 카카오 발송 완료 시각 기록
      await prisma.post.update({
        where: { id: post.id },
        data: { kakaoSentAt: now },
      });
    } // end !DEMO_SLUGS
  }

  return NextResponse.json({ ok: true, id: post.id });
}

export async function GET(req: NextRequest, { params }: { params: Params }) {
  const { slug } = await params;
  const tenant = await getAuthorizedTenant(slug);
  if (!tenant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const take = Math.min(Number(searchParams.get('take') ?? '50'), 100);

  const posts = await prisma.post.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: 'desc' },
    take,
    select: { id: true, title: true, category: true, status: true, publishedAt: true, sendKakao: true, createdAt: true },
  });

  return NextResponse.json(posts);
}

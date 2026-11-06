import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { MAX_PENDING, REGISTRATION_CONSENT_VERSION, isRegToken, parseRegistration, registrationCutoff } from '@/lib/students/registration';

type Params = Promise<{ slug: string }>;

// POST /api/[slug]/join — 학부모가 등록 링크로 학생 정보를 제출 (로그인 없음, 등록 대기로 저장)
export async function POST(req: NextRequest, { params }: { params: Params }) {
  const { slug } = await params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });

  // 허니팟: 봇에게는 성공처럼 보인다
  if (body._hp) return NextResponse.json({ ok: true });

  const token = typeof body.token === 'string' ? body.token : '';
  if (!isRegToken(token)) return NextResponse.json({ error: '등록 링크가 올바르지 않습니다. 학원에 새 링크를 요청해 주세요.' }, { status: 404 });
  const tenant = await prisma.tenant.findFirst({ where: { slug, status: 'active', published: true, studentRegToken: token }, select: { id: true } });
  if (!tenant) return NextResponse.json({ error: '만료되었거나 올바르지 않은 등록 링크입니다. 학원에 새 링크를 요청해 주세요.' }, { status: 404 });

  const parsed = parseRegistration(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  // 오래된 대기 건 정리 후 상한 확인
  await prisma.studentRegistration.deleteMany({ where: { tenantId: tenant.id, createdAt: { lt: registrationCutoff() } } });
  const pending = await prisma.studentRegistration.count({ where: { tenantId: tenant.id } });
  if (pending >= MAX_PENDING) return NextResponse.json({ error: '지금은 접수할 수 없습니다. 학원에 직접 연락해 주세요.' }, { status: 429 });

  // 같은 학생·학부모 번호로 이미 대기 중이면 새로 쌓지 않고 내용만 바꾼다
  const dup = await prisma.studentRegistration.findFirst({
    where: { tenantId: tenant.id, studentName: parsed.data.studentName, parentPhone: parsed.data.parentPhone },
    select: { id: true },
  });
  const data = { ...parsed.data, consentAt: new Date(), consentVersion: REGISTRATION_CONSENT_VERSION };
  if (dup) await prisma.studentRegistration.update({ where: { id: dup.id }, data });
  else await prisma.studentRegistration.create({ data: { ...data, tenantId: tenant.id } });

  return NextResponse.json({ ok: true });
}

import { after, NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ensureUser } from '@/lib/users';
import { slugError } from '@/lib/tenant';
import { DEFAULT_SECTION_ORDER, isThemeKey } from '@/lib/sections';
import { recordSiteVersion } from '@/lib/site-versions';
import { maskPhoneForMail, notifyOperator } from '@/lib/mail/operator';
import { pushToOperators } from '@/lib/push';
import { hasSignupConsent } from '@/lib/legal/consent';

const SELF_SERVE_LIMIT = 1;

function isPlatformAdmin(email: string) {
  return (process.env.PLATFORM_ADMIN_EMAILS ?? '').split(',').map((e) => e.trim()).includes(email);
}

function text(v: unknown, max: number): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  if (!(await hasSignupConsent(email))) return NextResponse.json({ error: '회원가입 약관 동의가 필요합니다.' }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });

  const name = text(body.name, 40);
  const slug = text(body.slug, 40).toLowerCase();
  const regNo = text(body.regNo, 40);
  const subjects = text(body.subjects, 40);
  const targetGrades = text(body.targetGrades, 40);
  const phone = text(body.phone, 20);
  const address = text(body.address, 120);
  const theme = body.theme;

  if (!name || !regNo || !subjects || !phone || !address) {
    return NextResponse.json({ error: '필수 항목을 모두 입력해 주세요.' }, { status: 400 });
  }
  const badSlug = slugError(slug);
  if (badSlug) return NextResponse.json({ error: badSlug, field: 'slug' }, { status: 400 });
  if (!/^[0-9-]{9,14}$/.test(phone)) {
    return NextResponse.json({ error: '대표 전화번호 형식을 확인해 주세요.', field: 'phone' }, { status: 400 });
  }
  if (!isThemeKey(theme)) return NextResponse.json({ error: '테마를 선택해 주세요.' }, { status: 400 });
  // 약관·개인정보 수집·이용은 회원가입 동의(hasSignupConsent)로 확인한다
  if (body.consentBeta !== true) {
    return NextResponse.json({ error: '베타 이용 조건을 확인하고 동의해 주세요.' }, { status: 400 });
  }

  if (!isPlatformAdmin(email)) {
    const owned = await prisma.membership.count({ where: { role: 'owner', user: { email } } });
    if (owned >= SELF_SERVE_LIMIT) {
      return NextResponse.json({ error: '이 계정으로 이미 학원 홈페이지를 만들었습니다.' }, { status: 409 });
    }
  }

  if (await prisma.tenant.findUnique({ where: { slug }, select: { id: true } })) {
    return NextResponse.json({ error: '이미 사용 중인 주소입니다.', field: 'slug' }, { status: 409 });
  }

  const user = await ensureUser(email, session.user.name, session.user.image);
  const now = new Date();
  const betaEndsAt = new Date(now);
  betaEndsAt.setMonth(betaEndsAt.getMonth() + 3);

  let tenant;
  try {
    tenant = await prisma.tenant.create({
      data: {
        name,
        slug,
        theme,
        regNo,
        subjects,
        targetGrades: targetGrades || null,
        phone,
        address,
        planStatus: 'beta',
        betaStartedAt: now,
        betaEndsAt,
        status: 'active',
        onboardedVia: 'self_serve',
        signupConsents: {
          terms: 'signup',
          privacy: 'signup',
          beta: true,
          case: !!body.consentCase,
          at: now.toISOString(),
          email,
        },
        sections: {
          create: DEFAULT_SECTION_ORDER[theme].map((key, i) => ({ sectionKey: key, enabled: true, sortOrder: i })),
        },
        memberships: { create: { userId: user.id, role: 'owner' } },
      },
      select: { id: true, slug: true },
    });
  } catch (e) {
    // slug 동시 생성 경합 (unique 위반)
    if ((e as { code?: string }).code === 'P2002') {
      return NextResponse.json({ error: '이미 사용 중인 주소입니다.', field: 'slug' }, { status: 409 });
    }
    throw e;
  }

  await recordSiteVersion(tenant.id, email, 'onboarding');
  console.log('[start] self-serve tenant created:', tenant.slug);

  const created = tenant;
  after(() =>
    notifyOperator({
      subject: `[더클] 셀프 개설 — ${name}`,
      heading: '새 학원이 직접 홈페이지를 만들었습니다',
      rows: [
        ['학원명', name],
        ['주소', `growweb.me/${created.slug}`],
        ['과목 · 대상', [subjects, targetGrades].filter(Boolean).join(' · ')],
        ['테마', String(theme)],
        ['대표 전화', maskPhoneForMail(phone)],
        ['지역', address.split(/\s+/).slice(0, 2).join(' ')],
      ],
      linkPath: `/platform/academies/${created.id}`,
      linkLabel: '학원 상세 보기',
    }),
  );
  // 운영자 앱 알림
  after(() =>
    pushToOperators({
      title: `새 학원 개설 — ${name}`,
      body: [`growweb.me/${created.slug}`, [subjects, targetGrades].filter(Boolean).join(' · '), address.split(/\s+/).slice(0, 2).join(' ')].filter(Boolean).join(' · '),
      url: `/platform/academies/${created.id}`,
      tag: 'op-new-academy',
    }).catch(() => 0),
  );

  return NextResponse.json({ ok: true, slug: tenant.slug });
}

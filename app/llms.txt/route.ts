import { prisma } from '@/lib/prisma';
import { publishedWhere, categoryLabel } from '@/lib/blog';
import { BRAND_NAME, BRAND_TAGLINE } from '@/lib/brand';
import { EVENTS } from '@/lib/events';
import { AUDIENCE, SERVICE_DEFINITION, SERVICE_FEATURES, SITE_URL, homeFaq } from '@/lib/seo/jsonld';
import { getPlanPrices } from '@/lib/seo/prices';
import { OPERATOR } from '@/lib/legal/documents';

/**
 * /llms.txt — AI 검색(ChatGPT·Perplexity·Claude 등)이 더클을 정확히 요약하도록 돕는 안내 파일 (llmstxt.org 형식).
 * 기능·요금·FAQ는 lib/seo/jsonld.ts와 같은 문장을 쓰고, 블로그 글 목록은 공개 글로 자동 갱신된다.
 */
export const revalidate = 3600;

export async function GET() {
  const [prices, posts] = await Promise.all([
    getPlanPrices(),
    prisma.blogPost
      .findMany({ where: publishedWhere(), orderBy: { publishedAt: 'desc' }, take: 50, select: { slug: true, title: true, summary: true, category: true } })
      .catch(() => []),
  ]);
  const won = (n: number) => `월 ${n.toLocaleString('ko-KR')}원`;
  const lines = [
    `# ${BRAND_NAME} (${SITE_URL.replace(/^https?:\/\//, '')})`,
    '',
    `> ${SERVICE_DEFINITION}`,
    '',
    `- 한 줄 소개: ${BRAND_TAGLINE}`,
    `- 대상: ${AUDIENCE}`,
    `- 운영: ${OPERATOR.name} (대한민국) · 문의 ${OPERATOR.privacyEmail}`,
    `- 학원 홈페이지 주소 형식: ${SITE_URL}/학원주소 (예: ${SITE_URL}/demo-warm)`,
    '',
    '## 주요 기능',
    ...SERVICE_FEATURES.map((f) => `- ${f}`),
    '',
    '## 요금',
    '- 베타: 홈페이지 오픈일부터 3개월 무료, 자동 결제 없음',
    `- 스탠다드: 재원생 50명까지 ${won(prices.standard)}`,
    `- 플러스: 재원생 51명 이상 ${won(prices.plus)}`,
    '- 모든 요금제의 기능은 같고, 재원생 수(학생부 "재원" 상태)로 구간이 정해진다',
    `- 이벤트: ${EVENTS.feedback.title} ${EVENTS.feedback.months}개월 무료, ${EVENTS.blog.title} ${EVENTS.blog.months}개월 무료 (학원당 이벤트마다 1회)`,
    '',
    '## 자주 묻는 질문',
    ...homeFaq(prices).flatMap((f) => [`### ${f.q}`, f.a, '']),
    '## 페이지',
    `- [서비스 소개](${SITE_URL}/service): 기능 설명과 홈페이지 만드는 순서`,
    `- [요금](${SITE_URL}/pricing): 요금제, 무료 기간 이벤트, 결제 FAQ`,
    `- [데모](${SITE_URL}/demo): 테마 3가지(원장 직강형·성과 중심형·밝은 친근형) 학원 홈페이지와 관리자 화면 데모`,
    `- [무료 진단](${SITE_URL}/consult): 지금 학원 홈페이지·블로그의 모바일·검색·상담 신청 구조 점검`,
    `- [블로그](${SITE_URL}/blog): 학원 운영·법규·홍보 가이드`,
    '',
    '## 데모 학원',
    `- [따뜻한수학학원](${SITE_URL}/demo-warm): 테마 A 원장 직강형`,
    `- [결과수학학원](${SITE_URL}/demo-result): 테마 B 성과 중심형`,
    `- [해피영어학원](${SITE_URL}/demo-bright): 테마 C 밝은 친근형`,
    '',
    ...(posts.length
      ? ['## 블로그 글', ...posts.map((p) => `- [${p.title}](${SITE_URL}/blog/${p.slug}) (${categoryLabel(p.category)})${p.summary ? `: ${p.summary.replace(/\s+/g, ' ').slice(0, 160)}` : ''}`), '']
      : []),
    '## 선택 사항',
    `- [개인정보처리방침](${SITE_URL}/privacy)`,
    `- [이용약관](${SITE_URL}/terms)`,
    `- [사이트맵](${SITE_URL}/sitemap.xml)`,
    '',
  ];
  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
}

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { FdHeader } from '@/components/fd/FdHeader';
import { FdFooter } from '@/components/fd/FdFooter';
import type { DiagItemKey, DiagItemResult } from '@/lib/diagnosis/analyze';

export const metadata = { title: '무료 진단 결과 — 첫등원', robots: { index: false, follow: false } };

const ITEMS: { key: DiagItemKey; label: string; desc: string }[] = [
  { key: 'conversion', label: '상담 전환 구조', desc: '학부모가 바로 연락·신청할 수 있는가' },
  { key: 'mobile', label: '모바일 최적화', desc: '휴대폰에서 빠르고 읽기 쉬운가' },
  { key: 'seo', label: '검색 노출', desc: '네이버·구글·AI 검색이 학원을 이해하는가' },
  { key: 'homepage', label: '학원 정보', desc: '교습비·주소·등록번호 등 필수 정보가 있는가' },
];

const SCORE = {
  1: { label: '미흡', bg: '#FCE4DC', color: '#8A3A1C' },
  2: { label: '보통', bg: '#FBF1CF', color: '#5A4A12' },
  3: { label: '양호', bg: '#D8E8E0', color: '#1E5645' },
} as const;

type Stored = Partial<Record<DiagItemKey, { score: 1 | 2 | 3; note: string }>> & {
  auto?: { kind: string; platform: string | null; items: Record<DiagItemKey, DiagItemResult> };
};

export default async function DiagnosisResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const req = await prisma.diagnosticRequest.findUnique({
    where: { id },
    select: { academyName: true, currentUrl: true, scores: true },
  });
  if (!req?.scores) notFound();
  const s = req.scores as unknown as Stored;
  const kind = s.auto?.kind;

  const headline =
    kind === 'homepage'
      ? '홈페이지를 점검했습니다'
      : kind === 'platform_page'
        ? `${s.auto?.platform}만 운영 중이시네요`
        : kind === 'unreachable'
          ? '입력하신 주소를 열 수 없었습니다'
          : '아직 학원 홈페이지가 없으시네요';

  return (
    <div data-theme="fd" style={{ fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo','Malgun Gothic',sans-serif", background: '#FFFFFF', color: '#14213D' }}>
      <FdHeader active="consult" />
      <main style={{ padding: 'clamp(40px, 6vw, 80px) 16px', maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#8A6400' }}>무료 진단 결과 · {req.academyName}</div>
          <h1 style={{ margin: 0, fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: 700, letterSpacing: '-0.5px' }}>{headline}</h1>
          {req.currentUrl && <div style={{ fontSize: 14, color: '#6B7280', wordBreak: 'break-all' }}>{req.currentUrl}</div>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          {ITEMS.map((it) => {
            const r = s[it.key];
            if (!r) return null;
            const sc = SCORE[r.score] ?? SCORE[1];
            const failed = s.auto?.items?.[it.key]?.checks?.filter((c) => !c.pass) ?? [];
            const passed = s.auto?.items?.[it.key]?.checks?.filter((c) => c.pass) ?? [];
            return (
              <section key={it.key} style={{ padding: 20, borderRadius: 16, border: '1px solid #E3E7EE', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 700 }}>{it.label}</div>
                    <div style={{ fontSize: 13, color: '#6B7280' }}>{it.desc}</div>
                  </div>
                  <span style={{ padding: '4px 10px', borderRadius: 999, fontSize: 13, fontWeight: 700, background: sc.bg, color: sc.color, whiteSpace: 'nowrap' }}>{sc.label}</span>
                </div>
                {failed.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, lineHeight: 1.6, color: '#374151' }}>
                    {failed.map((c) => <li key={c.label}>{c.tip}</li>)}
                  </ul>
                ) : (
                  <p style={{ margin: 0, fontSize: 14, color: '#374151' }}>{r.note}</p>
                )}
                {passed.length > 0 && (
                  <div style={{ fontSize: 12, color: '#1E5645' }}>갖춘 항목: {passed.map((c) => c.label).join(', ')}</div>
                )}
              </section>
            );
          })}
        </div>

        <section style={{ padding: 24, borderRadius: 16, background: '#14213D', color: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>첫등원 홈페이지는 위 항목을 기본으로 갖추고 시작합니다</div>
          <div style={{ fontSize: 15, lineHeight: 1.7, color: '#D6DBE6' }}>
            상담 신청 폼·전화 버튼·카톡 상담, 모바일 화면, 검색용 구조화 데이터, 교습비·등록번호 표기까지. 학원 정보만 입력하면 바로 열립니다. 오픈일부터 3개월 무료.
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link href="/start" style={{ height: 52, padding: '0 24px', borderRadius: 12, background: '#FFC93C', color: '#14213D', textDecoration: 'none', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center' }}>무료로 바로 만들기</Link>
            <Link href="/demo" style={{ height: 52, padding: '0 20px', borderRadius: 12, border: '1px solid #4A5A7A', color: '#FFFFFF', textDecoration: 'none', fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center' }}>예시 홈페이지 보기</Link>
          </div>
        </section>
        <p style={{ margin: 0, fontSize: 12, color: '#9CA3AF' }}>자동 점검 결과입니다. 첫 화면 HTML을 기준으로 판단하므로 실제와 다를 수 있습니다.</p>
      </main>
      <FdFooter />
    </div>
  );
}

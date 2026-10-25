import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { isReportToken, reportStatus, type ReportSnapshot } from '@/lib/students/report';
import { ReportView } from '@/components/students/ReportView';

// 학부모 공유 리포트 — 로그인 없이 비밀 링크로 연다. 학원 홈페이지 레이아웃(GA4) 밖에 두어 링크가 분석 도구로 새지 않게 한다
export const metadata = { title: '학습 리포트', robots: { index: false, follow: false, nocache: true }, referrer: 'no-referrer' as const };
export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ token: string }> };

export default async function SharedReportPage({ params }: Props) {
  const { token } = await params;
  if (!isReportToken(token)) notFound();
  const report = await prisma.studentReport.findUnique({
    where: { token },
    select: { id: true, snapshot: true, expiresAt: true, revokedAt: true, tenant: { select: { status: true, name: true, phone: true } } },
  });
  if (!report || report.tenant.status !== 'active') notFound();

  const status = reportStatus(report);
  if (status !== 'active') {
    return (
      <div style={{ minHeight: '100vh', background: '#F6F5F2', color: '#1B2430', fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{ maxWidth: 420, background: '#FFFFFF', borderRadius: 16, padding: 24, textAlign: 'center', lineHeight: 1.7 }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{status === 'expired' ? '공유 기간이 끝난 리포트입니다' : '공유가 중지된 리포트입니다'}</div>
          <div style={{ fontSize: 14, color: '#5A6270', marginTop: 8 }}>{report.tenant.name}에 다시 요청해 주세요.</div>
          {report.tenant.phone && <a href={`tel:${report.tenant.phone}`} style={{ display: 'inline-block', marginTop: 16, padding: '12px 20px', borderRadius: 12, background: '#1E5645', color: '#FFFFFF', fontWeight: 700, textDecoration: 'none' }}>학원에 전화하기</a>}
        </div>
      </div>
    );
  }

  await prisma.studentReport.update({ where: { id: report.id }, data: { viewCount: { increment: 1 }, lastViewedAt: new Date() } });
  return <ReportView snapshot={report.snapshot as unknown as ReportSnapshot} />;
}

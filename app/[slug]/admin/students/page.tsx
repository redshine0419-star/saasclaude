import Link from 'next/link';
import type { Prisma, StudentStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { AdminSide } from '@/components/admin/AdminSide';
import { studentPageAuth } from '@/lib/students/page-auth';
import { SCORE_KIND_LABEL, STATUS_LABEL, maskPhone } from '@/lib/students/labels';
import { daysAgo, formatKstDate } from '@/lib/format-date';

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ q?: string; status?: string; classId?: string }> };

const th: React.CSSProperties = { padding: '12px 14px', fontWeight: 600, textAlign: 'left', whiteSpace: 'nowrap' };
const td: React.CSSProperties = { padding: '12px 14px', borderTop: '1px solid #EEEAE2', verticalAlign: 'middle' };
const STATUS_STYLE: Record<StudentStatus, { bg: string; color: string }> = {
  active: { bg: '#E4EEE9', color: '#1E5645' },
  paused: { bg: '#FBF1CF', color: '#7A4B00' },
  left: { bg: '#EEEAE2', color: '#5A6270' },
};

export default async function StudentsPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const { tenant } = await studentPageAuth(slug);

  const status = (['active', 'paused', 'left', 'all'] as const).find((s) => s === sp.status) ?? 'active';
  const q = (sp.q ?? '').trim().slice(0, 40);
  const where: Prisma.StudentWhereInput = {
    tenantId: tenant.id,
    ...(status !== 'all' && { status }),
    ...(sp.classId && { classId: sp.classId }),
    ...(q && { OR: [{ name: { contains: q, mode: 'insensitive' } }, { school: { contains: q, mode: 'insensitive' } }, { grade: { contains: q } }] }),
  };
  const since = daysAgo(30);

  const [students, classes, counts] = await Promise.all([
    prisma.student.findMany({
      where,
      orderBy: [{ grade: 'asc' }, { name: 'asc' }],
      take: 500,
      include: {
        class: { select: { name: true } },
        scores: { orderBy: { examDate: 'desc' }, take: 1 },
        attendances: { where: { date: { gte: since } }, select: { status: true } },
        notes: { orderBy: { createdAt: 'desc' }, take: 1, select: { createdAt: true } },
      },
    }),
    prisma.classItem.findMany({ where: { tenantId: tenant.id }, orderBy: { sortOrder: 'asc' }, select: { id: true, name: true } }),
    prisma.student.groupBy({ by: ['status'], where: { tenantId: tenant.id }, _count: true }),
  ]);
  const countOf = (s: StudentStatus) => counts.find((c) => c.status === s)?._count ?? 0;
  const tabHref = (s: string) => `/${slug}/admin/students?status=${s}${sp.classId ? `&classId=${sp.classId}` : ''}${q ? `&q=${encodeURIComponent(q)}` : ''}`;

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: '100vh', background: '#F4F2EE', color: '#1B2430', fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo',sans-serif" }}>
      <AdminSide slug={slug} tenantName={tenant.name} active="students" />
      <main style={{ flex: 1, padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1100 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>학생부</h1>
            <div style={{ fontSize: 14, color: '#5A6270', marginTop: 4 }}>학생별 성적·성격·메모·출결을 한곳에서 봅니다. 학부모 화면에는 보이지 않습니다.</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link href={`/${slug}/admin/attendance`} style={{ height: 40, padding: '0 16px', borderRadius: 8, border: '1px solid #D5D0C6', background: '#FFFFFF', color: '#1B2430', textDecoration: 'none', fontSize: 14, fontWeight: 600, display: 'inline-flex', alignItems: 'center' }}>출결 체크</Link>
            <Link href={`/${slug}/admin/students/new`} style={{ height: 40, padding: '0 16px', borderRadius: 8, background: '#1E5645', color: '#FFFFFF', textDecoration: 'none', fontSize: 14, fontWeight: 700, display: 'inline-flex', alignItems: 'center' }}>+ 학생 추가</Link>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {([['active', `재원 ${countOf('active')}`], ['paused', `휴원 ${countOf('paused')}`], ['left', `퇴원 ${countOf('left')}`], ['all', '전체']] as const).map(([s, label]) => (
            <Link key={s} href={tabHref(s)} style={{ height: 34, padding: '0 14px', borderRadius: 17, fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', background: status === s ? '#1B2430' : '#FFFFFF', color: status === s ? '#FFFFFF' : '#3E4652', border: '1px solid #D5D0C6' }}>{label}</Link>
          ))}
        </div>

        <form style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input type="hidden" name="status" value={status} />
          <input name="q" defaultValue={q} placeholder="이름·학교·학년 검색" style={{ flex: '1 1 200px', minWidth: 0, height: 40, padding: '0 12px', border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14, background: '#FFFFFF' }} />
          <select name="classId" defaultValue={sp.classId ?? ''} style={{ flex: '0 1 180px', minWidth: 0, height: 40, padding: '0 10px', border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14, background: '#FFFFFF' }}>
            <option value="">모든 반</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button type="submit" style={{ height: 40, padding: '0 16px', border: 'none', borderRadius: 8, background: '#1B2430', color: '#FFFFFF', font: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>검색</button>
        </form>

        {students.length === 0 ? (
          <div style={{ padding: 40, background: '#FFFFFF', borderRadius: 12, textAlign: 'center', color: '#9AA3AF', lineHeight: 1.7 }}>
            {q || sp.classId ? '조건에 맞는 학생이 없습니다.' : <>아직 등록된 학생이 없습니다.<br />&ldquo;+ 학생 추가&rdquo;를 누르거나, 상담 관리에서 등록한 상담을 열어 &ldquo;원생으로 등록&rdquo;을 눌러 주세요.</>}
          </div>
        ) : (
          <div style={{ background: '#FFFFFF', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ color: '#5A6270', background: '#FAF9F6' }}>
                  {['이름', '학년·학교', '반', '상태', '학부모 연락처', '최근 성적', '최근 30일 출석', '최근 메모'].map((h) => <th key={h} style={th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {students.map((s) => {
                  const last = s.scores[0];
                  const att = s.attendances;
                  const attended = att.filter((x) => x.status === 'present' || x.status === 'late').length;
                  return (
                    <tr key={s.id}>
                      <td style={td}>
                        <Link href={`/${slug}/admin/students/${s.id}`} style={{ color: '#1B2430', fontWeight: 700, textDecoration: 'none' }}>{s.name}</Link>
                        {s.traits.length > 0 && <div style={{ fontSize: 12, color: '#5A6270', marginTop: 2 }}>{s.traits.slice(0, 3).join(' · ')}</div>}
                      </td>
                      <td style={td}>{[s.grade, s.school].filter(Boolean).join(' · ') || '–'}</td>
                      <td style={td}>{s.class?.name ?? '–'}</td>
                      <td style={td}><span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, ...STATUS_STYLE[s.status], background: STATUS_STYLE[s.status].bg }}>{STATUS_LABEL[s.status]}</span></td>
                      <td style={td}>{maskPhone(s.parentPhone) || '–'}</td>
                      <td style={td}>{last ? `${SCORE_KIND_LABEL[last.kind]} ${last.subject} ${Math.round((last.score / last.maxScore) * 100)}%` : '–'}</td>
                      <td style={td}>{att.length ? `${Math.round((attended / att.length) * 100)}% (${attended}/${att.length})` : '–'}</td>
                      <td style={td}>{s.notes[0] ? formatKstDate(s.notes[0].createdAt) : '–'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

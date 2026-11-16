/**
 * 무료 진단 결과 안내 — 신청자 이메일로 보낸다 (2026-11-16부터 휴대폰 대신 이메일).
 * 화면(플랫폼 관리자 미리보기)과 서버(발송)가 같은 문구를 쓰도록 여기 한 곳에 둔다.
 */

export const EMAIL_RE = /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[^\s@<>"',;]+$/;

/** 형식이 맞으면 소문자로 다듬은 주소, 아니면 null */
export function normalizeEmail(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const e = v.trim().toLowerCase();
  return e.length <= 120 && EMAIL_RE.test(e) ? e : null;
}

/** 목록용 가리기: ab***@gmail.com */
export function maskEmailAddr(email: string): string {
  const [user, domain] = email.split('@');
  if (!domain) return '***';
  return `${user.slice(0, 2)}***@${domain}`;
}

type ItemScore = { score: number; note?: string };
export type DiagnosisScores = { homepage: ItemScore; seo: ItemScore; conversion: ItemScore; mobile: ItemScore };
export type DiagnosisSummary = { id: string; academyName: string; area: string; subject: string };

const ITEMS: { key: keyof DiagnosisScores; label: string }[] = [
  { key: 'homepage', label: '홈페이지 현황' },
  { key: 'seo', label: '검색 노출' },
  { key: 'conversion', label: '상담 전환 구조' },
  { key: 'mobile', label: '모바일 최적화' },
];
const SCORE_WORD: Record<number, string> = { 1: '미흡', 2: '보통', 3: '양호' };

export function overallLabel(s: DiagnosisScores): string {
  const avg = ITEMS.reduce((n, i) => n + (s[i.key]?.score ?? 2), 0) / ITEMS.length;
  return avg >= 2.5 ? '양호' : avg >= 1.5 ? '보통' : '미흡';
}

export function resultUrl(id: string, baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://growweb.me') {
  return `${baseUrl.replace(/\/$/, '')}/consult/result/${id}`;
}

/** 메일 본문(글자) — 운영자 화면 미리보기에도 쓴다 */
export function diagnosisText(r: DiagnosisSummary, scores: DiagnosisScores | null, note = '', baseUrl?: string): string {
  const lines = scores
    ? ITEMS.map((i) => {
        const it = scores[i.key];
        return `• ${i.label}: ${SCORE_WORD[it?.score ?? 2] ?? ''}${it?.note ? ` — ${it.note}` : ''}`;
      }).join('\n')
    : '';
  return [
    `${r.academyName} 원장님, 더클 무료 진단 결과입니다.`,
    '',
    `과목: ${r.subject} / 지역: ${r.area}`,
    ...(scores ? [`종합 평가: ${overallLabel(scores)}`, '', lines] : []),
    ...(note.trim() ? ['', note.trim()] : []),
    '',
    `결과 자세히 보기: ${resultUrl(r.id, baseUrl)}`,
    '',
    '더클로 학원 홈페이지를 직접 만들어 보세요. 몇 분이면 열리고, 오픈일부터 3개월 무료입니다.',
    `바로 만들기: ${(baseUrl ?? process.env.NEXT_PUBLIC_BASE_URL ?? 'https://growweb.me').replace(/\/$/, '')}/start`,
  ].join('\n');
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function renderDiagnosisMail(r: DiagnosisSummary, scores: DiagnosisScores | null, note = '', baseUrl?: string) {
  const text = diagnosisText(r, scores, note, baseUrl);
  const link = resultUrl(r.id, baseUrl);
  const body = esc(text).replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" style="color:#1D3FA8">$1</a>');
  const html =
    `<div style="font-family:'Apple SD Gothic Neo','Malgun Gothic',sans-serif;color:#14213D;max-width:560px;font-size:15px;line-height:1.75">` +
    `<div style="white-space:pre-wrap">${body}</div>` +
    `<p style="margin:24px 0 0"><a href="${esc(link)}" style="display:inline-block;padding:12px 18px;background:#14213D;color:#FFFFFF;border-radius:10px;text-decoration:none;font-weight:700">진단 결과 보기</a></p>` +
    `<p style="margin:24px 0 0;font-size:12px;color:#8A93A8">이 메일은 더클 무료 진단을 신청하신 분께 결과를 안내하기 위해 보냈습니다.</p>` +
    `</div>`;
  return { subject: `[더클] ${r.academyName} 무료 진단 결과`, text, html };
}

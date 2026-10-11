export type DiagItemKey = 'homepage' | 'seo' | 'conversion' | 'mobile';
export type Check = { label: string; pass: boolean; tip: string };
export type DiagItemResult = { score: 1 | 2 | 3; note: string; checks: Check[] };
export type DiagnosisResult = {
  kind: 'homepage' | 'platform_page' | 'none' | 'unreachable';
  platform?: string;
  items: Record<DiagItemKey, DiagItemResult>;
};

export type PageInput = { finalUrl: string; html: string; ms: number; bytes: number };

const PLATFORM_HOSTS: [RegExp, string][] = [
  [/(^|\.)blog\.naver\.com$/, '네이버 블로그'],
  [/(^|\.)(map|place|m\.place)\.naver\.com$|(^|\.)naver\.me$/, '네이버 플레이스'],
  [/(^|\.)instagram\.com$/, '인스타그램'],
  [/(^|\.)pf\.kakao\.com$/, '카카오톡 채널'],
  [/(^|\.)band\.us$/, '네이버 밴드'],
  [/(^|\.)cafe\.naver\.com$/, '네이버 카페'],
];

function score(checks: Check[]): 1 | 2 | 3 {
  const ratio = checks.filter((c) => c.pass).length / checks.length;
  return ratio >= 0.85 ? 3 : ratio >= 0.5 ? 2 : 1;
}

function note(checks: Check[]): string {
  const failed = checks.filter((c) => !c.pass);
  return failed.length === 0 ? '기본 항목을 모두 갖추고 있습니다.' : failed.map((c) => c.tip).join(' ');
}

function item(checks: Check[]): DiagItemResult {
  return { score: score(checks), note: note(checks), checks };
}

/** 홈페이지가 없거나 열 수 없을 때 — 네 항목 모두 '미흡'과 같은 안내 */
export function emptyResult(kind: 'none' | 'unreachable' | 'platform_page', platform?: string): DiagnosisResult {
  const reason =
    kind === 'platform_page'
      ? `${platform}만으로는 상담 신청 폼, 교습비 표, 검색 최적화를 갖추기 어렵습니다.`
      : kind === 'unreachable'
        ? '입력하신 주소를 열 수 없었습니다.'
        : '학원 홈페이지가 없습니다.';
  const one = (label: string, tip: string): DiagItemResult => ({ score: 1, note: `${reason} ${tip}`, checks: [{ label, pass: false, tip }] });
  return {
    kind,
    platform,
    items: {
      homepage: one('학원 정보 페이지', '학원 소개·수업·교습비를 한곳에 정리한 페이지가 필요합니다.'),
      seo: one('검색 노출 기본 설정', '네이버·구글 검색에 학원 이름과 지역이 잡히도록 설정이 필요합니다.'),
      conversion: one('상담 신청 경로', '학부모가 바로 상담을 신청할 수 있는 폼과 전화 버튼이 필요합니다.'),
      mobile: one('모바일 화면', '학부모 대부분은 휴대폰으로 봅니다. 모바일 전용 화면이 필요합니다.'),
    },
  };
}

export function analyzePage(page: PageInput): DiagnosisResult {
  const host = new URL(page.finalUrl).hostname.toLowerCase();
  const platform = PLATFORM_HOSTS.find(([re]) => re.test(host))?.[1];
  if (platform) return emptyResult('platform_page', platform);

  const html = page.html;
  const lower = html.toLowerCase();
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');

  const meta = (name: string) =>
    new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]*content=["'][^"']+["']|<meta[^>]+content=["'][^"']+["'][^>]*(?:name|property)=["']${name}["']`, 'i').test(html);
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? '';

  const homepage: Check[] = [
    { label: '보안 연결(HTTPS)', pass: page.finalUrl.startsWith('https://'), tip: '주소가 https가 아니라 브라우저에 "안전하지 않음"이 표시됩니다.' },
    { label: '전화번호 표시', pass: /0\d{1,2}[-.\s)]?\d{3,4}[-.\s]?\d{4}/.test(text), tip: '첫 화면에서 전화번호를 찾기 어렵습니다.' },
    { label: '주소 표시', pass: /(시|군|구)\s?\S*(동|읍|면|로|길)\s?\d/.test(text), tip: '학원 주소가 보이지 않습니다.' },
    { label: '교습비 안내', pass: /교습비|수강료|원비|수업료/.test(text), tip: '교습비 안내가 없습니다. 학부모가 가장 먼저 찾는 정보입니다.' },
    { label: '학원등록번호 표기', pass: /등록\s?번호|제\s?\d{4}\s?-/.test(text), tip: '학원등록번호 표기가 보이지 않습니다.' },
  ];

  const seo: Check[] = [
    { label: '페이지 제목', pass: title.length >= 2, tip: '페이지 제목(title)이 비어 있습니다.' },
    { label: '검색 설명문', pass: meta('description'), tip: '검색 결과에 나오는 설명문(description)이 없습니다.' },
    { label: '공유 미리보기', pass: meta('og:title'), tip: '카톡 공유 시 미리보기(og 태그)가 없습니다.' },
    { label: '구조화 데이터', pass: /application\/ld\+json/.test(lower) && /(educationalorganization|localbusiness|organization)/.test(lower), tip: '검색엔진·AI가 읽는 학원 정보(구조화 데이터)가 없습니다.' },
    { label: '네이버 사이트 등록', pass: meta('naver-site-verification'), tip: '네이버 서치어드바이저에 등록되어 있지 않습니다.' },
  ];

  const conversion: Check[] = [
    { label: '전화 바로 걸기', pass: /href=["']tel:/i.test(html), tip: '휴대폰에서 눌러서 바로 거는 전화 버튼이 없습니다.' },
    { label: '상담 신청 폼', pass: /<form[\s>]/i.test(html) || /(상담|레벨\s?테스트|체험)\s?(신청|예약)/.test(text), tip: '온라인 상담 신청 폼이 없습니다.' },
    { label: '카카오톡 상담', pass: /pf\.kakao\.com|open\.kakao\.com/i.test(html), tip: '카카오톡 채널 상담 링크가 없습니다.' },
  ];

  const mobile: Check[] = [
    { label: '모바일 화면 설정', pass: /<meta[^>]+name=["']viewport["'][^>]*width=device-width/i.test(html), tip: '모바일 화면 설정(viewport)이 없어 휴대폰에서 글자가 작게 보입니다.' },
    { label: '응답 속도', pass: page.ms < 2500, tip: `첫 응답이 ${(page.ms / 1000).toFixed(1)}초로 느립니다.` },
    { label: '페이지 크기', pass: page.bytes < 800_000, tip: '페이지가 무거워 데이터가 느린 환경에서 늦게 열립니다.' },
  ];

  return {
    kind: 'homepage',
    items: { homepage: item(homepage), seo: item(seo), conversion: item(conversion), mobile: item(mobile) },
  };
}

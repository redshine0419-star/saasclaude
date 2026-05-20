import { NextRequest, NextResponse } from 'next/server';

interface HeaderCheck {
  present: boolean;
  value: string | null;
  note: string;
}

interface SecurityResult {
  grade: string;
  score: number;
  headers: {
    hsts: HeaderCheck;
    csp: HeaderCheck;
    xFrameOptions: HeaderCheck;
    xContentTypeOptions: HeaderCheck;
    referrerPolicy: HeaderCheck;
    permissionsPolicy: HeaderCheck;
  };
  issues: { title: string; detail: string; impact: 'High' | 'Medium' | 'Low' }[];
}

function gradeFromScore(score: number): string {
  if (score >= 95) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 65) return 'B';
  if (score >= 50) return 'C';
  if (score >= 30) return 'D';
  return 'F';
}

export async function POST(req: NextRequest) {
  const { url } = await req.json();
  if (!url) return NextResponse.json({ error: 'URL이 필요합니다.' }, { status: 400 });

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return NextResponse.json({ error: '유효하지 않은 URL입니다.' }, { status: 400 });
  }

  let res: Response | null = null;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    res = await fetch(parsedUrl.origin, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'GrowWeb-Bot/1.0 (Security Analyzer)' },
    });
    clearTimeout(timer);
  } catch {
    return NextResponse.json({ error: '사이트에 접근할 수 없습니다. URL을 확인해 주세요.' }, { status: 502 });
  }

  const h = res.headers;

  const hsts = h.get('strict-transport-security');
  const csp = h.get('content-security-policy');
  const xfo = h.get('x-frame-options');
  const xcto = h.get('x-content-type-options');
  const rp = h.get('referrer-policy');
  const pp = h.get('permissions-policy') ?? h.get('feature-policy');

  const result: SecurityResult = {
    grade: 'F',
    score: 0,
    headers: {
      hsts: {
        present: !!hsts,
        value: hsts,
        note: hsts
          ? (hsts.includes('max-age=0') ? '⚠ max-age=0 — HSTS 비활성 상태' : '설정됨')
          : 'HTTPS 강제 적용 미설정 — HTTP 다운그레이드 공격 취약',
      },
      csp: {
        present: !!csp,
        value: csp ? csp.slice(0, 80) + (csp.length > 80 ? '…' : '') : null,
        note: csp ? '콘텐츠 보안 정책 적용됨' : 'XSS 공격 방어 미설정 — 사용자 데이터 탈취 위험',
      },
      xFrameOptions: {
        present: !!xfo,
        value: xfo,
        note: xfo ? `클릭재킹 방어 (${xfo})` : 'X-Frame-Options 미설정 — 클릭재킹 공격 취약',
      },
      xContentTypeOptions: {
        present: !!xcto,
        value: xcto,
        note: xcto ? 'MIME 타입 스니핑 방어 적용됨' : 'nosniff 미설정 — MIME 혼동 공격 취약',
      },
      referrerPolicy: {
        present: !!rp,
        value: rp,
        note: rp ? `리퍼러 정책: ${rp}` : 'Referrer-Policy 미설정 — URL에 민감 정보 포함 시 외부 유출 위험',
      },
      permissionsPolicy: {
        present: !!pp,
        value: pp ? pp.slice(0, 80) + (pp.length > 80 ? '…' : '') : null,
        note: pp ? '기능 권한 정책 적용됨' : 'Permissions-Policy 미설정 — 카메라/마이크/위치 접근 제어 불가',
      },
    },
    issues: [],
  };

  // 점수 산정 (헤더별 가중치)
  let score = 0;
  if (result.headers.hsts.present && !result.headers.hsts.value?.includes('max-age=0')) score += 25;
  else if (result.headers.hsts.present) score += 5;
  if (result.headers.csp.present) score += 30;
  if (result.headers.xFrameOptions.present) score += 15;
  if (result.headers.xContentTypeOptions.present) score += 15;
  if (result.headers.referrerPolicy.present) score += 10;
  if (result.headers.permissionsPolicy.present) score += 5;

  result.score = score;
  result.grade = gradeFromScore(score);

  // 이슈 생성
  if (!result.headers.hsts.present) {
    result.issues.push({
      title: 'HSTS 미설정',
      detail: 'Strict-Transport-Security 헤더를 추가하세요. 설정 예: max-age=31536000; includeSubDomains; preload — 브라우저가 항상 HTTPS로 연결하도록 강제합니다.',
      impact: 'High',
    });
  }
  if (!result.headers.csp.present) {
    result.issues.push({
      title: 'Content-Security-Policy 없음',
      detail: "CSP는 XSS(크로스사이트 스크립팅) 공격의 핵심 방어선입니다. 최소한 Content-Security-Policy: default-src 'self' 로 시작하여 점진적으로 강화하세요.",
      impact: 'High',
    });
  }
  if (!result.headers.xFrameOptions.present) {
    result.issues.push({
      title: 'X-Frame-Options 미설정',
      detail: "X-Frame-Options: DENY 또는 SAMEORIGIN 을 설정하세요. 악성 사이트가 iframe으로 페이지를 임베드해 클릭재킹 공격을 수행하는 것을 방지합니다.",
      impact: 'High',
    });
  }
  if (!result.headers.xContentTypeOptions.present) {
    result.issues.push({
      title: 'X-Content-Type-Options 미설정',
      detail: 'X-Content-Type-Options: nosniff 를 추가하세요. 브라우저가 Content-Type을 무시하고 파일을 실행하는 MIME 혼동 공격을 막습니다.',
      impact: 'Medium',
    });
  }
  if (!result.headers.referrerPolicy.present) {
    result.issues.push({
      title: 'Referrer-Policy 미설정',
      detail: "Referrer-Policy: strict-origin-when-cross-origin 을 권장합니다. URL에 포함된 사용자 토큰·쿼리 파라미터가 외부 사이트로 유출되는 것을 방지합니다.",
      impact: 'Medium',
    });
  }
  if (!result.headers.permissionsPolicy.present) {
    result.issues.push({
      title: 'Permissions-Policy 미설정',
      detail: "Permissions-Policy: camera=(), microphone=(), geolocation=() 로 불필요한 브라우저 기능 접근을 제한하세요. 악성 스크립트의 하드웨어 접근을 차단합니다.",
      impact: 'Low',
    });
  }

  return NextResponse.json(result);
}

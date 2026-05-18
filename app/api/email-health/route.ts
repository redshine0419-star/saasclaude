import { NextRequest, NextResponse } from 'next/server';
import { promises as dns } from 'dns';

interface DnsRecord {
  exists: boolean;
  value: string | null;
}

interface EmailHealthResult {
  domain: string;
  grade: string;
  score: number;
  spf: DnsRecord & { valid: boolean };
  dkim: DnsRecord;
  dmarc: DnsRecord & { policy: string | null };
  mx: { exists: boolean; records: string[] };
  issues: { title: string; detail: string; impact: 'High' | 'Medium' | 'Low' }[];
}

function gradeFromScore(score: number): string {
  if (score >= 90) return 'A+';
  if (score >= 75) return 'A';
  if (score >= 55) return 'B';
  if (score >= 35) return 'C';
  if (score >= 15) return 'D';
  return 'F';
}

async function safeTxtLookup(host: string): Promise<string[][]> {
  try {
    return await dns.resolveTxt(host);
  } catch {
    return [];
  }
}

async function safeMxLookup(host: string): Promise<string[]> {
  try {
    const records = await dns.resolveMx(host);
    return records.map((r) => r.exchange);
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  const { domain } = await req.json();
  if (!domain) return NextResponse.json({ error: '도메인이 필요합니다.' }, { status: 400 });

  // 도메인 정규화 (URL 입력 허용)
  let cleanDomain = domain.trim().toLowerCase();
  try {
    if (cleanDomain.includes('://')) {
      cleanDomain = new URL(cleanDomain).hostname;
    }
    cleanDomain = cleanDomain.replace(/^www\./, '');
  } catch {
    return NextResponse.json({ error: '유효하지 않은 도메인입니다.' }, { status: 400 });
  }

  const [spfTxt, dmarcTxt, dkimTxt, mxRecords] = await Promise.all([
    safeTxtLookup(cleanDomain),
    safeTxtLookup(`_dmarc.${cleanDomain}`),
    safeTxtLookup(`default._domainkey.${cleanDomain}`),
    safeMxLookup(cleanDomain),
  ]);

  // SPF
  const spfRecord = spfTxt.flat().find((r) => r.startsWith('v=spf1'));
  const spfValid = !!spfRecord && (spfRecord.includes('~all') || spfRecord.includes('-all'));

  // DMARC
  const dmarcRecord = dmarcTxt.flat().find((r) => r.startsWith('v=DMARC1'));
  const dmarcPolicy = dmarcRecord
    ? (dmarcRecord.match(/p=(none|quarantine|reject)/)?.[1] ?? null)
    : null;

  // DKIM (default selector — may not exist for all senders)
  const dkimRecord = dkimTxt.flat().find((r) => r.includes('v=DKIM1') || r.includes('p='));

  const result: EmailHealthResult = {
    domain: cleanDomain,
    grade: 'F',
    score: 0,
    spf: {
      exists: !!spfRecord,
      valid: spfValid,
      value: spfRecord ?? null,
    },
    dkim: {
      exists: !!dkimRecord,
      value: dkimRecord ? dkimRecord.slice(0, 80) + (dkimRecord.length > 80 ? '…' : '') : null,
    },
    dmarc: {
      exists: !!dmarcRecord,
      policy: dmarcPolicy,
      value: dmarcRecord ? dmarcRecord.slice(0, 120) + (dmarcRecord.length > 120 ? '…' : '') : null,
    },
    mx: {
      exists: mxRecords.length > 0,
      records: mxRecords.slice(0, 3),
    },
    issues: [],
  };

  // 점수 산정
  let score = 0;
  if (result.mx.exists) score += 20;
  if (result.spf.exists) score += 20;
  if (result.spf.valid) score += 10;
  if (result.dkim.exists) score += 25;
  if (result.dmarc.exists) score += 15;
  if (dmarcPolicy === 'quarantine') score += 5;
  if (dmarcPolicy === 'reject') score += 10;

  result.score = Math.min(100, score);
  result.grade = gradeFromScore(result.score);

  // 이슈
  if (!result.mx.exists) {
    result.issues.push({
      title: 'MX 레코드 없음',
      detail: `${cleanDomain} 도메인에 메일 수신 서버(MX 레코드)가 설정되지 않았습니다. 이메일 마케팅을 위한 발신 도메인과 동일한지 확인하세요.`,
      impact: 'High',
    });
  }
  if (!result.spf.exists) {
    result.issues.push({
      title: 'SPF 레코드 없음',
      detail: `TXT 레코드에 SPF를 추가하세요. 예: v=spf1 include:_spf.google.com ~all — 이 설정이 없으면 발송 이메일이 스팸으로 분류될 가능성이 높습니다.`,
      impact: 'High',
    });
  } else if (!result.spf.valid) {
    result.issues.push({
      title: 'SPF 레코드 불완전',
      detail: `현재 SPF: "${result.spf.value}" — ~all(소프트 실패) 또는 -all(하드 실패) 정책이 필요합니다. ?all 또는 +all은 스팸 방지 효과가 없습니다.`,
      impact: 'Medium',
    });
  }
  if (!result.dkim.exists) {
    result.issues.push({
      title: 'DKIM 레코드 미감지 (default 셀렉터)',
      detail: `default._domainkey.${cleanDomain} TXT 레코드가 없습니다. DKIM이 없으면 수신 서버가 이메일 위변조 여부를 검증할 수 없어 신뢰도가 낮아집니다. ESP(이메일 서비스)에서 발급한 DKIM 키를 DNS에 등록하세요.`,
      impact: 'High',
    });
  }
  if (!result.dmarc.exists) {
    result.issues.push({
      title: 'DMARC 정책 없음',
      detail: `_dmarc.${cleanDomain} TXT 레코드를 추가하세요. 최소 설정: v=DMARC1; p=none; rua=mailto:dmarc@${cleanDomain} — SPF/DKIM 실패 시 처리 방식을 수신 서버에 알려줍니다.`,
      impact: 'High',
    });
  } else if (dmarcPolicy === 'none') {
    result.issues.push({
      title: 'DMARC 정책이 none (모니터링만)',
      detail: `현재 p=none은 리포트만 수집하고 실제 차단은 하지 않습니다. 충분한 데이터 수집 후 p=quarantine → p=reject 순으로 강화하세요. reject는 이메일 스푸핑을 완전히 차단합니다.`,
      impact: 'Low',
    });
  }

  return NextResponse.json(result);
}

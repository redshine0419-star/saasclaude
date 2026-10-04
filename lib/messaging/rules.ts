/**
 * SPEC 8장 규칙 — 서버에서 강제
 *
 * 이 모듈은 순수 함수만 포함한다. DB·어댑터 의존 없음 → 단위 테스트 가능.
 */

import type { SendRequest, RuleResult } from './types';

// 야간 시간대: 21:00 이상 또는 08:00 미만 (Korea Standard Time 기준)
const NIGHT_START_HOUR = 21;
const NIGHT_END_HOUR = 8;

// 광고성 메시지 필수 접두사
const AD_PREFIX = '(광고) ';

// 수신거부 안내 — 사업자 확정: "카카오 채널 차단"
const OPT_OUT_SUFFIX = '\n\n수신거부: 카카오 채널 차단';

/**
 * SPEC 8장 규칙을 적용해 발송 허용 여부와 최종 본문·시각을 결정한다.
 *
 * 규칙 1) 광고성 메시지는 marketing 동의 + 미철회 대상만
 * 규칙 2) 광고성 메시지 본문 앞 (광고) 삽입, 끝에 수신거부 문구 삽입
 * 규칙 3) 21:00~08:00 사이 발송 요청은 night 동의자만 허용.
 *          미동의자는 다음날 08:00 KST로 scheduledAt을 밀어서 반환한다.
 */
export function applyRules(req: SendRequest): RuleResult {
  // ── 규칙 1: 광고성 + 마케팅 동의 체크 ────────────────────────────
  if (req.isAdvertisement && !req.consent.marketing) {
    return { ok: false, reason: 'no_marketing_consent' };
  }

  // ── 규칙 2: 광고성 문구 자동 삽입 ────────────────────────────────
  let body = req.body;
  if (req.isAdvertisement) {
    if (!body.startsWith(AD_PREFIX)) {
      body = AD_PREFIX + body;
    }
    if (!body.includes('수신거부')) {
      body = body + OPT_OUT_SUFFIX;
    }
  }

  // ── 규칙 3: 야간 시간 판정 ────────────────────────────────────────
  const sendAt = req.scheduledAt ?? req.requestedAt;
  const scheduledAt = applyNightRule(sendAt, req.isAdvertisement, req.consent.night);

  return { ok: true, body, scheduledAt };
}

/**
 * 야간 제한 적용.
 * - 비광고성 메시지는 야간에도 발송 허용.
 * - 광고성 메시지이고 야간 미동의자이면 다음날 08:00 KST로 미룸.
 */
export function applyNightRule(at: Date, isAd: boolean, nightConsent: boolean): Date {
  if (!isAd) return at;
  if (nightConsent) return at;
  if (!isNightTime(at)) return at;

  // 다음날 08:00 KST (UTC+9 → UTC 23:00 전날)
  return nextMorning(at);
}

/** 주어진 Date가 KST 기준 야간(21:00 이상 또는 08:00 미만)인지 반환 */
export function isNightTime(date: Date): boolean {
  const kstHour = getKSTHour(date);
  return kstHour >= NIGHT_START_HOUR || kstHour < NIGHT_END_HOUR;
}

/** Date → KST 시(hour) */
function getKSTHour(date: Date): number {
  const utcMs = date.getTime();
  const kstMs = utcMs + 9 * 60 * 60 * 1000;
  return new Date(kstMs).getUTCHours();
}

/**
 * at 기준 "다음 08:00 KST"를 반환한다.
 * - KST 00:00~07:59 (자정~새벽): 당일 08:00 KST
 * - KST 21:00~23:59 (야간):     익일 08:00 KST
 */
export function nextMorning(at: Date): Date {
  // UTC ms → KST Date
  const kstMs = at.getTime() + 9 * 60 * 60 * 1000;
  const kstDate = new Date(kstMs);
  const kstHour = kstDate.getUTCHours();

  // KST 기준 당일 08:00 (UTC로 표현)
  // KST 08:00 = UTC 23:00 (전날) = Date.UTC(year, month, day, 8) - 9h
  const todayMorningUTC =
    Date.UTC(kstDate.getUTCFullYear(), kstDate.getUTCMonth(), kstDate.getUTCDate(), 8) -
    9 * 60 * 60 * 1000;

  if (kstHour < NIGHT_END_HOUR) {
    // 자정~07:59 → 당일 08:00 KST
    return new Date(todayMorningUTC);
  } else {
    // 21:00 이후 → 익일 08:00 KST
    return new Date(todayMorningUTC + 24 * 60 * 60 * 1000);
  }
}

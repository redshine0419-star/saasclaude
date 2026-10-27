import { describe, expect, it } from 'vitest';
import { smsHref, smsTemplates } from '../sms-link';

describe('smsHref', () => {
  it('번호는 숫자만, 본문은 인코딩해서 iOS·안드로이드 공통 형식으로', () => {
    expect(smsHref('010-1234-5678', '안녕 & 반가워\n링크')).toBe(`sms:01012345678?&body=${encodeURIComponent('안녕 & 반가워\n링크')}`);
  });
});

describe('smsTemplates', () => {
  const t = smsTemplates({ academyName: '하늘수학', parentName: '김민지', grade: '중2', testAt: '2026-10-30T06:00:00.000Z' });
  it('학원명·학부모 이름이 들어가고 광고성 표현은 없다', () => {
    for (const x of t) {
      expect(x.body.startsWith('[하늘수학]')).toBe(true);
      expect(x.body).toContain('김민지 학부모님');
      expect(x.body).not.toMatch(/할인|이벤트|모집|무료/);
    }
  });
  it('레벨테스트 일시를 KST로', () => {
    expect(t.find((x) => x.key === 'test')!.body).toContain('10월 30일(금) 15:00');
  });
});

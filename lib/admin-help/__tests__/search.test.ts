import { describe, expect, it } from 'vitest';
import { HELP_TOPICS } from '../content';
import { searchHelp, topicForPath } from '../search';

const top = (q: string, currentKey?: string) => searchHelp(q, HELP_TOPICS, { currentKey })[0];

describe('searchHelp', () => {
  it.each([
    ['직원 초대는 어떻게 하나요', 'settings'],
    ['실장님 초대', 'settings'],
    ['밤에 카톡 안 가요', 'kakao'],
    ['퇴원하면 어떻게 돼요', 'students'],
    ['학부모 등록 링크', 'students'],
    ['요금이 얼마예요', 'billing'],
    ['메인 사진 바꾸기', 'sections'],
    ['문자 보내기', 'leads'],
    ['교습비 공개', 'info'],
    ['강사진이 홈페이지에 안 보여요', 'staff'],
    ['테마 바꾸고 싶어요', 'sections'],
    ['결제 실패했어요', 'billing'],
    ['수식 쓰는 법', 'questions'],
    ['후기가 안 보여요', 'reviews'],
    ['예약 대기가 뭐예요', 'kakaolog'],
  ])('%s → %s', (q, key) => {
    expect(top(q)?.topic.key).toBe(key);
  });
  it('관계없는 말에는 답하지 않는다', () => {
    expect(searchHelp('오늘 날씨 맑음', HELP_TOPICS)).toHaveLength(0);
    expect(searchHelp('   ', HELP_TOPICS)).toHaveLength(0);
  });
  it('모든 FAQ는 자기 질문으로 찾을 수 있다', () => {
    for (const t of HELP_TOPICS) for (const f of t.faqs) {
      const hits = searchHelp(f.q, HELP_TOPICS, { limit: 3 });
      expect(hits.map((h) => h.faq.q), f.q).toContain(f.q);
    }
  });
});

describe('topicForPath', () => {
  it('주소로 메뉴를 찾는다', () => {
    expect(topicForPath('/a/admin', 'a', HELP_TOPICS)?.key).toBe('dashboard');
    expect(topicForPath('/a/admin/kakao/log', 'a', HELP_TOPICS)?.key).toBe('kakaolog');
    expect(topicForPath('/a/admin/kakao', 'a', HELP_TOPICS)?.key).toBe('kakao');
    expect(topicForPath('/a/admin/students/abc', 'a', HELP_TOPICS)?.key).toBe('students');
    expect(topicForPath('/a/other', 'a', HELP_TOPICS)).toBeUndefined();
  });
});

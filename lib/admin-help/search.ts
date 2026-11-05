/**
 * 관리자 도움말 검색 — AI 없이 질문과 FAQ를 글자 단위로 비교한다. 순수 함수(테스트 가능).
 * 한국어는 조사·어미가 붙어 단어가 딱 맞지 않으므로 두 글자 묶음(bigram) 겹침 + 키워드 포함 여부로 점수를 낸다.
 */

export type HelpFaq = { q: string; a: string; keywords?: string[] };
export type HelpTopic = {
  key: string;
  label: string;
  /** 이 메뉴 주소 (/{slug}/admin 뒤) — '' 는 대시보드 */
  path: string;
  summary: string;
  steps: string[];
  faqs: HelpFaq[];
  keywords?: string[];
};
export type HelpHit = { topic: HelpTopic; faq: HelpFaq; score: number };

// 질문에 흔히 붙지만 뜻을 가르지 않는 말
const STOP = ['어떻게', '어디서', '어디', '하나요', '하나', '해요', '되나요', '되요', '돼요', '할수', '수있', '있나요', '있어요', '방법', '알려줘', '알려', '주세요', '싶어요', '싶은데', '은', '는', '이', '가', '을', '를', '에', '좀', '왜', '뭐', '무엇'];

export function normalize(s: string): string {
  return s.toLowerCase().replace(/[^0-9a-z가-힣]+/g, ' ').trim();
}

function words(s: string): string[] {
  return normalize(s)
    .split(' ')
    .filter((w) => w && !STOP.includes(w));
}

function bigrams(s: string): Set<string> {
  const out = new Set<string>();
  for (const w of words(s)) {
    if (w.length === 1) out.add(w);
    for (let i = 0; i < w.length - 1; i++) out.add(w.slice(i, i + 2));
  }
  return out;
}

function overlap(a: Set<string>, b: Set<string>): number {
  let n = 0;
  for (const x of a) if (b.has(x)) n++;
  return n;
}

export function scoreFaq(query: string, topic: HelpTopic, faq: HelpFaq): number {
  const qb = bigrams(query);
  if (qb.size === 0) return 0;
  const qn = normalize(query).replace(/ /g, '');
  // 질문 문장과 겹침이 가장 중요, 답변 본문은 가볍게
  let score = (overlap(qb, bigrams(faq.q)) / qb.size) * 3 + (overlap(qb, bigrams(faq.a)) / qb.size) * 1;
  for (const k of [...(faq.keywords ?? []), ...(topic.keywords ?? []), topic.label]) {
    const kn = normalize(k).replace(/ /g, '');
    if (kn && qn.includes(kn)) score += kn.length >= 3 ? 1.5 : 1;
  }
  return score;
}

/** 질문에 맞는 FAQ를 점수 순으로. currentKey 메뉴의 FAQ는 조금 더 위로 올린다. */
export function searchHelp(query: string, topics: HelpTopic[], opts: { currentKey?: string; limit?: number } = {}): HelpHit[] {
  const limit = opts.limit ?? 3;
  const hits: HelpHit[] = [];
  for (const topic of topics) {
    for (const faq of topic.faqs) {
      let score = scoreFaq(query, topic, faq);
      if (score <= 0) continue;
      if (topic.key === opts.currentKey) score *= 1.15;
      hits.push({ topic, faq, score });
    }
  }
  hits.sort((a, b) => b.score - a.score);
  // 너무 약한 결과는 버린다 (1등 점수의 40% 미만, 또는 절대 점수가 낮음)
  const top = hits[0]?.score ?? 0;
  return hits.filter((h) => h.score >= 0.9 && h.score >= top * 0.4).slice(0, limit);
}

/** 주소로 지금 메뉴 찾기 — /{slug}/admin/kakao/log 는 kakao가 아니라 kakaolog */
export function topicForPath(pathname: string, slug: string, topics: HelpTopic[]): HelpTopic | undefined {
  const base = `/${slug}/admin`;
  if (!pathname.startsWith(base)) return undefined;
  const rest = pathname.slice(base.length).replace(/^\/+/, '').replace(/\/+$/, '');
  let best: HelpTopic | undefined;
  for (const t of topics) {
    if (t.path === '' ? rest === '' : rest === t.path || rest.startsWith(`${t.path}/`)) {
      if (!best || t.path.length > best.path.length) best = t;
    }
  }
  return best;
}

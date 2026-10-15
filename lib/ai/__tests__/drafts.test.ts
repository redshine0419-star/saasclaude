import { afterEach, describe, expect, it, vi } from 'vitest';

const parse = vi.fn();
vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    beta = { messages: { parse } };
  },
}));

async function load() {
  vi.resetModules();
  return import('../drafts');
}

const ctx = { academyName: '하늘수학', subjects: '수학' };

afterEach(() => {
  vi.unstubAllEnvs();
  parse.mockReset();
});

describe('generateDraft', () => {
  it('API 키가 없으면 종류별 목 응답을 돌려준다', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '');
    vi.stubEnv('ANTHROPIC_AUTH_TOKEN', '');
    const { generateDraft } = await load();
    const d = await generateDraft('director', '중고등 수학을 12년째 가르칩니다. 틀린 이유를 함께 찾습니다.', ctx);
    const c = await generateDraft('class', '중2 심화반은 개념 정리 후 서술형 문제를 풉니다.', ctx);
    const p = await generateDraft('post', '겨울방학 특강 모집합니다. 12월 20일부터.', ctx);
    expect(d.ok && 'headline' in d.draft).toBe(true);
    expect(c.ok && 'description' in c.draft).toBe(true);
    expect(p.ok && 'title' in p.draft && 'body' in p.draft).toBe(true);
    expect(parse).not.toHaveBeenCalled();
  });

  it('요청에 모델·폴백·낮은 effort·원문 태그를 넣고, 결과 길이를 자른다', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'test');
    parse.mockResolvedValue({
      stop_reason: 'end_turn',
      parsed_output: { headline: '가'.repeat(80), philosophy: '나'.repeat(400), career: '', education: '', omitted: ['전원 합격 보장'] },
      usage: { input_tokens: 500, output_tokens: 200 },
    });
    const { generateDraft } = await load();
    const r = await generateDraft('director', '원문입니다 원문입니다 원문입니다', ctx);
    const req = parse.mock.calls[0][0];
    expect(req.model).toBe('claude-opus-5-5');
    expect(req.fallbacks).toBe('default');
    expect(req.betas).toContain('server-side-fallback-2026-07-01');
    expect(req.output_config.effort).toBe('low');
    expect(req.messages[0].content).toContain('<source>\n원문입니다');
    expect(r.ok && r.draft.headline.length).toBe(40);
    expect(r.ok && r.draft.philosophy.length).toBe(300);
    expect(r.ok && r.draft.omitted).toEqual(['전원 합격 보장']);
    expect(r.ok && r.usage).toEqual({ inputTokens: 500, outputTokens: 200 });
  });

  it('소식 글은 제목·본문만 돌려주고 반·글종류 맥락을 함께 보낸다', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'test');
    parse.mockResolvedValue({
      stop_reason: 'end_turn',
      parsed_output: { title: '겨울방학 특강 안내', body: '본'.repeat(2000), omitted: [] },
      usage: { input_tokens: 1, output_tokens: 1 },
    });
    const { generateDraft } = await load();
    const r = await generateDraft('post', '겨울 특강 모집 안내문 원문', { ...ctx, extra: { 글종류: '특강·수강생 모집', 빈값: '' } });
    const req = parse.mock.calls[0][0];
    expect(req.messages[0].content).toContain('글종류: 특강·수강생 모집');
    expect(req.messages[0].content).not.toContain('빈값');
    expect(req.system).toContain('이번 글: 학원 소식 게시글');
    expect(r.ok && r.draft).toEqual({ title: '겨울방학 특강 안내', body: '본'.repeat(1500), omitted: [] });
  });

  it('거절되면 refused를 돌려준다', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'test');
    parse.mockResolvedValue({ stop_reason: 'refusal', parsed_output: null, usage: { input_tokens: 1, output_tokens: 0 } });
    const { generateDraft } = await load();
    expect(await generateDraft('class', 'x'.repeat(30), ctx)).toEqual({ ok: false, reason: 'refused' });
  });
});

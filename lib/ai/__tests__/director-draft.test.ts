import { afterEach, describe, expect, it, vi } from 'vitest';

const parse = vi.fn();
vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    beta = { messages: { parse } };
  },
}));

async function load() {
  vi.resetModules();
  return import('../director-draft');
}

afterEach(() => {
  vi.unstubAllEnvs();
  parse.mockReset();
});

describe('generateDirectorDraft', () => {
  it('API 키가 없으면 목 응답을 돌려준다', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '');
    vi.stubEnv('ANTHROPIC_AUTH_TOKEN', '');
    const { generateDirectorDraft } = await load();
    const r = await generateDirectorDraft('중고등 수학을 12년째 가르치고 있습니다. 틀린 이유를 함께 찾습니다.', { name: '하늘수학', subjects: '수학' });
    expect(r.ok).toBe(true);
    expect(parse).not.toHaveBeenCalled();
  });

  it('요청에 모델·폴백·낮은 effort·원문 태그를 넣고, 결과 길이를 자른다', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'test');
    parse.mockResolvedValue({
      stop_reason: 'end_turn',
      parsed_output: { headline: '가'.repeat(80), philosophy: '나'.repeat(400), career: '', education: '', omitted: ['전원 합격 보장'] },
      usage: { input_tokens: 500, output_tokens: 200 },
    });
    const { generateDirectorDraft } = await load();
    const r = await generateDirectorDraft('원문입니다 원문입니다 원문입니다', { name: '하늘수학', subjects: null });
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

  it('거절되면 refused를 돌려준다', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'test');
    parse.mockResolvedValue({ stop_reason: 'refusal', parsed_output: null, usage: { input_tokens: 1, output_tokens: 0 } });
    const { generateDirectorDraft } = await load();
    expect(await generateDirectorDraft('x'.repeat(30), { name: 'a', subjects: null })).toEqual({ ok: false, reason: 'refused' });
  });
});

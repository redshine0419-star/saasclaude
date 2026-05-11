import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';

const geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');
const anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? '' });

export interface AIUsage {
  provider: 'gemini' | 'claude';
  model: string;
  promptTokens?: number;
  outputTokens?: number;
  latencyMs: number;
  fallback: boolean;
}

export interface AIResult {
  text: string;
  usage: AIUsage;
}

export interface ChatMessage { role: 'user' | 'assistant'; content: string; }

/** Chat with message history — Gemini primary, Claude fallback.
 *  Builds a single prompt string to avoid Gemini's history-must-start-with-user constraint.
 */
export async function generateChat(
  systemPrompt: string,
  messages: ChatMessage[],
): Promise<AIResult> {
  // Build a single prompt: system + conversation history + last user message
  const historyText = messages.slice(0, -1)
    .map((m) => (m.role === 'user' ? 'User: ' : 'Assistant: ') + m.content)
    .join('\n');
  const lastMessage = messages[messages.length - 1].content;

  const fullPrompt = systemPrompt +
    (historyText ? '\n\n[대화 이력]\n' + historyText : '') +
    '\n\nUser: ' + lastMessage +
    '\n\nAssistant:';

  return generateText(fullPrompt);
}

/**
 * Generate text with Gemini primary, Claude fallback.
 * Set FORCE_CLAUDE=true env var to always use Claude (for testing).
 */
export async function generateText(prompt: string): Promise<AIResult> {
  const t0 = Date.now();

  if (process.env.FORCE_CLAUDE !== 'true') {
    try {
      const model = geminiClient.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const usage = result.response.usageMetadata;
      return {
        text,
        usage: {
          provider: 'gemini',
          model: 'gemini-2.5-flash',
          promptTokens: usage?.promptTokenCount,
          outputTokens: usage?.candidatesTokenCount,
          latencyMs: Date.now() - t0,
          fallback: false,
        },
      };
    } catch (err) {
      const geminiErr = (err as Error).message;
      console.warn('[AI] Gemini failed, falling back to Claude:', geminiErr);
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('Gemini 오류: ' + geminiErr);
      }
    }
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다.');
  }

  // Fallback: Claude claude-sonnet-4-6
  const t1 = Date.now();
  const message = await anthropicClient.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });
  const text = message.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
  return {
    text,
    usage: {
      provider: 'claude',
      model: 'claude-sonnet-4-6',
      promptTokens: message.usage.input_tokens,
      outputTokens: message.usage.output_tokens,
      latencyMs: Date.now() - t1,
      fallback: true,
    },
  };
}

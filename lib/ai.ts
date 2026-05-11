import { GoogleGenerativeAI, Content } from '@google/generative-ai';
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

/** Chat with message history — Gemini primary, Claude fallback. */
export async function generateChat(
  systemPrompt: string,
  messages: ChatMessage[],
): Promise<AIResult> {
  const t0 = Date.now();

  if (process.env.FORCE_CLAUDE !== 'true') {
    try {
      const model = geminiClient.getGenerativeModel({
        model: 'gemini-2.0-flash',
        systemInstruction: systemPrompt,
      });
      const history: Content[] = messages.slice(0, -1).map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));
      const lastMessage = messages[messages.length - 1].content;
      const chat = model.startChat({ history });
      const result = await chat.sendMessage(lastMessage);
      const text = result.response.text();
      return {
        text,
        usage: { provider: 'gemini', model: 'gemini-2.0-flash', latencyMs: Date.now() - t0, fallback: false },
      };
    } catch (err) {
      console.warn('[AI] Gemini chat failed, falling back to Claude:', (err as Error).message);
    }
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('AI 서비스를 사용할 수 없습니다. 환경변수를 확인해주세요.');
  }

  const t1 = Date.now();
  const anthropicMessages: Anthropic.MessageParam[] = messages.map((m) => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: m.content,
  }));
  const message = await anthropicClient.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: systemPrompt,
    messages: anthropicMessages,
  });
  const text = message.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
  return {
    text,
    usage: {
      provider: 'claude', model: 'claude-sonnet-4-6',
      promptTokens: message.usage.input_tokens, outputTokens: message.usage.output_tokens,
      latencyMs: Date.now() - t1, fallback: true,
    },
  };
}

/**
 * Generate text with Gemini primary, Claude fallback.
 * Set FORCE_CLAUDE=true env var to always use Claude (for testing).
 */
export async function generateText(prompt: string): Promise<AIResult> {
  const t0 = Date.now();

  if (process.env.FORCE_CLAUDE !== 'true') {
    try {
      const model = geminiClient.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const usage = result.response.usageMetadata;
      return {
        text,
        usage: {
          provider: 'gemini',
          model: 'gemini-2.0-flash',
          promptTokens: usage?.promptTokenCount,
          outputTokens: usage?.candidatesTokenCount,
          latencyMs: Date.now() - t0,
          fallback: false,
        },
      };
    } catch (err) {
      console.warn('[AI] Gemini failed, falling back to Claude:', (err as Error).message);
    }
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('AI 서비스를 사용할 수 없습니다. 환경변수를 확인해주세요.');
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

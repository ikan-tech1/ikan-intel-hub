import OpenAI from 'openai';
import type {
  AIProvider,
  ChatChunk,
  ChatOptions,
  GenOptions,
  GenResult,
  ModelAlias,
  ProviderId,
} from '../provider.js';
import { toOpenAIMessages } from '../provider.js';

// Groq free-tier models — fastest token-per-second on the market for these
const GROQ_MODELS: Record<ModelAlias, string> = {
  agent: 'llama-3.3-70b-versatile',
  reasoning: 'llama-3.3-70b-versatile',
  extract: 'llama-3.1-8b-instant',
  summary: 'llama-3.3-70b-versatile',
};

export class GroqProvider implements AIProvider {
  readonly id: ProviderId = 'groq';
  readonly enabled: boolean;
  private client: OpenAI | null;

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    this.enabled = Boolean(apiKey);
    this.client = apiKey
      ? new OpenAI({
          apiKey,
          baseURL: 'https://api.groq.com/openai/v1',
        })
      : null;
  }

  resolveModel(alias: ModelAlias): string {
    return GROQ_MODELS[alias];
  }

  async *chat(opts: ChatOptions): AsyncIterable<ChatChunk> {
    if (!this.client) throw new Error('Groq provider not configured');

    const stream = await this.client.chat.completions.create({
      model: this.resolveModel(opts.model ?? 'agent'),
      messages: toOpenAIMessages(opts.messages),
      stream: true,
      ...(opts.tools ? { tools: opts.tools, tool_choice: 'auto' } : {}),
      ...(opts.responseFormat === 'json_object'
        ? { response_format: { type: 'json_object' } }
        : {}),
      ...(typeof opts.temperature === 'number' ? { temperature: opts.temperature } : {}),
      ...(typeof opts.maxTokens === 'number' ? { max_tokens: opts.maxTokens } : {}),
    });

    for await (const chunk of stream) {
      const choice = chunk.choices[0];
      const delta = choice?.delta;

      if (delta?.content) yield { delta: delta.content };

      if (delta?.tool_calls) {
        for (const tc of delta.tool_calls) {
          yield {
            delta: '',
            toolCall: {
              index: tc.index,
              ...(tc.id ? { id: tc.id } : {}),
              ...(tc.function?.name ? { name: tc.function.name } : {}),
              ...(tc.function?.arguments ? { argsDelta: tc.function.arguments } : {}),
            },
          };
        }
      }

      if (choice?.finish_reason) {
        yield { delta: '', finishReason: choice.finish_reason as ChatChunk['finishReason'] };
      }
    }
  }

  async generate(opts: GenOptions): Promise<GenResult> {
    if (!this.client) throw new Error('Groq provider not configured');
    const model = this.resolveModel(opts.model ?? 'extract');

    const res = await this.client.chat.completions.create({
      model,
      messages: toOpenAIMessages(opts.messages),
      ...(opts.responseFormat === 'json_object'
        ? { response_format: { type: 'json_object' } }
        : {}),
      ...(typeof opts.temperature === 'number' ? { temperature: opts.temperature } : {}),
      ...(typeof opts.maxTokens === 'number' ? { max_tokens: opts.maxTokens } : {}),
    });

    const choice = res.choices[0];
    return {
      text: choice?.message?.content ?? '',
      toolCalls: choice?.message?.tool_calls?.map((tc) => ({
        id: tc.id,
        type: 'function' as const,
        function: { name: tc.function.name, arguments: tc.function.arguments },
      })),
      usage: {
        promptTokens: res.usage?.prompt_tokens ?? 0,
        completionTokens: res.usage?.completion_tokens ?? 0,
        totalTokens: res.usage?.total_tokens ?? 0,
      },
      finishReason: choice?.finish_reason ?? null,
      provider: this.id,
      model,
    };
  }

  async embed(_texts: string[]): Promise<number[][]> {
    throw new Error('Groq does not provide embeddings — use NIM');
  }
}

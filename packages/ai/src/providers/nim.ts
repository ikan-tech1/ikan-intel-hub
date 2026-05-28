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

const NIM_MODELS: Record<ModelAlias, string> = {
  agent: 'meta/llama-3.3-70b-instruct',
  reasoning: 'nvidia/llama-3.1-nemotron-70b-instruct',
  extract: 'meta/llama-3.1-8b-instruct',
  summary: 'meta/llama-3.3-70b-instruct',
};

const EMBED_MODEL = 'nvidia/nv-embedqa-e5-v5';

export class NIMProvider implements AIProvider {
  readonly id: ProviderId = 'nim';
  readonly enabled: boolean;
  private client: OpenAI | null;

  constructor() {
    const apiKey = process.env.NVIDIA_NIM_API_KEY;
    this.enabled = Boolean(apiKey);
    this.client = apiKey
      ? new OpenAI({
          apiKey,
          baseURL: process.env.NVIDIA_NIM_BASE_URL ?? 'https://integrate.api.nvidia.com/v1',
        })
      : null;
  }

  resolveModel(alias: ModelAlias): string {
    return NIM_MODELS[alias];
  }

  async *chat(opts: ChatOptions): AsyncIterable<ChatChunk> {
    if (!this.client) throw new Error('NIM provider not configured');

    const stream = await this.client.chat.completions.create({
      model: this.resolveModel(opts.model ?? 'agent'),
      messages: toOpenAIMessages(opts.messages),
      stream: true,
      stream_options: { include_usage: true },
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

      if (delta?.content) {
        yield { delta: delta.content };
      }

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
        yield {
          delta: '',
          finishReason: choice.finish_reason as ChatChunk['finishReason'],
          ...(chunk.usage
            ? {
                usage: {
                  promptTokens: chunk.usage.prompt_tokens,
                  completionTokens: chunk.usage.completion_tokens,
                  totalTokens: chunk.usage.total_tokens,
                },
              }
            : {}),
        };
      }
    }
  }

  async generate(opts: GenOptions): Promise<GenResult> {
    if (!this.client) throw new Error('NIM provider not configured');
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

  async embed(texts: string[]): Promise<number[][]> {
    if (!this.client) throw new Error('NIM provider not configured');
    if (texts.length === 0) return [];
    const res = await this.client.embeddings.create({
      model: EMBED_MODEL,
      input: texts,
      // NIM extensions: input_type required for nv-embedqa models
      ...({ input_type: 'passage' } as Record<string, string>),
    });
    return res.data
      .sort((a, b) => a.index - b.index)
      .map((d) => d.embedding as number[]);
  }
}

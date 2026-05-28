/**
 * AIProvider — pluggable LLM interface.
 *
 * We support a priority chain (NIM → OpenRouter → Groq) so a 429 on the
 * free tier doesn't tank a user's chat. All providers expose an
 * OpenAI-compatible Chat Completions API, which means we can talk to them
 * with the same `openai` SDK by varying baseURL.
 */

import type { ChatCompletionTool, ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export type Role = 'system' | 'user' | 'assistant' | 'tool';

export interface ChatMessage {
  role: Role;
  content: string;
  toolCallId?: string;
  toolCalls?: Array<{
    id: string;
    type: 'function';
    function: { name: string; arguments: string };
  }>;
  name?: string;
}

export interface ChatOptions {
  messages: ChatMessage[];
  model?: ModelAlias;
  tools?: ChatCompletionTool[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json_object';
  /** Stop after first assistant message (no tool-loop). */
  stop?: boolean;
}

export interface ChatChunk {
  delta: string;
  toolCall?: {
    index: number;
    id?: string;
    name?: string;
    argsDelta?: string;
  };
  finishReason?: 'stop' | 'tool_calls' | 'length' | 'content_filter';
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
}

export interface GenOptions {
  messages: ChatMessage[];
  model?: ModelAlias;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json_object';
}

export interface GenResult {
  text: string;
  toolCalls: ChatMessage['toolCalls'];
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  finishReason: string | null;
  provider: ProviderId;
  model: string;
}

/**
 * Logical model aliases. Each provider maps these to its concrete model id.
 * This lets the agent code request `agent` and have the right physical model
 * chosen by whichever provider is currently active.
 */
export type ModelAlias =
  | 'agent'         // 70B-class instruct — the chat brain (tool use)
  | 'reasoning'    // reasoning-tuned 70B — for "why this matters" + ranking
  | 'extract'      // 8B/instruct — high-volume structured extraction (JSON)
  | 'summary';     // 70B-class for human-grade summaries

export type ProviderId = 'nim' | 'openrouter' | 'groq';

export interface AIProvider {
  readonly id: ProviderId;
  readonly enabled: boolean;
  chat(opts: ChatOptions): AsyncIterable<ChatChunk>;
  generate(opts: GenOptions): Promise<GenResult>;
  embed(texts: string[]): Promise<number[][]>;
  resolveModel(alias: ModelAlias): string;
}

/** Reusable OpenAI ChatCompletion message conversion */
export function toOpenAIMessages(msgs: ChatMessage[]): ChatCompletionMessageParam[] {
  return msgs.map((m) => {
    if (m.role === 'tool') {
      return {
        role: 'tool',
        content: m.content,
        tool_call_id: m.toolCallId ?? '',
      };
    }
    if (m.role === 'assistant') {
      return {
        role: 'assistant',
        content: m.content || null,
        ...(m.toolCalls ? { tool_calls: m.toolCalls } : {}),
      };
    }
    return { role: m.role, content: m.content };
  }) as ChatCompletionMessageParam[];
}

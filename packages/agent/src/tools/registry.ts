import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import type { SourceCitation, ToolResult } from '@ikan/shared/types';
import { ToolArgs, type ToolName } from '@ikan/shared/schemas';

/**
 * Local mirror of the OpenAI ChatCompletionTool shape — re-declared here to
 * avoid pulling the `openai` package into `@ikan/agent`. The shape matches
 * what every OpenAI-compatible API (including NIM) expects.
 */
export interface ChatCompletionTool {
  type: 'function';
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
}

/**
 * Tool registry — declares each tool's name, description, args schema, and
 * handler. The agent loop introspects this to build the OpenAI-compatible
 * tool list and to dispatch tool_call requests.
 */

export interface ToolContext {
  userId: string;
  teamId: string | null;
  threadId: string | null;
  /** Emit a canvas event to the client (RSC streaming, AI SDK `data` channel). */
  emitCanvas?: (event: import('@ikan/shared/types').CanvasEvent) => void;
}

export interface ToolHandlerResult<T = unknown> {
  ok: boolean;
  result: T;
  sources: SourceCitation[];
  error?: string;
}

export type ToolHandler<Args> = (
  args: Args,
  ctx: ToolContext,
) => Promise<ToolHandlerResult>;

export interface ToolDefinition<Args = unknown> {
  name: ToolName;
  description: string;
  argsSchema: z.ZodType<Args>;
  handler: ToolHandler<Args>;
}

export type ToolRegistry = ReadonlyMap<ToolName, ToolDefinition>;

/** Build the OpenAI tools[] array from the registry. */
export function toOpenAITools(reg: ToolRegistry): ChatCompletionTool[] {
  return Array.from(reg.values()).map((t) => ({
    type: 'function' as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: zodToJsonSchema(t.argsSchema, {
        target: 'openApi3',
        $refStrategy: 'none',
      }) as Record<string, unknown>,
    },
  }));
}

/** Type-erased helper for building registry entries. */
export function defineTool<K extends ToolName>(
  name: K,
  description: string,
  handler: ToolHandler<z.infer<(typeof ToolArgs)[K]>>,
): ToolDefinition {
  return {
    name,
    description,
    argsSchema: ToolArgs[name] as z.ZodType<z.infer<(typeof ToolArgs)[K]>>,
    handler: handler as ToolHandler<unknown>,
  };
}

export function toolResult<T>(
  ok: boolean,
  result: T,
  sources: SourceCitation[] = [],
  error?: string,
): ToolHandlerResult<T> {
  return error ? { ok, result, sources, error } : { ok, result, sources };
}

export type { ToolResult };

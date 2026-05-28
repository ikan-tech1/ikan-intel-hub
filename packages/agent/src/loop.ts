import { prisma } from '@ikan/db';
import {
  AGENT_SYSTEM_PROMPT,
  getAIRouter,
  recordTokens,
  type ChatMessage,
} from '@ikan/ai';
import type { CanvasEvent } from '@ikan/shared/types';
import type { ToolName } from '@ikan/shared/schemas';
import { ToolArgs } from '@ikan/shared/schemas';
import { toolRegistry, toOpenAITools, type ToolContext } from './tools/index.js';
import { canvas } from './canvas-events.js';

const MAX_ITERATIONS = 8;

/**
 * AgentEvent — the unified stream the route handler consumes.
 *
 *   - `delta` is an incremental piece of the assistant's prose
 *   - `canvas` is a structured update for the live canvas column
 *   - `tool` events surface what the agent did, for "radical transparency"
 *   - `done` signals end of stream with token usage + citation map
 */
export type AgentEvent =
  | { type: 'delta'; text: string }
  | { type: 'canvas'; event: CanvasEvent }
  | { type: 'tool'; name: string; args: unknown; result: unknown; ok: boolean; durationMs: number }
  | {
      type: 'done';
      assistantText: string;
      tokensIn: number;
      tokensOut: number;
      citations: Array<{ marker: number; sourceId: string; url: string; snippet: string | null }>;
      toolCallIds: string[];
    }
  | { type: 'error'; message: string };

export interface RunAgentInput {
  userId: string;
  teamId: string | null;
  threadId: string;
  userMessage: string;
  history?: ChatMessage[];
}

/**
 * runAgent — orchestrates the chat. Yields AgentEvents as work happens.
 *
 * Pattern:
 *   1. Persist the user message
 *   2. Loop up to MAX_ITERATIONS:
 *      a. Call the LLM with system + history + accumulated messages
 *      b. Stream deltas to the caller
 *      c. Accumulate tool_call chunks
 *      d. If finish_reason === 'tool_calls', dispatch each tool, append
 *         the tool result as a 'tool' message, continue
 *      e. If finish_reason === 'stop', persist + emit done
 */
export async function* runAgent(input: RunAgentInput): AsyncGenerator<AgentEvent> {
  const router = getAIRouter();
  const tools = toOpenAITools(toolRegistry);

  // Persist user message
  await prisma.chatMessage.create({
    data: {
      threadId: input.threadId,
      role: 'USER',
      content: input.userMessage,
    },
  });

  const messages: ChatMessage[] = [
    { role: 'system', content: AGENT_SYSTEM_PROMPT },
    ...(input.history ?? []),
    { role: 'user', content: input.userMessage },
  ];

  // Track sources across all tool calls so we can post-process citations.
  type Citation = { marker: number; sourceId: string; url: string; snippet: string | null };
  const sourceMap = new Map<string, Citation>();
  const toolCallIds: string[] = [];

  // The canvas event emitter — buffers into our event stream
  const emitBuffer: CanvasEvent[] = [];
  const emitCanvas = (e: CanvasEvent) => emitBuffer.push(e);

  // Tool ctx
  const ctx: ToolContext = {
    userId: input.userId,
    teamId: input.teamId,
    threadId: input.threadId,
    emitCanvas,
  };

  let assistantText = '';
  let tokensIn = 0;
  let tokensOut = 0;

  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    // Accumulate the assistant turn (text + tool calls)
    let iterText = '';
    const pending = new Map<number, { id?: string; name?: string; args: string }>();
    let finish: 'stop' | 'tool_calls' | 'length' | 'content_filter' | null = null;

    try {
      const stream = router.chat({
        messages,
        model: 'agent',
        tools,
        temperature: 0.4,
      });

      for await (const chunk of stream) {
        if (chunk.delta) {
          iterText += chunk.delta;
          yield { type: 'delta', text: chunk.delta };
        }
        if (chunk.toolCall) {
          const slot = pending.get(chunk.toolCall.index) ?? { args: '' };
          if (chunk.toolCall.id) slot.id = chunk.toolCall.id;
          if (chunk.toolCall.name) slot.name = chunk.toolCall.name;
          if (chunk.toolCall.argsDelta) slot.args += chunk.toolCall.argsDelta;
          pending.set(chunk.toolCall.index, slot);
        }
        if (chunk.finishReason) {
          finish = chunk.finishReason;
          if (chunk.usage) {
            tokensIn += chunk.usage.promptTokens;
            tokensOut += chunk.usage.completionTokens;
          }
        }
        // Flush any pending canvas events to caller
        while (emitBuffer.length > 0) {
          const ev = emitBuffer.shift()!;
          yield { type: 'canvas', event: ev };
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'AI provider error';
      yield { type: 'error', message };
      return;
    }

    assistantText += iterText;

    if (finish === 'tool_calls' && pending.size > 0) {
      // Build assistant message with tool_calls payload (so the LLM sees its own decisions on next iter)
      const toolCalls = Array.from(pending.values())
        .filter((p) => p.id && p.name)
        .map((p) => ({
          id: p.id!,
          type: 'function' as const,
          function: { name: p.name!, arguments: p.args || '{}' },
        }));
      messages.push({
        role: 'assistant',
        content: iterText,
        toolCalls,
      });

      // Dispatch each tool call (sequential for MVP; can parallelize later)
      for (const tc of toolCalls) {
        const name = tc.function.name as ToolName;
        const def = toolRegistry.get(name);
        const t0 = Date.now();

        let argsParsed: unknown;
        try {
          argsParsed = JSON.parse(tc.function.arguments || '{}');
        } catch {
          argsParsed = {};
        }

        if (!def) {
          const msg = `Tool not found: ${name}`;
          yield {
            type: 'tool',
            name,
            args: argsParsed,
            result: { error: msg },
            ok: false,
            durationMs: 0,
          };
          messages.push({
            role: 'tool',
            content: JSON.stringify({ error: msg }),
            toolCallId: tc.id,
          });
          continue;
        }

        // Notify canvas / UI before dispatch
        canvas.toolStart(emitCanvas, name, JSON.stringify(argsParsed).slice(0, 80));
        while (emitBuffer.length > 0) {
          const ev = emitBuffer.shift()!;
          yield { type: 'canvas', event: ev };
        }

        // Validate args against schema (tolerate failure — let tool decide)
        const schema = ToolArgs[name];
        const validation = schema.safeParse(argsParsed);
        const safeArgs = validation.success ? validation.data : argsParsed;

        let result: unknown;
        let ok = true;
        try {
          const r = await def.handler(safeArgs as never, ctx);
          ok = r.ok;
          result = { result: r.result, sources: r.sources, error: r.error };
          // Add new sources to the citation map (dedupe by id, assign marker on first sight)
          for (const s of r.sources) {
            if (!sourceMap.has(s.id)) {
              sourceMap.set(s.id, {
                marker: sourceMap.size + 1,
                sourceId: s.id,
                url: s.url,
                snippet: s.snippet,
              });
            }
          }
        } catch (err) {
          ok = false;
          result = { error: err instanceof Error ? err.message : 'tool error' };
        }

        const durationMs = Date.now() - t0;

        // Persist the ToolCall row
        const tcRow = await prisma.toolCall.create({
          data: {
            messageId: '', // filled below — Prisma needs a placeholder; we'll patch after assistant message is created
            toolName: name,
            argumentsJson: argsParsed as object,
            resultJson: result as object,
            status: ok ? 'SUCCESS' : 'ERROR',
            latencyMs: durationMs,
            cached: false,
            completedAt: new Date(),
          },
        }).catch(() => null);
        if (tcRow) toolCallIds.push(tcRow.id);

        canvas.toolEnd(emitCanvas, name, durationMs, ok);
        while (emitBuffer.length > 0) {
          const ev = emitBuffer.shift()!;
          yield { type: 'canvas', event: ev };
        }

        yield { type: 'tool', name, args: safeArgs, result, ok, durationMs };

        messages.push({
          role: 'tool',
          content: JSON.stringify(result).slice(0, 12000), // keep context bounded
          toolCallId: tc.id,
        });
      }

      // Loop again — let the model react to tool results
      continue;
    }

    // No tool calls — assistant is done talking. Break.
    if (finish === 'stop' || finish === 'length') break;

    // If we got here with no tool calls and no clear stop, prevent infinite spin
    if (pending.size === 0) break;
  }

  // Record budget
  await recordTokens(tokensIn + tokensOut);

  // Persist final assistant message
  const citations = Array.from(sourceMap.values()).sort((a, b) => a.marker - b.marker);
  const assistantRow = await prisma.chatMessage.create({
    data: {
      threadId: input.threadId,
      role: 'ASSISTANT',
      content: assistantText,
      tokenInput: tokensIn,
      tokenOutput: tokensOut,
      model: 'agent',
      toolCallIds,
      citations: citations as unknown as object,
    },
  });

  // Patch tool calls with the assistant message id
  if (toolCallIds.length > 0) {
    await prisma.toolCall.updateMany({
      where: { id: { in: toolCallIds } },
      data: { messageId: assistantRow.id },
    });
  }

  // Update thread timestamp (and auto-title if missing)
  const thread = await prisma.chatThread.findUnique({ where: { id: input.threadId } });
  if (thread && !thread.title) {
    const title =
      input.userMessage.length > 60
        ? input.userMessage.slice(0, 57) + '…'
        : input.userMessage;
    await prisma.chatThread.update({
      where: { id: input.threadId },
      data: { title, updatedAt: new Date() },
    });
  } else {
    await prisma.chatThread.update({
      where: { id: input.threadId },
      data: { updatedAt: new Date() },
    });
  }

  yield {
    type: 'done',
    assistantText,
    tokensIn,
    tokensOut,
    citations,
    toolCallIds,
  };
}

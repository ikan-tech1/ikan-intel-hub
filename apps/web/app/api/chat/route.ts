import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@ikan/db';
import { runAgent, type AgentEvent } from '@ikan/agent';
import { getDemoUser } from '@/lib/demo-user';

/**
 * POST /api/chat — the streaming chat endpoint that drives the agent loop.
 *
 * Request:
 *   { threadId: string | null, message: string }
 *
 * Response (newline-delimited JSON, application/x-ndjson):
 *   {"t":"thread","id":"..."}
 *   {"t":"delta","text":"..."}
 *   {"t":"canvas","event":{...}}
 *   {"t":"tool_start","name":"...","argsPreview":"..."}
 *   {"t":"tool_end","name":"...","durationMs":123,"ok":true}
 *   {"t":"done","citations":[...]}
 *   {"t":"error","message":"..."}
 *
 * Runs in the Node.js runtime (not Edge) because we need the Prisma client
 * and node:dns (MX checks) which neither work on the Edge.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const Body = z.object({
  threadId: z.string().nullable().optional(),
  message: z.string().min(1).max(8000),
});

export async function POST(req: NextRequest) {
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'bad request' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const user = await getDemoUser();

  // Find or create the chat thread.
  let threadId = body.threadId ?? null;
  if (!threadId) {
    const thread = await prisma.chatThread.create({
      data: { userId: user.id },
    });
    threadId = thread.id;
  } else {
    const exists = await prisma.chatThread.findFirst({
      where: { id: threadId, userId: user.id },
      select: { id: true },
    });
    if (!exists) {
      const thread = await prisma.chatThread.create({
        data: { userId: user.id },
      });
      threadId = thread.id;
    }
  }

  // Load history (skip the current user message — agent prepends it itself)
  const historyRows = await prisma.chatMessage.findMany({
    where: { threadId },
    orderBy: { createdAt: 'asc' },
    take: 40,
  });
  const history = historyRows.map((m) => ({
    role:
      m.role === 'USER'
        ? ('user' as const)
        : m.role === 'ASSISTANT'
          ? ('assistant' as const)
          : ('tool' as const),
    content: m.content,
  }));

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) => {
        controller.enqueue(encoder.encode(JSON.stringify(obj) + '\n'));
      };

      // Surface thread id immediately so the client can persist it.
      send({ t: 'thread', id: threadId });

      try {
        for await (const ev of runAgent({
          userId: user.id,
          teamId: user.teamId,
          threadId: threadId!,
          userMessage: body.message,
          history,
        })) {
          translate(ev, send);
        }
      } catch (err) {
        send({
          t: 'error',
          message: err instanceof Error ? err.message : 'agent error',
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store, no-transform',
      'X-Accel-Buffering': 'no',
    },
  });
}

function translate(ev: AgentEvent, send: (obj: unknown) => void) {
  switch (ev.type) {
    case 'delta':
      send({ t: 'delta', text: ev.text });
      break;
    case 'canvas':
      // Convert nested tool_start/end canvas events into top-level
      // events for the client (tool_start/end are easier to render that way).
      if (ev.event.type === 'canvas:tool_start') {
        send({
          t: 'tool_start',
          name: ev.event.payload.name,
          argsPreview: ev.event.payload.argsPreview,
        });
      } else if (ev.event.type === 'canvas:tool_end') {
        send({
          t: 'tool_end',
          name: ev.event.payload.name,
          durationMs: ev.event.payload.durationMs,
          ok: ev.event.payload.ok,
        });
      } else {
        send({ t: 'canvas', event: ev.event });
      }
      break;
    case 'tool':
      // We already surface tool_start/end via canvas events; this is mostly
      // for server-side persistence + telemetry. Not forwarded to client.
      break;
    case 'done':
      send({ t: 'done', citations: ev.citations });
      break;
    case 'error':
      send({ t: 'error', message: ev.message });
      break;
  }
}

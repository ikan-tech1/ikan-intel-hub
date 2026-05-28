/**
 * Tool Server — HTTPS service that exposes the agent's tools as plain HTTP
 * endpoints. Used when we want to call tools without going through the
 * agent loop (e.g., from the worker, from server actions, from the
 * extension's "save to hub" flow).
 *
 * MVP: a thin Express wrapper around the @ikan/agent tool registry. For
 * production it can move behind a proper auth gate; right now we treat it
 * as same-network internal.
 *
 * For the chat hero MVP this server is OPTIONAL — the Next.js route
 * /api/chat invokes the agent loop directly. This entry exists so workers
 * and the extension can call tools without re-implementing them.
 */

import express from 'express';
import { z } from 'zod';
import { toolRegistry, type ToolContext } from '@ikan/agent';
import type { ToolName } from '@ikan/shared/schemas';

const app = express();
app.use(express.json({ limit: '1mb' }));

const Body = z.object({
  tool: z.string(),
  args: z.unknown(),
  userId: z.string(),
  teamId: z.string().nullable().optional(),
  threadId: z.string().nullable().optional(),
});

app.post('/tools/invoke', async (req, res) => {
  const parsed = Body.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.message });
  }
  const { tool, args, userId, teamId, threadId } = parsed.data;
  const def = toolRegistry.get(tool as ToolName);
  if (!def) return res.status(404).json({ error: `Unknown tool ${tool}` });

  const ctx: ToolContext = { userId, teamId: teamId ?? null, threadId: threadId ?? null };

  // Validate args against the tool's zod schema
  const argsResult = def.argsSchema.safeParse(args);
  if (!argsResult.success) {
    return res.status(400).json({ error: argsResult.error.message });
  }

  try {
    const result = await def.handler(argsResult.data as never, ctx);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'tool error',
    });
  }
});

app.get('/health', (_req, res) => res.json({ ok: true }));

app.get('/tools', (_req, res) => {
  const tools = Array.from(toolRegistry.values()).map((t) => ({
    name: t.name,
    description: t.description,
  }));
  res.json({ tools });
});

const port = Number(process.env.PORT ?? 4001);
app.listen(port, () => {
  console.log(`✓ tool-server listening on :${port}`);
});

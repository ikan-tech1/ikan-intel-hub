import { prisma } from '@ikan/db';
import type { z } from 'zod';
import type { ToolArgs } from '@ikan/shared/schemas';
import { defineTool, toolResult } from './registry.js';

type CreateListArgs = z.infer<(typeof ToolArgs)['create_list']>;
type AddToListArgs = z.infer<(typeof ToolArgs)['add_to_list']>;

export const createListTool = defineTool(
  'create_list',
  "Create a new list (or watchlist) for the current user. Use when the user asks to start building a target account/contact list. Returns the new list's id.",
  async (args: CreateListArgs, ctx) => {
    const list = await prisma.list.create({
      data: {
        userId: ctx.userId,
        name: args.name,
        ...(args.description ? { description: args.description } : {}),
        kind: args.kind.toUpperCase() as 'COMPANY_LIST' | 'PERSON_LIST' | 'MIXED',
        isWatchlist: args.isWatchlist,
      },
    });
    return toolResult(
      true,
      {
        id: list.id,
        name: list.name,
        kind: list.kind.toLowerCase(),
        isWatchlist: list.isWatchlist,
        createdAt: list.createdAt.toISOString(),
      },
      [
        {
          id: `list:${list.id}`,
          url: `https://hub.ikan.example/lists/${list.id}`,
          snippet: `List "${list.name}" created`,
          fetchedAt: list.createdAt.toISOString(),
          trustTier: 'primary' as const,
        },
      ],
    );
  },
);

export const addToListTool = defineTool(
  'add_to_list',
  'Add a company or person to a list. Use after `create_list` or when the user references an existing list. Idempotent — re-adding an existing item is a no-op.',
  async (args: AddToListArgs, _ctx) => {
    // Verify the entity exists
    if (args.entityKind === 'company') {
      const c = await prisma.company.findUnique({ where: { id: args.entityId }, select: { id: true } });
      if (!c) return toolResult(false, null, [], `Company ${args.entityId} not found`);
    } else {
      const p = await prisma.person.findUnique({ where: { id: args.entityId }, select: { id: true } });
      if (!p) return toolResult(false, null, [], `Person ${args.entityId} not found`);
    }

    await prisma.listItem.upsert({
      where: {
        listId_entityKind_entityId: {
          listId: args.listId,
          entityKind: args.entityKind,
          entityId: args.entityId,
        },
      },
      update: args.notes ? { notes: args.notes } : {},
      create: {
        listId: args.listId,
        entityKind: args.entityKind,
        entityId: args.entityId,
        ...(args.notes ? { notes: args.notes } : {}),
      },
    });

    return toolResult(
      true,
      { listId: args.listId, entityKind: args.entityKind, entityId: args.entityId, ok: true },
      [],
    );
  },
);

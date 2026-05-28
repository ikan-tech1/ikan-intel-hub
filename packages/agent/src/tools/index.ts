import type { ToolName } from '@ikan/shared/schemas';
import type { ToolDefinition, ToolRegistry } from './registry.js';
import {
  searchCompaniesTool,
  searchPersonsTool,
  searchSignalsTool,
} from './search.js';
import { getCompanyBriefTool, getPersonBriefTool } from './briefs.js';
import { findContactsTool } from './contacts.js';
import { linkedinLookupTool } from './linkedin.js';
import { createListTool, addToListTool } from './lists.js';
import {
  refreshEntityTool,
  generateOutreachBriefTool,
  exportCsvTool,
} from './misc.js';

/**
 * The single registry the agent loop uses. Order here also drives the order
 * in which tools are presented to the LLM (which has minor effect on usage
 * patterns).
 */
const TOOLS: ToolDefinition[] = [
  searchCompaniesTool,
  searchPersonsTool,
  searchSignalsTool,
  getCompanyBriefTool,
  getPersonBriefTool,
  findContactsTool,
  linkedinLookupTool,
  refreshEntityTool,
  createListTool,
  addToListTool,
  generateOutreachBriefTool,
  exportCsvTool,
];

export const toolRegistry: ToolRegistry = new Map(
  TOOLS.map((t) => [t.name as ToolName, t]),
);

export {
  defineTool,
  toolResult,
  toOpenAITools,
  type ToolContext,
  type ToolDefinition,
  type ToolHandler,
  type ToolHandlerResult,
  type ToolRegistry,
} from './registry.js';

/**
 * Canvas events — server emits these onto the Vercel AI SDK `data` channel as
 * the agent runs tool calls. The client renders cards/rows progressively,
 * giving the "live structured canvas" experience.
 *
 * Each event is a tiny JSON payload (<2KB) so streaming is snappy.
 */

import type {
  CanvasEvent,
  CompanyBrief,
  PersonBrief,
  SignalBrief,
  ContactPointBrief,
} from '@ikan/shared/types';

export type EmitCanvas = (event: CanvasEvent) => void;

export const canvas = {
  reset(emit: EmitCanvas): void {
    emit({ type: 'canvas:reset' });
  },
  companyCard(emit: EmitCanvas, payload: CompanyBrief): void {
    emit({ type: 'canvas:add_company_card', payload });
  },
  personRow(emit: EmitCanvas, payload: PersonBrief): void {
    emit({ type: 'canvas:add_person_row', payload });
  },
  signal(emit: EmitCanvas, payload: SignalBrief): void {
    emit({ type: 'canvas:add_signal', payload });
  },
  contact(emit: EmitCanvas, personId: string, contact: ContactPointBrief): void {
    emit({ type: 'canvas:add_contact', payload: { personId, contact } });
  },
  toolStart(emit: EmitCanvas, name: string, argsPreview: string): void {
    emit({ type: 'canvas:tool_start', payload: { name, argsPreview } });
  },
  toolEnd(emit: EmitCanvas, name: string, durationMs: number, ok: boolean): void {
    emit({ type: 'canvas:tool_end', payload: { name, durationMs, ok } });
  },
};

export type { CanvasEvent };

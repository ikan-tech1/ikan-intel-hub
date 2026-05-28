'use client';

import { useCallback, useReducer, useRef } from 'react';
import type {
  CanvasEvent,
  CompanyBrief,
  PersonBrief,
  SignalBrief,
  ContactPointBrief,
} from '@ikan/shared/types';

/**
 * useIkanChat — single hook that owns chat state + the network stream.
 *
 * Protocol (see /api/chat):
 *   The server sends JSON-lines, one event per line:
 *     {"t":"delta","text":"..."}
 *     {"t":"canvas","event":{...}}
 *     {"t":"tool","name":"...","ok":true,"durationMs":123}
 *     {"t":"done","citations":[...]}
 *     {"t":"error","message":"..."}
 *
 * The hook accumulates deltas into the current assistant message and applies
 * canvas events to the normalized stores.
 */

export interface UserMessage {
  role: 'user';
  id: string;
  text: string;
}
export interface AssistantMessage {
  role: 'assistant';
  id: string;
  text: string;
  citations: Array<{ marker: number; sourceId: string; url: string; snippet: string | null }>;
  toolCalls: ToolCallView[];
  isStreaming: boolean;
}
export type ChatMessage = UserMessage | AssistantMessage;

export interface ToolCallView {
  name: string;
  state: 'running' | 'success' | 'error';
  durationMs: number | null;
  argsPreview: string | null;
}

export interface CanvasState {
  companies: Map<string, CompanyBrief>;
  companyOrder: string[];
  persons: Map<string, PersonBrief>;
  personOrder: string[];
  signals: Map<string, SignalBrief>;
  signalOrder: string[];
  contacts: Map<string, ContactPointBrief[]>;
}

interface State {
  threadId: string | null;
  messages: ChatMessage[];
  canvas: CanvasState;
  streaming: boolean;
  error: string | null;
}

const initialState: State = {
  threadId: null,
  messages: [],
  canvas: {
    companies: new Map(),
    companyOrder: [],
    persons: new Map(),
    personOrder: [],
    signals: new Map(),
    signalOrder: [],
    contacts: new Map(),
  },
  streaming: false,
  error: null,
};

type Action =
  | { type: 'submit'; userId: string; text: string; assistantId: string }
  | { type: 'thread'; id: string }
  | { type: 'delta'; text: string }
  | { type: 'canvas'; event: CanvasEvent }
  | { type: 'tool_start'; name: string; argsPreview: string }
  | { type: 'tool_end'; name: string; durationMs: number; ok: boolean }
  | {
      type: 'done';
      citations: AssistantMessage['citations'];
    }
  | { type: 'error'; message: string };

function applyCanvas(s: CanvasState, ev: CanvasEvent): CanvasState {
  switch (ev.type) {
    case 'canvas:reset':
      return {
        companies: new Map(),
        companyOrder: [],
        persons: new Map(),
        personOrder: [],
        signals: new Map(),
        signalOrder: [],
        contacts: new Map(),
      };
    case 'canvas:add_company_card': {
      const c = ev.payload;
      const companies = new Map(s.companies);
      companies.set(c.id, c);
      const order = s.companies.has(c.id) ? s.companyOrder : [...s.companyOrder, c.id];
      return { ...s, companies, companyOrder: order };
    }
    case 'canvas:add_person_row': {
      const p = ev.payload;
      const persons = new Map(s.persons);
      persons.set(p.id, p);
      const order = s.persons.has(p.id) ? s.personOrder : [...s.personOrder, p.id];
      return { ...s, persons, personOrder: order };
    }
    case 'canvas:add_signal': {
      const x = ev.payload;
      const signals = new Map(s.signals);
      signals.set(x.id, x);
      const order = s.signals.has(x.id) ? s.signalOrder : [...s.signalOrder, x.id];
      return { ...s, signals, signalOrder: order };
    }
    case 'canvas:add_contact': {
      const { personId, contact } = ev.payload;
      const contacts = new Map(s.contacts);
      const existing = contacts.get(personId) ?? [];
      // Replace if same id, else append
      const filtered = existing.filter((c) => c.id !== contact.id);
      contacts.set(personId, [...filtered, contact]);
      return { ...s, contacts };
    }
    default:
      return s;
  }
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'submit':
      return {
        ...state,
        streaming: true,
        error: null,
        messages: [
          ...state.messages,
          { role: 'user', id: action.userId, text: action.text },
          {
            role: 'assistant',
            id: action.assistantId,
            text: '',
            citations: [],
            toolCalls: [],
            isStreaming: true,
          },
        ],
      };
    case 'thread':
      return { ...state, threadId: action.id };
    case 'delta': {
      const last = state.messages[state.messages.length - 1];
      if (!last || last.role !== 'assistant') return state;
      const updated: AssistantMessage = { ...last, text: last.text + action.text };
      return { ...state, messages: [...state.messages.slice(0, -1), updated] };
    }
    case 'canvas':
      return { ...state, canvas: applyCanvas(state.canvas, action.event) };
    case 'tool_start': {
      const last = state.messages[state.messages.length - 1];
      if (!last || last.role !== 'assistant') return state;
      const tc: ToolCallView = {
        name: action.name,
        state: 'running',
        durationMs: null,
        argsPreview: action.argsPreview,
      };
      const updated: AssistantMessage = { ...last, toolCalls: [...last.toolCalls, tc] };
      return { ...state, messages: [...state.messages.slice(0, -1), updated] };
    }
    case 'tool_end': {
      const last = state.messages[state.messages.length - 1];
      if (!last || last.role !== 'assistant') return state;
      const toolCalls = [...last.toolCalls];
      // Update the most recent running tool with this name
      for (let i = toolCalls.length - 1; i >= 0; i--) {
        const t = toolCalls[i];
        if (t && t.name === action.name && t.state === 'running') {
          toolCalls[i] = {
            ...t,
            state: action.ok ? 'success' : 'error',
            durationMs: action.durationMs,
          };
          break;
        }
      }
      const updated: AssistantMessage = { ...last, toolCalls };
      return { ...state, messages: [...state.messages.slice(0, -1), updated] };
    }
    case 'done': {
      const last = state.messages[state.messages.length - 1];
      if (!last || last.role !== 'assistant') return { ...state, streaming: false };
      const updated: AssistantMessage = {
        ...last,
        citations: action.citations,
        isStreaming: false,
      };
      return { ...state, streaming: false, messages: [...state.messages.slice(0, -1), updated] };
    }
    case 'error':
      return { ...state, streaming: false, error: action.message };
    default:
      return state;
  }
}

export function useIkanChat({ threadId }: { threadId: string | null }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const threadRef = useRef<string | null>(threadId);
  threadRef.current = threadId;

  const send = useCallback(async (text: string) => {
    const userId = crypto.randomUUID();
    const assistantId = crypto.randomUUID();
    dispatch({ type: 'submit', userId, text, assistantId });

    let res: Response;
    try {
      res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId: threadRef.current, message: text }),
      });
    } catch (err) {
      dispatch({
        type: 'error',
        message: err instanceof Error ? err.message : 'Network error',
      });
      return;
    }
    if (!res.ok || !res.body) {
      dispatch({ type: 'error', message: `Request failed: ${res.status}` });
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      // Parse complete lines
      let nl = buffer.indexOf('\n');
      while (nl !== -1) {
        const raw = buffer.slice(0, nl);
        buffer = buffer.slice(nl + 1);
        nl = buffer.indexOf('\n');
        const line = raw.trim();
        if (!line) continue;
        try {
          const ev = JSON.parse(line) as
            | { t: 'thread'; id: string }
            | { t: 'delta'; text: string }
            | { t: 'canvas'; event: CanvasEvent }
            | { t: 'tool_start'; name: string; argsPreview: string }
            | { t: 'tool_end'; name: string; durationMs: number; ok: boolean }
            | { t: 'done'; citations: AssistantMessage['citations'] }
            | { t: 'error'; message: string };
          switch (ev.t) {
            case 'thread':
              threadRef.current = ev.id;
              dispatch({ type: 'thread', id: ev.id });
              break;
            case 'delta':
              dispatch({ type: 'delta', text: ev.text });
              break;
            case 'canvas':
              dispatch({ type: 'canvas', event: ev.event });
              break;
            case 'tool_start':
              dispatch({ type: 'tool_start', name: ev.name, argsPreview: ev.argsPreview });
              break;
            case 'tool_end':
              dispatch({
                type: 'tool_end',
                name: ev.name,
                durationMs: ev.durationMs,
                ok: ev.ok,
              });
              break;
            case 'done':
              dispatch({ type: 'done', citations: ev.citations });
              break;
            case 'error':
              dispatch({ type: 'error', message: ev.message });
              break;
          }
        } catch {
          // skip malformed line — protocol robustness
        }
      }
    }
  }, []);

  return {
    threadId: state.threadId,
    messages: state.messages,
    canvas: state.canvas,
    streaming: state.streaming,
    error: state.error,
    send,
  };
}

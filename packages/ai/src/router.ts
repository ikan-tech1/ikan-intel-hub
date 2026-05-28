import type { AIProvider, ChatOptions, GenOptions, GenResult, ProviderId } from './provider.js';
import { NIMProvider } from './providers/nim.js';
import { OpenRouterProvider } from './providers/openrouter.js';
import { GroqProvider } from './providers/groq.js';

/**
 * AIRouter — composes providers into a priority chain.
 *
 * Behavior:
 *  - Reads `AI_PROVIDER_ORDER` (e.g. "nim,openrouter,groq")
 *  - Iterates providers in order; on 429 / 5xx / timeout, falls through
 *  - Always uses NIM for embeddings (only one with embed models)
 */

const ALL: Record<ProviderId, () => AIProvider> = {
  nim: () => new NIMProvider(),
  openrouter: () => new OpenRouterProvider(),
  groq: () => new GroqProvider(),
};

function parseOrder(): ProviderId[] {
  const raw = process.env.AI_PROVIDER_ORDER ?? 'nim,openrouter,groq';
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is ProviderId => s === 'nim' || s === 'openrouter' || s === 'groq');
}

export class AIRouter {
  private providers: AIProvider[];

  constructor() {
    const order = parseOrder();
    this.providers = order.map((id) => ALL[id]()).filter((p) => p.enabled);
    if (this.providers.length === 0) {
      // Fall back to NIM-only — caller will get "not configured" on use.
      this.providers = [new NIMProvider()];
    }
  }

  get active(): AIProvider {
    const head = this.providers[0];
    if (!head) throw new Error('No AI providers configured');
    return head;
  }

  /**
   * Streaming chat. Tries each provider; on transient failure, falls through.
   * Note: once we start emitting deltas to the caller, we cannot fall back
   * mid-stream, so failure detection happens on the first chunk.
   */
  async *chat(opts: ChatOptions) {
    let lastErr: unknown;
    for (const p of this.providers) {
      try {
        const it = p.chat(opts)[Symbol.asyncIterator]();
        const first = await it.next();
        if (first.done) return;
        yield first.value;
        // First chunk succeeded — commit to this provider.
        while (true) {
          const next = await it.next();
          if (next.done) return;
          yield next.value;
        }
      } catch (err) {
        lastErr = err;
        if (!isRecoverable(err)) throw err;
        // Try next provider
      }
    }
    throw lastErr ?? new Error('All AI providers failed');
  }

  async generate(opts: GenOptions): Promise<GenResult> {
    let lastErr: unknown;
    for (const p of this.providers) {
      try {
        return await p.generate(opts);
      } catch (err) {
        lastErr = err;
        if (!isRecoverable(err)) throw err;
      }
    }
    throw lastErr ?? new Error('All AI providers failed');
  }

  /** Embeddings always go through NIM (the only provider in our chain that offers them). */
  async embed(texts: string[]): Promise<number[][]> {
    const nim = this.providers.find((p) => p.id === 'nim') ?? new NIMProvider();
    return nim.embed(texts);
  }
}

function isRecoverable(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { status?: number; code?: string; name?: string };
  if (e.status === 429) return true;
  if (typeof e.status === 'number' && e.status >= 500) return true;
  if (e.code === 'ETIMEDOUT' || e.code === 'ECONNRESET') return true;
  if (e.name === 'APITimeoutError') return true;
  return false;
}

// Singleton — cheap to construct, safe to reuse across requests.
let _router: AIRouter | null = null;
export function getAIRouter(): AIRouter {
  _router ??= new AIRouter();
  return _router;
}

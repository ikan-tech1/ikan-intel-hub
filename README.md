# Ikan Intel Hub

> *The India B2B intelligence terminal.* Ask about any company or person; get a complete, source-cited, contact-ready picture in seconds.

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker (for local Postgres + Redis)

### Setup

```bash
# Install dependencies
pnpm install

# Start local infrastructure
docker compose -f infra/docker-compose.yml up -d

# Create .env.local from example
cp .env.example .env.local
# Edit with your API keys (NVIDIA_NIM_API_KEY, SERPAPI_KEY, etc.)

# Run database migrations
pnpm db:migrate

# Seed with demo data
pnpm db:seed

# Start dev servers (turbo: all apps in parallel)
pnpm dev
```

Then:
- **Web**: http://localhost:3000
- **Storybook** (optional): http://localhost:6006

## Architecture

### Monorepo Structure

```
apps/
  web/              # Next.js 15 chat hero + canvas UI
  worker/           # BullMQ job handlers (scrapers, extraction, enrichment)
  nlp/              # Python FastAPI (readability, phones, geocoding)
  tool-server/      # HTTPS agent tools endpoint
  extension/        # Chrome MV3 for LinkedIn parsing

packages/
  db/               # Prisma ORM + migrations + seed
  shared/           # Types, enums, India constants
  ai/               # LLM provider abstraction (NIM + fallbacks) + cache + budget
  agent/            # Agent loop + 12 tools + canvas events
  search/           # SearchProvider (PostgresSearchProvider MVP)
  contacts/         # Contact discovery engine (10 layers)
  scrapers/         # 9 source adapters (company-site, news, careers, github, etc.)
```

### Key Concepts

**Agent Loop** (`packages/agent/src/loop.ts`)
- User types a question in the chat hero
- Server streams LLM response with tool-calling enabled
- Agent invokes tools (search, get-brief, find-contacts, linkedin-lookup, etc.)
- Each tool result is appended to the conversation
- Canvas updates in real-time as tools emit structured events
- Citations are post-processed and validated

**Contact Discovery Engine** (`packages/contacts/`)
- 10 layers of increasingly aggressive contact-finding (direct match → pattern inference → phone extraction)
- Configured via intensity: "low" (verified-only) → "medium" → "high" (include inferred)
- All inferred contacts labeled with confidence + source

**SearchProvider** (`packages/search/`)
- PostgresSearchProvider uses pg_trgm (fuzzy) + FTS + pgvector (semantic)
- Abstraction layer for swapping in Meilisearch later
- Used by agent tools and `/search` power-user page

**Scrapers** (`packages/scrapers/`)
- 9 adapters: company-site, news-rss, careers-public, github-org, serpapi-linkedin, bing-search, press-release, conferences, manual-csv
- SerpAPI + Bing for Google-indexed LinkedIn snippets (server-side, no ToS violation)
- Chrome extension for user's authenticated LinkedIn session (2nd track)

## Development Workflow

### Adding a New Tool

1. Create tool in `packages/agent/src/tools/{name}.ts`:
   ```ts
   export const myTool = defineTool(
     'tool_name',
     'description',
     async (args: z.infer<typeof ToolArgs.tool_name>, ctx) => {
       // ... impl
       return toolResult(true, data, sources);
     }
   );
   ```

2. Export from `packages/agent/src/tools/index.ts`

3. Add Zod schema to `packages/shared/schemas.ts`

4. Tool is automatically available in chat via the agent's tool registry

### Running Tests

```bash
# Typecheck
pnpm typecheck

# Lint
pnpm lint

# (Unit tests: coming in Phase 2)
```

### Environment Variables

See `.env.example` for complete list. Key ones:

- `NVIDIA_NIM_API_KEY` — LLM provider
- `DATABASE_URL` — Neon Postgres
- `UPSTASH_REDIS_URL` — Cache + job queue
- `SERPAPI_KEY`, `BING_SEARCH_KEY` — LinkedIn snippets
- `AUTH_SECRET` — Auth.js

## Deployment

### Vercel (Web App)

```bash
# Automatic on push to main
# Environment variables via Vercel dashboard
```

### Fly.io (Workers)

```bash
# Deploy worker
flyctl deploy -c infra/fly.worker.toml

# Deploy NLP service
flyctl deploy -c infra/fly.nlp.toml
```

### Neon (Database)

Auto-deployed via migration in CI/CD.

### Chrome Extension

Manual distribution as `.crx` to BD team during MVP; Chrome Web Store in Phase 2.

## Feature Roadmap

### MVP (Week 4)
- ✅ Chat hero + canvas
- ✅ Agent loop + 12 tools
- ✅ Contact discovery (layers 7–9: pattern, phones, MX)
- ✅ SerpAPI + Bing for LinkedIn snippets
- ✅ Chrome extension (user's authenticated LinkedIn session)
- ✅ Lists + CSV export
- ✅ Admin pages (ingestion, sources, DNC)
- ✅ DPDP compliance (DSR endpoint, audit log)

### Phase 2 (Weeks 5–10)
- Contact discovery layers 1–6 (direct match, cross-source, GitHub, conferences, LinkedIn extension, SerpAPI)
- MCA21 registry (Indian Ministry of Corporate Affairs)
- OpenCorporates (global structure)
- Crunchbase free-tier (funding signals)
- Org-graph visualization
- Email digest alerts
- Team + multi-user permissions
- Extension expansion (Twitter, Crunchbase, AngelList)
- Multi-region expansion (SEA)

## Data Privacy

- **DSR endpoint** (`/api/dsr/delete`) for DPDP Act 2023 data subject requests
- **Audit log** tracks all sensitive actions (contact reveals, exports)
- **DNC list** for opted-out individuals
- **No SMTP probing** — we never directly verify emails to SMTP servers
- **Encrypted storage** for contact_points (AES-256-GCM)

## Support

- Architecture questions: See `docs/architecture.md`
- Data model: See `docs/data-model.md`
- AI prompts: See `docs/ai-prompts.md`
- Compliance: See `docs/compliance.md`

---

*Built with ❤️ by Claude, for Ikan.*

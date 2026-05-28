# Ikan Intel Hub — Hardening & Expansion Queue

> The `/loop` task reads this file each tick. Pick the **first unchecked item**, ship it (code + commit + push), then mark it done by replacing `[ ]` with `[x]` in the same commit. Each tick should produce ONE merged improvement, not a planning doc.

## Rules for the loop

1. **One item per tick.** Don't sprawl. Pick `[ ]` at top of the unchecked list, finish it, commit + push, mark done.
2. **Production build must succeed.** Before commit, run `cd "/Users/egcorp/Ikan intel hub" && COREPACK_ENABLE_DOWNLOAD_PROMPT=0 pnpm --filter @ikan/web build`. If it fails, fix and retry; don't commit a broken build.
3. **Commit messages**: `<area>: <imperative summary>` — e.g. `auth: wire magic-link sign-in via Auth.js v5`. Always end with `Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>`.
4. **Vercel auto-deploys** on `git push origin main`. After push, `vercel inspect <deployment-url> --scope ikan-tech1` to confirm the build started.
5. **Add new ideas at the bottom** under "Ideas surfaced during work" so future ticks can pick them up.
6. **Honor the design system**: dark theme, electric-lime accent `#B8FF66`, Geist/Geist Mono/Instrument Serif typography, motion-as-state. No emoji in UI. No skeuomorphism. Premium terminal.

## Priority Queue — work top-to-bottom

### Foundations & Reliability

- [x] **Real auth (Auth.js v5 magic-link)** — Auth.js v5 + PrismaAdapter + Resend HTTPS (graceful console-fallback when `RESEND_API_KEY` is a placeholder). `/login` page (premium-styled, magic-link only). `/api/auth/[...nextauth]/route.ts` mounts the handlers. New `lib/current-user.ts` resolves the session if present, otherwise falls back to the seeded demo user so the public hero still works.
  - Deferred: hard-redirect on `/` to `/login` when no session — keeping the hero public for first-visit demos. Authenticated-only gating moves to the lists/settings/admin items.
- [ ] **GitHub Actions CI** — `.github/workflows/ci.yml` running `pnpm install --frozen-lockfile`, `pnpm db:generate`, `pnpm -r typecheck`, `pnpm --filter @ikan/web build` on every PR. Block merge on failure.
- [ ] **`/api/health` route** — returns `{ ok, version, db, redis, ai }` with shallow probes. Vercel cron pings every 5m.
- [ ] **Error boundaries** — `app/error.tsx`, `app/not-found.tsx`, `app/(app)/error.tsx`. Premium-styled (matches design system) with retry CTAs.
- [ ] **Rate limits on `/api/chat`** — per-user (and per-IP for unauth) using `@upstash/ratelimit` + Upstash Redis. 60 msgs/hour default. Surface remaining count in response headers.
- [ ] **Structured logging** — replace stray `console.log` with a tiny `lib/log.ts` wrapper (JSON lines for production; pretty for dev). Add request-id propagation.

### Chat & Agent Power-Ups

- [ ] **Thread sidebar in left rail** — show user's recent threads, click to open at `/c/t/[threadId]`. Renaming, deletion (soft tombstone). Empty state.
- [ ] **Outreach brief — real implementation** — replace stub in `packages/agent/src/tools/misc.ts:generateOutreachBriefTool` with a real NIM call using `OUTREACH_BRIEF_PROMPT`. Stream the result as canvas events. Modal on the company page calls it directly.
- [ ] **Citation source pane** — clicking a `[N]` pill opens a right-rail drawer with the source's URL, snippet, fetched-at, and trust tier. Animate in from the right with the same spring.
- [ ] **Better query understanding** — call `QUERY_UNDERSTANDING_PROMPT` before the agent loop; surface the parsed intent as a small chip above the first response ("interpreted: persons · hr · bengaluru").
- [ ] **Tool: `search_offices`** — given a city + filters, list companies with an office there. Useful for "who has a Bangalore office?"
- [ ] **Tool: `compare_companies`** — side-by-side facts for 2-3 companies.

### Canvas & UX

- [ ] **Company page** `/c/[slug]` — tabs (Overview, Offices, People, Signals, Contacts, Sources, Notes), AI summary up top, sticky right rail "Why this account?" 3-bullet card. Reuse canvas components.
- [ ] **Person page** `/p/[slug]` — tabs (Profile, Employment, Contacts, Signals, Notes). LinkedIn link, copy-handles.
- [ ] **Signals feed** `/signals` — filter chips (kind, since, india_only, watchlist_only). Infinite scroll. Click row → right inspector.
- [ ] **Lists pages** `/lists`, `/lists/[id]` — table with column toggles (name, role, location, email status, phone status, last refreshed). Bulk actions (export CSV, add note, mark DNC).
- [ ] **Command palette (⌘K)** — full-bleed overlay. Search threads, companies, persons, lists, actions. `Cmd+Enter` opens in right inspector.
- [ ] **Right inspector panel** — sliding-from-right preview for entities. Triggered by `Cmd+Enter` on results, `Cmd+Click` on rows.
- [ ] **Mobile responsive** — hero stacks; canvas collapses to a bottom sheet. Threads read-only on mobile <640px.

### Real Data Pipeline

- [ ] **Wire `news-rss` adapter to seed signals** — on first dev boot (or admin button), pull India RSS feeds, NIM-extract signals, persist with `signal.confidence`, surface in `/signals`. 50+ real signals visible.
- [ ] **Wire `serpapi-linkedin` end-to-end** — `linkedin_lookup` tool calls the adapter live (cached 7d). Resolve hits to persons via fuzzy `(name, company)` match → upsert `linkedin_observations`. Display in person page.
- [ ] **`scrape:company-site` job** — implement real adapter (currently stubbed); enqueue from `refresh_entity` tool; persist sources + NIM-extracted facts.
- [ ] **`scrape:github-org` job** — pull org members for tech companies, extract commit author emails as `contact_candidates` with `inferredMethod = GITHUB_COMMIT`.
- [ ] **Contact engine layers 1, 2, 3** — `direct-match`, `cross-source`, `github-commit` modules in `packages/contacts/src/layers/`. Wire to `discoverContactsForPerson()`.
- [ ] **Embeddings job** — `embed:entities` worker that NIM-embeds company/person `(name + description)` and writes to pgvector. Use in search.

### Polish & Brand

- [ ] **Logo** — design + export an SVG mark and wordmark. `<Logo>` component in `components/shell/`.
- [ ] **Favicon** + manifest.json + apple-touch-icon. PWA-ready.
- [ ] **Animated example queries** — rotate through 6-8 prompt suggestions on the hero, fade transition every 5s.
- [ ] **Loading skeletons** — match the final layout per-screen (no spinners on data surfaces).
- [ ] **Empty states** — opinionated copy per page ("No people found for Mercedes-Benz India yet. {Run discovery}").
- [ ] **Provenance popover** — hover any fact → tiny popover with tool name + source URL + fetched-at + confidence.
- [ ] **Status strip animations** — token-usage bar smoothly fills as the chat streams; live IST clock; "agent thinking" pulse dot.

### Docs & Trust

- [ ] **`/privacy` page** — clear, professional, India-DPDP-aware. Data subject request form.
- [ ] **`/api/dsr/delete` endpoint** — tombstone person, remove contact_points, audit-log entry.
- [ ] **`/admin/ingestion`** — list `enrichment_jobs` rows, retry failed, manual trigger by entity. Auth-gated to role=ADMIN.
- [ ] **`/admin/sources`** — last-fetched-at per source kind, error counts, manual refresh.
- [ ] **`/admin/dnc`** — DNC list CRUD.
- [ ] **`docs/architecture.md`** — diagram + component-by-component explainer.
- [ ] **`docs/compliance.md`** — DPDP posture, GDPR posture, scraping ethics, no-SMTP pledge.

### Ideas surfaced during work
(Loop appends new ideas here.)

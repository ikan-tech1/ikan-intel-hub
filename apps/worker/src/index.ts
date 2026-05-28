/**
 * Worker — processes jobs enqueued by the web app.
 *
 * Queues (Phase 2 wire-up):
 *   - scrape:*       (per adapter: company-site, news-rss, careers, github, …)
 *   - extract:ai     (Llama 3.1 8B JSON extraction)
 *   - classify:signals
 *   - enrich:contacts (runs @ikan/contacts discovery engine)
 *   - embed:entities  (NIM nv-embedqa-e5 → pgvector)
 *   - dedupe
 *   - linkedin:resolve
 *
 * MVP: structural stub. The web app currently runs tool handlers in-process
 * via @ikan/agent. Workers come online when we wire BullMQ + Fly.io.
 */

import { Worker, type Job } from 'bullmq';
import IORedis from 'ioredis';

const redisUrl =
  process.env.UPSTASH_REDIS_URL ?? process.env.REDIS_URL ?? 'redis://localhost:6379';
const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });

const handle = async (job: Job): Promise<void> => {
  // eslint-disable-next-line no-console
  console.log(`[worker] ${job.queueName}:${job.name} id=${job.id}`);
};

// Boot a stub worker on a single queue so the process stays alive.
// ConnectionOptions in BullMQ accepts a connection instance or a config object;
// we hand it the instance via the documented `connection` field.
new Worker('ikan:scrape', handle, { connection: connection as never });

// eslint-disable-next-line no-console
console.log('✓ worker booted (stub; full pipeline lands in Phase 2)');

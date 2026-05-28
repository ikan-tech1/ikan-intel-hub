import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: { bodySizeLimit: '2mb' },
  },
  // Trace workspace package files at build time so Vercel includes them.
  outputFileTracingRoot: resolve(__dirname, '../../'),
  // Workspace packages we transpile rather than bundling pre-built.
  transpilePackages: [
    '@ikan/shared',
    '@ikan/db',
    '@ikan/ai',
    '@ikan/agent',
    '@ikan/scrapers',
    '@ikan/contacts',
    '@ikan/search',
  ],
  // Don't fail the production build on lint/type errors during MVP — we run
  // strict typecheck + lint separately in CI.
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'logo.clearbit.com' },
      { protocol: 'https', hostname: 'media.licdn.com' },
    ],
  },
  // The workspace TS sources use ESM-style `.js` import extensions (required
  // by verbatimModuleSyntax). Tell webpack to resolve those back to .ts/.tsx.
  webpack: (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.extensionAlias = {
      ...(config.resolve.extensionAlias ?? {}),
      '.js': ['.ts', '.tsx', '.js'],
      '.mjs': ['.mts', '.mjs'],
    };
    return config;
  },
};
export default nextConfig;

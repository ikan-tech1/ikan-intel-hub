import { defineConfig } from 'wxt';

/**
 * Ikan Hub Chrome extension — operates in the user's own authenticated
 * LinkedIn session. When the user visits a LinkedIn profile or company page,
 * the content script parses the rendered DOM and POSTs structured data to
 * the Hub via /api/extension/ingest.
 *
 * Key design constraints:
 *  - No automated navigation. We only act on pages the user opened.
 *  - Per-page-view rate limit (1 ingest/60s) to avoid looking like a crawler.
 *  - The user sees what fields will be sent before each ingest.
 */
export default defineConfig({
  manifest: {
    name: 'Ikan Hub',
    description: 'Save LinkedIn intel to your Ikan Intel Hub',
    permissions: ['storage', 'activeTab'],
    host_permissions: ['https://www.linkedin.com/*'],
    action: { default_popup: 'popup.html', default_title: 'Ikan Hub' },
  },
  modules: ['@wxt-dev/auto-icons'],
});

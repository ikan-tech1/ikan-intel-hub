/**
 * Content script — runs on LinkedIn pages (profile, company, search results).
 *
 * Each page kind has its own parser. The parser reads structured DOM nodes
 * and emits a normalized payload that matches the `ExtensionIngestPayload`
 * zod schema in @ikan/shared/schemas.
 *
 * On parse success, we annotate the page with a small Ikan badge in the
 * top-right that reveals the parsed preview + "Save to Hub" button.
 */

export default {
  matches: ['https://www.linkedin.com/in/*', 'https://www.linkedin.com/company/*'],
  main() {
    const url = window.location.href;
    if (url.includes('/in/')) {
      // Profile page — Phase 2: implement parser
      console.info('[Ikan] LinkedIn profile detected — parser pending Phase 2');
    } else if (url.includes('/company/')) {
      // Company page — Phase 2
      console.info('[Ikan] LinkedIn company detected — parser pending Phase 2');
    }
  },
};

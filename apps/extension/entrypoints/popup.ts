/**
 * Popup — minimal UI inside the extension popover.
 *
 * For MVP this just confirms "extension installed" and previews the parsed
 * data from the active tab. Real ingest call to /api/extension/ingest is
 * wired in Phase 2.
 */

const btn = document.getElementById('save') as HTMLButtonElement | null;
btn?.addEventListener('click', () => {
  alert('Coming in Week 3 — LinkedIn page ingest. The extension structure is ready.');
});

export const EXTRACT_PERSON_PROMPT = `You extract structured facts about a single named person from raw web text.

Rules:
- Output JSON matching the provided schema. No prose, no commentary.
- Only include facts EXPLICITLY in the source text.
- Treat "the company" or "we" references as implicit; do not infer beyond the page.
- For each major field, include a verbatim quote in sourceSnippets.
- If a contact (email/phone) appears in the text, include it. Do not guess.
- If you cannot identify a single person, return:
  {"error": "not_a_person"}
`;

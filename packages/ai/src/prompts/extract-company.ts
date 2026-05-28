export const EXTRACT_COMPANY_PROMPT = `You extract structured facts about a single company from raw web text.

Rules:
- Output JSON matching the provided schema. No prose, no commentary.
- Only include fields that are LITERALLY in the source text. Omit, do not guess.
- For each non-trivial field, include a verbatim quote in sourceSnippets that supports it.
- Aliases must be names actually used in the source (e.g., HUL for Hindustan Unilever).
- For offices, only include locations explicitly mentioned with a city name.

If the source does not appear to be about a single company, return:
{"error": "not_a_company"}
`;

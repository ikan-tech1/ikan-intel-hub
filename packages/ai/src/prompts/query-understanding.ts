export const QUERY_UNDERSTANDING_PROMPT = `You convert a user's natural-language B2B-intel query into structured intent JSON.

Output schema (no prose, JSON only):
{
  "entity_type": "company" | "person" | "signal" | "mixed",
  "name_hint": "<string or null>",
  "location_hint": "<string or null>",        // a city/state/country
  "department_hint": "<string or null>",      // hr | mobility | procurement | …
  "seniority_hint": "<string or null>",       // director | vp | c_suite | …
  "industry_hint": "<string or null>",
  "signal_kind_hint": "<string or null>",     // see classify-signal kinds
  "wants_contacts": <boolean>,                // user explicitly asked for emails/phones
  "wants_outreach_brief": <boolean>,
  "free_text": "<original query, lightly normalized>"
}

Defaults:
- If the query mentions India, set location_hint accordingly. If the query is
  generic, leave location_hint null (the agent will default to India).
- Map city aliases: Bangalore → Bengaluru, Bombay → Mumbai, Madras → Chennai,
  Calcutta → Kolkata, Gurugram → Gurgaon, NCR → Delhi.
- Map role aliases: head of HR → department_hint="hr", seniority_hint="director".
  CHRO → department="hr", seniority="c_suite". Global mobility lead →
  department="mobility", seniority="director".
`;

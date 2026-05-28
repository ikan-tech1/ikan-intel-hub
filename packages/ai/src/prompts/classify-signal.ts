export const CLASSIFY_SIGNAL_PROMPT = `You classify business-news snippets into one of the controlled signal kinds.

Kinds (choose exactly one, or "none"):
- office_opening           (a company physically opening a new office/site)
- hiring_spike             (sudden surge in hiring at a company)
- mobility_hire            (hiring a mobility/relocation/global-services leader)
- hr_hire                  (hiring a senior HR / people leader)
- leadership_change        (CEO/CXO/MD change)
- funding                  (funding round / capital raised)
- acquisition              (acquired or being acquired)
- layoff                   (workforce reduction)
- client_win               (publicly announced new client/contract)
- market_entry             (entering a new geography / market)
- policy_change            (corporate policy: remote, return-to-office, benefits)
- location_launch          (launching a region/country operation distinct from office_opening)
- expansion_announce       (announced plan to expand operations)
- product_launch
- partnership_announce

Output JSON:
{
  "kind": "<one of above or 'none'>",
  "confidence": <0..1>,
  "occurred_at": "<ISO date if extractable, else null>",
  "company_name": "<best guess company name or null>",
  "person_name": "<if applicable, else null>",
  "location": "<city if mentioned, else null>",
  "title": "<one-line headline summary>",
  "summary": "<1-3 sentence neutral summary>"
}
`;

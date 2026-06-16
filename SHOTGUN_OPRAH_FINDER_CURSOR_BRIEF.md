# Shotgun Oprah Finder — Cursor Build Brief

> **REPEAT UNTIL OPRAH OR FAILURE**

A minimalist, black-background/white-lettering web game and benchmark where multiple LLM agents race through Wikipedia links to reach the **Oprah Winfrey** page from the same random starting page. The game is scored golf-style: lowest click count wins.

This document is a product/design/dev handoff for Cursor or another coding agent. It should guide implementation without over-constraining exact stack choices. Prefer simple, testable, modular pieces that can be iterated quickly.

---

## 1. Backstory / Origin

This came out of a conversational game: start on a random Wikipedia page and try to reach **Oprah Winfrey** in seven clicks or fewer.

Rules from the original game:

- Pick a random Wikipedia page.
- Choose one visible internal Wikipedia link from the current page.
- No backtracking.
- No inventing links.
- Once a link is chosen, commit to that page.
- Repeat until reaching **Oprah Winfrey** or exceeding the click quota.
- Under 8 clicks is “par.”

The first manual runs exposed a useful strategy: from almost any page, escape toward a broad hub, then route through media/television/talk-show pages.

Example funnel:

```text
Random page
→ Country / Person / Media / Television hub
→ Television
→ Talk show
→ Oprah Winfrey
```

That led to the bigger idea: turn it into an LLM benchmark and spectator race.

The site should feel stark, strange, and funny: like an AI benchmark, hacker toy, and cursed Wikipedia sport at the same time.

Core slogan:

```text
REPEAT UNTIL OPRAH OR FAILURE
```

---

## 2. Product Concept

**Shotgun Oprah Finder** is a web app where users can pit 1–10 LLMs or bots against each other on the same Wikipedia start page.

Each model receives:

- the goal: reach `Oprah Winfrey`
- the current Wikipedia page title
- a short summary/lead for that page
- the list of valid clickable links from that page
- the path of previously visited pages
- clicks used and clicks remaining
- race rules
- an editable race-host prompt

Each model must return exactly one link from the provided list, plus a short public reasoning note. The engine validates the chosen link, navigates there, and repeats.

The result is a ranked race table showing which model reached Oprah in the fewest clicks, how fast they responded, where they went, and how they reasoned.

---

## 3. Product Goals

Build a web app that can:

1. Start a race from a shared random Wikipedia page.
2. Run one or more LLM agents against that page.
3. Force agents to choose only from real visible Wikipedia links.
4. Prevent backtracking and repeated pages.
5. Display each agent’s route live.
6. Display each agent’s public scratchpad/reasoning note per turn.
7. Support editable host prompts to test prompt strategies.
8. Support multiple providers/models through pluggable adapters.
9. Support user-supplied API keys without exposing keys publicly.
10. Produce a leaderboard-style result with click counts and failures.

---

## 4. Non-Goals for MVP

Avoid overbuilding the first version.

Not required for MVP:

- Perfect Wikipedia graph optimization.
- Complex account system.
- Global public leaderboard.
- Payment system.
- Fine-grained analytics dashboard.
- Training/evaluating custom models.
- Full browser automation.
- Hidden chain-of-thought capture.

The MVP should prove the core loop:

```text
same start page
→ same valid link list
→ multiple agents choose links
→ engine validates
→ paths appear live
→ first/lowest-click Oprah route wins
```

---

## 5. Visual Direction

Minimalist black site with white lettering.

Style references:

- terminal
- hacker leaderboard
- plain monospace benchmark dashboard
- no gradients
- no glossy AI branding
- no unnecessary animation
- sharp typography
- dead-simple race columns

Homepage concept:

```text
SHOTGUN OPRAH FINDER

REPEAT UNTIL OPRAH OR FAILURE

A benchmark for evaluating LLM reasoning through constrained
navigation of the Wikipedia graph.

[ RUN RACE ]
```

Possible UI vibe:

```text
SEED #18472
START PAGE: Polydesmida
TARGET: Oprah Winfrey
MAX CLICKS: 8

GPT-5.5                 CLAUDE                  GEMINI
────────────────        ────────────────        ────────────────
Polydesmida             Polydesmida             Polydesmida
↓                       ↓                       ↓
Millipede               Arthropod               Forest
↓                       ↓                       ↓
Biology                 Zoology                 Slovenia
↓
Television
↓
Talk show
↓
OPRAH WINFREY

GPT-5.5: SUCCESS, 5 CLICKS
```

---

## 6. Core Game Rules

Default rules:

- Target page: `Oprah Winfrey`
- Start page: random English Wikipedia article.
- Max clicks: default 8, configurable.
- A click is one transition from current page to a chosen valid link.
- Agent must choose exactly one link from `available_links`.
- No repeated pages.
- No backtracking.
- No external browsing by the model.
- Model can only use the page data supplied by the app.
- Invalid link choices receive a penalty or retry, depending on race settings.
- First model to reach Oprah wins in live mode.
- Lowest click count wins in tournament scoring.

Target matching should handle canonical Wikipedia titles, redirects, and normalized forms. For example, reaching `/wiki/Oprah_Winfrey` is success.

---

## 7. Race Modes

### 7.1 Wait Mode / Turn-Based Tournament

This is the scientific benchmark mode.

All agents take turn 1, then all agents take turn 2, and so on. If one agent reaches Oprah, it records success, but the others continue until they also succeed or fail.

Why this matters:

- Fair comparison.
- Same start page.
- Same quota.
- Easier replay/debugging.
- Better for prompt/model evaluation.

Example:

```text
Turn 1:
  GPT chooses Television
  Claude chooses United States
  Gemini chooses Culture

Turn 2:
  GPT chooses Talk show
  Claude chooses Television
  Gemini chooses Mass media
```

Final ranking is golf-style by click count.

### 7.2 Race Mode / Live Mode

This is the spectator mode.

All agents start simultaneously and proceed as fast as their API responses return. The first one to reach Oprah gets a visual win, but all runs can continue for scoring.

Why this matters:

- Fun to watch.
- Shows latency differences.
- Feels like a live race.
- Less scientifically pure because API speed affects results.

Race Mode should still record click count separately from elapsed time.

Suggested result labels:

```text
FASTEST TO OPRAH: GPT-5.5, 11.2s
LOWEST CLICKS: Claude, 4 clicks
BEST OVERALL: configurable
```

### 7.3 Solo Mode

One model or one deterministic bot runs alone.

Useful for:

- debugging
- demoing
- testing prompt changes
- testing provider adapters

### 7.4 Prompt Tournament Mode

Same model, different prompts.

This may be as interesting as model-vs-model racing.

Example:

```text
GPT-5.5 + Country Funnel Prompt
vs
GPT-5.5 + Media Funnel Prompt
vs
GPT-5.5 + Bloodhound Prompt
```

---

## 8. Agents / Competitors

A competitor can be:

1. An LLM model using a provider API.
2. A deterministic heuristic bot.
3. A local/custom model through an OpenAI-compatible endpoint.

The deterministic baseline bot is important. It gives the LLMs something dumb but strong to beat.

Suggested baseline name:

```text
ShotgunBot
```

ShotgunBot ranking heuristic:

```text
Direct Oprah links
> Oprah-adjacent pages: Talk show, The Oprah Winfrey Show, Harpo Productions, OWN
> media hubs: Television, Television show, Film, Actor, Producer, Mass media
> biography hubs: Person, Celebrity, Journalist, Author, Presenter
> geography hubs: United States, Chicago, Mississippi, Tennessee, Illinois
> institutions: ABC, CBS, CNN, Time, Forbes, Academy Awards, Emmy Awards
> fallback: country → United States → Television → Talk show
```

The bot does not need to be perfect. It should be explainable and reliable.

---

## 9. The “Oprah Gravity Well” Strategy

The app can include built-in prompt presets based on suspected strong paths.

### 9.1 Media Funnel

```text
Anything
→ Television / Media / Film / Actor
→ Television
→ Talk show
→ Oprah Winfrey
```

### 9.2 Country Funnel

```text
Anything
→ Country
→ United States
→ Television
→ Talk show
→ Oprah Winfrey
```

This is not always optimal, but it is safe and often works.

### 9.3 Person Graph Funnel

```text
Anything
→ Person
→ Actor / Host / Journalist / Author / Producer
→ Television
→ Talk show
→ Oprah Winfrey
```

This may be stronger than the country funnel because Wikipedia is heavily biographical.

### 9.4 Institution Funnel

```text
Anything
→ University / Company / Newspaper / Award / Network
→ Media / Television / United States
→ Talk show
→ Oprah Winfrey
```

---

## 10. Host Prompt Editor

The race host should be able to edit the global prompt used by all selected models.

This is one of the most important features because it turns the app into a prompt benchmark, not just a model benchmark.

Host controls:

- prompt text area
- save prompt preset
- load prompt preset
- temperature
- max tokens
- reasoning style: terse / normal / dramatic / minimal
- max clicks
- number of random starts
- selected models
- race mode: wait/live
- include page summary: yes/no
- include all links vs filtered links
- allow categories: yes/no
- allow disambiguation pages: yes/no

Example host prompt:

```text
Play aggressively. Your goal is to reach Oprah Winfrey as quickly as possible.
Prefer links that move toward media, television, celebrities, American culture,
talk shows, actors, producers, journalists, and high-connectivity hubs.
Avoid narrow local dead ends unless they are the only escape route.
```

More flavorful preset:

```text
You are a bloodhound trained to find Oprah. Smell for television, celebrities,
American media, talk shows, actors, producers, Chicago, and mass culture.
Choose the link that most increases the probability of reaching Oprah quickly.
```

---

## 11. Agent Prompt Shape

Each model should receive a structured prompt packet.

Recommended inputs:

```json
{
  "goal": "Reach the Wikipedia page 'Oprah Winfrey'.",
  "rules": [
    "Choose exactly one link from available_links.",
    "No backtracking.",
    "Do not choose a page already in visited_pages.",
    "Do not invent links.",
    "No external browsing.",
    "Return strict JSON only."
  ],
  "clicks_used": 3,
  "clicks_remaining": 5,
  "visited_pages": [
    "Kfar Haruv",
    "Golan Heights",
    "Israel",
    "United States"
  ],
  "current_page": {
    "title": "United States",
    "summary": "The United States is a country primarily located in North America...",
    "available_links": [
      "Television",
      "Hollywood",
      "Chicago",
      "American culture",
      "Mass media in the United States"
    ]
  },
  "host_prompt": "Play aggressively. Prefer media, celebrity, television, and talk-show hubs."
}
```

Recommended model output:

```json
{
  "chosen_link": "Television",
  "public_scratchpad": "United States is a broad hub, but Television is more directly connected to talk shows and Oprah.",
  "confidence": 0.86
}
```

The app should validate that `chosen_link` exactly matches an item from `available_links`, after normalization.

---

## 12. Public Scratchpad

Each bot should have a visible public scratchpad/log. This is not meant to expose private chain-of-thought. It is a short user-facing navigation rationale.

Good scratchpad style:

```text
Need to escape taxonomy. Looking for broad hubs: media, country, person, television. Biology is broader than this species page, so I am taking Biology.
```

Bad scratchpad style:

```text
I will now produce an exhaustive hidden reasoning trace...
```

The prompt should ask for concise public reasoning, not hidden/internal reasoning.

Suggested label in UI:

```text
NAVIGATOR LOG
```

or

```text
PUBLIC SCRATCHPAD
```

---

## 13. Wikipedia Engine

Use the MediaWiki API or a reliable Wikipedia parsing library. The engine, not the model, should fetch pages and extract valid links.

Core responsibilities:

1. Get a random English Wikipedia article.
2. Fetch page title, canonical URL, page ID, lead summary, and internal links.
3. Normalize titles.
4. Filter invalid namespaces unless settings allow them.
5. Follow redirects.
6. Validate each chosen link.
7. Detect repeated pages.
8. Detect success when canonical title is `Oprah Winfrey`.
9. Cache pages to reduce repeated API calls.

Default link filtering:

- Include main namespace article links.
- Exclude red links.
- Exclude files/images.
- Exclude help pages.
- Exclude templates.
- Exclude categories by default, but allow a toggle.
- Exclude language links.
- Exclude edit links.
- Consider excluding citation-only links if using rendered HTML parsing.

Important: the model should only be allowed to pick from the app-supplied list. This prevents hallucinated navigation.

---

## 14. Reproducibility and Seeds

Wikipedia `Special:Random` is not deterministic by itself. For reproducible races, store the actual random start page selected for each race.

Use a `race_seed` as an app-level identifier, not necessarily as a deterministic Wikipedia seed unless implemented separately.

Recommended approach:

```text
Race seed #18472
→ stored start page: Polydesmida
→ all agents use Polydesmida
→ replay uses stored page title/page ID
```

Optional later improvement:

- Maintain a local sampled pool of random article page IDs.
- Use deterministic PRNG selection from that pool.
- This allows exact seed-to-start-page reproducibility.

---

## 15. Scoring

Primary score:

```text
Clicks to Oprah
```

Lower is better.

Default par:

```text
8 clicks
```

Result states:

```text
SUCCESS
DNF_MAX_CLICKS
DNF_INVALID_LINK
DNF_REPEAT_PAGE
DNF_TIMEOUT
DNF_PROVIDER_ERROR
```

Recommended ranking:

1. Success before failure.
2. Fewest clicks.
3. Fewest invalid attempts.
4. Lowest elapsed time.
5. Shortest average response time.

Tournament metrics:

- win rate
- average clicks on successful runs
- median clicks
- worst successful run
- DNF rate
- invalid-choice rate
- average latency
- average reasoning length

Golf-style display:

```text
Par: 8
4 clicks: -4
6 clicks: -2
8 clicks: E
DNF: +∞
```

---

## 16. API Provider Flexibility

Design provider integrations as adapters.

A provider adapter should expose a common interface:

```ts
type AgentRequest = {
  model: string;
  systemPrompt: string;
  hostPrompt: string;
  gameState: GameState;
  temperature?: number;
  maxTokens?: number;
};

type AgentResponse = {
  chosenLink: string;
  publicScratchpad: string;
  confidence?: number;
  raw?: unknown;
};

interface LLMProviderAdapter {
  id: string;
  displayName: string;
  callAgent(request: AgentRequest, credentials: ProviderCredentials): Promise<AgentResponse>;
}
```

Initial providers to consider:

- OpenAI
- Anthropic
- Google Gemini
- xAI / Grok
- OpenRouter
- local OpenAI-compatible endpoint

Avoid hard-coding provider-specific assumptions into the race engine.

Provider config should include:

- provider name
- base URL if applicable
- model ID
- API key reference
- temperature
- max output tokens
- JSON mode support
- timeout
- retry count

---

## 17. User-Owned API Keys and Security

This part needs careful design.

The user idea: users create an account, paste their own API keys, the system encrypts them so the site owner cannot decrypt them, and then the app uses those keys for LLM calls.

Important constraint:

> If the backend must call LLM providers using a saved key while the user is not actively present, then the backend needs access to the plaintext key or to a decryptable form of it. That is not zero-knowledge.

To make “the site owner cannot decrypt it” true, use one of these designs.

### Option A — MVP: Local-Only Keys

- User pastes keys into the browser.
- Keys are stored only in memory or encrypted browser storage.
- API calls are made from the browser when possible.
- No backend storage of keys.
- Simplest privacy story.

Tradeoff: some LLM provider APIs may not support browser-side calls due to CORS or security restrictions.

### Option B — Zero-Knowledge Encrypted Key Vault

- User logs in.
- User enters a passphrase or uses a local secret.
- Browser derives an encryption key using WebCrypto.
- Browser encrypts provider API keys before upload.
- Server stores only ciphertext.
- Site owner cannot decrypt stored keys.
- When user starts a race, browser decrypts keys locally.

Then either:

1. Browser calls providers directly, if supported.
2. Browser sends decrypted key to a backend relay only for that active request.

Caveat: if a backend relay receives plaintext keys during a request, the server process technically sees the key transiently. This is not pure zero-knowledge at execution time, though it can still avoid persistent key storage.

### Option C — Server-Side Encrypted Vault

- Server encrypts keys using KMS or environment secrets.
- Convenient and practical.
- Backend can call providers easily.
- But the operator/backend can decrypt or misuse keys if compromised.

This is not compatible with “I can’t decrypt it myself,” but may be acceptable for trusted private deployments.

### Recommended Path

For early versions:

1. Start with unsaved session keys or local-only encrypted browser storage.
2. Add optional account login later.
3. Add zero-knowledge vault if users actually need cross-device saved keys.
4. Make the security model explicit in UI.

Key security basics:

- Never commit keys.
- Never log keys.
- Redact Authorization headers.
- Redact provider payloads if they may contain keys.
- Let users delete keys.
- Keep keys scoped by provider.
- Prefer per-user BYOK over shared project keys.

---

## 18. Hosting / Architecture Options

### Option 1 — Simple MVP

Best for fastest iteration.

```text
Vite/React frontend
+ small Node/Express or FastAPI backend
+ local SQLite
+ provider adapters
+ Wikipedia API module
```

Run locally first. Deploy later.

### Option 2 — GitHub Pages + Serverless Backend

Good fit for the user’s GitHub hosting idea.

```text
GitHub Pages / static frontend
+ Cloudflare Worker / Vercel / Netlify function backend
+ Supabase / D1 / Neon / SQLite-compatible store
```

Use this if the frontend is static but provider calls, auth, or race persistence need a server.

### Option 3 — Full-Stack App

Good once the concept is validated.

```text
Next.js / Remix / SvelteKit
+ server routes
+ database
+ auth
+ provider adapters
+ race replay storage
```

This is cleaner for accounts and saved races, but heavier than needed for the first demo.

---

## 19. Suggested Project Structure

Keep the race logic independent from the UI.

```text
shotgun-oprah-finder/
  apps/
    web/
      src/
        pages-or-routes/
        components/
        styles/
        state/
    api/
      src/
        routes/
        auth/
        vault/
  packages/
    race-engine/
      src/
        runRace.ts
        runTurn.ts
        scoring.ts
        types.ts
    wikipedia/
      src/
        fetchPage.ts
        getRandomPage.ts
        extractLinks.ts
        normalizeTitle.ts
    providers/
      src/
        openai.ts
        anthropic.ts
        google.ts
        xai.ts
        openrouter.ts
        localOpenAICompatible.ts
        types.ts
    shared/
      src/
        schemas.ts
        constants.ts
```

---

## 20. Core Data Model

Approximate entities:

```text
User
  id
  email/login provider
  created_at

ProviderConnection
  id
  user_id
  provider
  encrypted_api_key_or_local_reference
  display_name
  created_at

ModelConfig
  id
  provider
  model_id
  temperature
  max_tokens
  timeout_ms
  enabled

Race
  id
  seed_label
  start_page_title
  target_page_title
  max_clicks
  mode
  host_prompt
  status
  created_at

RacerRun
  id
  race_id
  competitor_name
  provider
  model_id
  status
  clicks
  elapsed_ms
  invalid_attempts

Turn
  id
  racer_run_id
  turn_index
  current_page_title
  chosen_link
  resulting_page_title
  public_scratchpad
  confidence
  latency_ms
  validation_status
  raw_response_reference

WikiPageCache
  title
  page_id
  canonical_title
  summary
  links_json
  fetched_at
```

---

## 21. Race Engine Loop

High-level flow:

```text
create race
fetch start page
for each competitor:
  initialize run at start page

while race not complete:
  for each active competitor:
    build prompt packet
    call model or bot
    parse JSON
    validate chosen link
    reject invalid/repeated choices according to settings
    fetch resulting page
    append turn
    check success/failure
  update UI
```

In live mode, active competitors can advance independently instead of waiting for turn barriers.

Important validation steps:

1. Is output valid JSON?
2. Does `chosen_link` exist in `available_links`?
3. Has chosen page already been visited by this competitor?
4. Does the chosen page resolve to target?
5. Is max click quota exceeded?

---

## 22. UI Screens

### 22.1 Landing Page

Purpose: vibe and entry.

Content:

```text
SHOTGUN OPRAH FINDER
REPEAT UNTIL OPRAH OR FAILURE
[RUN RACE]
[CONFIGURE MODELS]
[VIEW RECENT RACES]
```

### 22.2 Race Setup

Fields:

- race mode: wait/live/solo/prompt tournament
- target page: default Oprah Winfrey
- max clicks: default 8
- number of random starts: 1, 10, 100
- selected models/bots
- host prompt
- prompt preset
- temperature
- include summaries toggle
- allowed link types
- key configuration status

### 22.3 Live Race Dashboard

Columns per competitor:

- model name
- status
- clicks used
- current page
- path
- latest chosen link
- navigator log
- latency
- success/failure label

### 22.4 Results Page

Show:

- winner
- click ranking
- elapsed time ranking
- each full path
- public scratchpad per turn
- invalid attempts
- DNF reasons
- shareable race URL
- replay button

---

## 23. Link List UX

For transparency, allow users to inspect what links each model could choose from at each turn.

Possible UI:

```text
Current page: United States
Available links shown to model: 1,248
Filtered visible list:
  - Television
  - Hollywood
  - Mass media in the United States
  - American culture
  - Chicago
  ...
Chosen: Television
```

For very large pages, the app may need to cap the number of links sent to the model. If so, make it explicit.

Possible approach:

- Always include high-value detected links.
- Include all links up to a safe token budget.
- If truncating, say so in prompt packet.
- Record the exact list shown to each model for fairness.

For strict benchmarking, all models in the same race should receive the same available link list for the same page.

---

## 24. JSON Robustness

LLMs may produce malformed output.

Implement:

- schema validation
- one optional repair/retry
- invalid-output penalty
- visible error state

Retry prompt example:

```text
Your previous response was invalid. Return only JSON matching this schema:
{
  "chosen_link": "exact title from available_links",
  "public_scratchpad": "short public reason",
  "confidence": 0.0
}
```

If still invalid, mark as failure or count an invalid attempt based on settings.

---

## 25. Prompt Presets

Include several presets for experimentation.

### Greedy Media Route

```text
Prioritize links that move toward television, media, talk shows, celebrities,
actors, producers, hosts, journalists, American entertainment, or Oprah-adjacent topics.
```

### Country Funnel

```text
If stuck, move toward countries, then toward the United States, then toward television,
then talk shows, then Oprah Winfrey.
```

### Person Graph

```text
Wikipedia is dense with biographies. Prefer notable people, occupations, actors,
writers, journalists, hosts, producers, and entertainers when they appear.
```

### Wikipedia Speedrunner

```text
Think like a Wikipedia speedrunner. Avoid narrow pages. Escape to high-degree hubs.
Take routes that increase global connectivity, not local relevance.
```

### Bloodhound

```text
You are a bloodhound trained to find Oprah. Smell for media, television, celebrity,
American culture, talk shows, Chicago, actors, producers, authors, and journalists.
```

### Minimal Reasoning

```text
Choose the best link. Keep the public scratchpad under 20 words.
```

---

## 26. Error Handling / Edge Cases

Handle:

- disambiguation pages
- redirects
- pages with very few links
- pages with huge link lists
- non-main namespace pages
- circular routes
- provider timeouts
- provider rate limits
- malformed JSON
- chosen link not in list
- chosen link differs by capitalization/underscore
- target page reached through redirect
- page fetch failure
- race cancellation

Keep failure messages entertaining but clear.

Possible labels:

```text
LOST IN SLOVENIA
INVALID LINK DETECTED
MAX CLICKS EXCEEDED
OPRAH NOT FOUND
REPEAT UNTIL FAILURE ACHIEVED
```

---

## 27. Analytics / Benchmarking

Once basic races work, add batch runs.

Batch benchmark:

```text
100 random starts
× selected models
× same prompt
× same max clicks
```

Metrics:

- success rate
- average clicks
- median clicks
- 90th percentile clicks
- DNF rate
- invalid link rate
- average response latency
- average tokens used
- cost estimate
- best path
- worst path
- most common hub pages

Interesting analysis:

- Does `Television` beat `United States` as a funnel?
- Does a person-first prompt outperform a country-first prompt?
- Does low temperature improve navigation?
- Do larger models hallucinate fewer links?
- Does including page summaries help or hurt?
- How often does the deterministic ShotgunBot beat LLMs?

---

## 28. Privacy and Storage

Store race records, but be cautious with provider payloads.

Safe to store:

- page titles
- selected links
- public scratchpad
- timings
- model names
- status
- scoring metrics

Potentially sensitive:

- raw provider responses
- user API key metadata
- host prompts if private
- user account info

Never store:

- plaintext API keys
- Authorization headers
- decrypted vault contents

For public/shared races, show model names and paths, not user secrets.

---

## 29. MVP Build Plan

### Phase 0 — Static Prototype

- Black/white landing page.
- Fake race dashboard with hardcoded paths.
- Establish visual tone.

### Phase 1 — Single-Agent Local Race

- Fetch random Wikipedia page.
- Extract links.
- Run one deterministic ShotgunBot.
- Display path.
- Detect Oprah/failure.

### Phase 2 — One LLM Adapter

- Add one provider adapter.
- Use user-supplied session key.
- Strict JSON response.
- Validate link choices.
- Show public scratchpad.

### Phase 3 — Multi-Agent Wait Mode

- Add multiple competitors.
- Same start page.
- Turn-based execution.
- Ranking table.

### Phase 4 — Live Race Mode

- Agents advance independently.
- Real-time updates.
- Fastest-to-Oprah display.
- Continue all runs to completion.

### Phase 5 — Accounts and Key Storage

- Add user login.
- Add local-only or zero-knowledge key vault.
- Add saved provider/model configs.

### Phase 6 — Benchmarks and Replays

- Batch race runs.
- Shareable result pages.
- Replay mode.
- Leaderboard.

---

## 30. Acceptance Criteria for First Useful Version

The first usable version should support:

- User opens site.
- User enters one API key or enables ShotgunBot.
- User starts a race.
- App selects a random Wikipedia article.
- App fetches real links from the page.
- Agent receives only valid links.
- Agent chooses one link.
- App validates and follows it.
- App repeats until Oprah or max clicks.
- App displays route and total clicks.

Minimum demo success:

```text
Random page
→ ...
→ Television
→ Talk show
→ Oprah Winfrey

SUCCESS: 6 clicks
```

---

## 31. Future Ideas

- Let users choose any target page, not just Oprah.
- “7 Clicks to X” custom races.
- Prompt-vs-prompt tournaments.
- Model-vs-human mode.
- Daily shared seed.
- Global leaderboard.
- Replay links.
- Route visualizer graph.
- Cost-per-success metric.
- Target packs: Oprah, Jesus, Taylor Swift, Napoleon, SpongeBob, United States.
- Chaos mode where prompts are intentionally weird.
- “Tattoo mode” landing page that only says `REPEAT UNTIL OPRAH OR FAILURE`.

---

## 32. Tone / Voice

The project should not feel like a corporate AI benchmark.

It should feel like:

- a weird internet sport
- a serious benchmark pretending not to be serious
- a terminal-based race arena
- a joke that accidentally became useful

Suggested copy snippets:

```text
Find Oprah. No backtracking. No mercy.
```

```text
The graph is dark and full of detours.
```

```text
Some models reason. Some models die in Slovenia.
```

```text
Par is 8. Glory is lower.
```

```text
Repeat until Oprah or failure.
```

---

## 33. Cursor Guidance

When building this, prioritize the core engine over polish.

Implementation priorities:

1. Make Wikipedia navigation real and verifiable.
2. Make link validation strict.
3. Make provider adapters modular.
4. Make race state observable and replayable.
5. Keep the UI stark and readable.
6. Avoid premature complexity in accounts/key storage.
7. Add security-sensitive features deliberately.

Do not let the model invent links. The entire benchmark depends on constrained choice from actual Wikipedia links.

The core value proposition is simple:

```text
Give every model the same page and the same links.
See who can smell Oprah fastest.
```


# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

The application is **not** at the workspace root — it lives in this directory (`Tkellem/`), which is also the git repo root (remote `github.com/mohamediazehaf-fr/Tkellem`, current branch `feature/add_home_link`). Run every command from `Tkellem/`.

```
Tkellem/
  server.js              # Express API-key proxy (134 lines) — the entire backend
  package.json           # express only; node >= 18
  public/
    index.html           # the entire frontend: HTML + CSS + JS inline (~2340 lines)
    index[1].html        # STALE earlier prototype — see Gotchas
    manifest.json        # PWA manifest
    icons/               # 180/192/512 png
  README.md              # step-by-step Render deployment walkthrough (French, non-technical)
```

## Commands

```powershell
npm install
$env:ANTHROPIC_API_KEY   = "sk-ant-..."
$env:ELEVENLABS_API_KEY  = "..."
node server.js            # or: npm start  → http://localhost:3000
```

There is **no build step, no bundler, no test suite, and no linter**. `npm start` is the only script. Verify changes by loading the app in a browser (Chrome recommended) — `localhost` counts as a secure context, so the microphone works without HTTPS.

Deployment is push-to-deploy: commit to GitHub → Render rebuilds (`npm install` / `node server.js`) with the two API keys set as environment variables. The free tier sleeps after 15 min of inactivity, so the first request after idling takes several seconds.

## Architecture

Two files carry the whole app, and the split between them is the key thing to understand:

**[server.js](server.js) exists only to keep API keys off the client.** It holds no state, no database, no session, no business logic — it serves `public/` statically and forwards four calls, injecting secrets from `process.env`:

| Endpoint | Forwards to | Notes |
|---|---|---|
| `POST /api/chat` | Anthropic Messages API | model hardcoded at [server.js:28](server.js#L28), `max_tokens: 1000`; body is `{system, messages}` passed through verbatim |
| `GET /api/voices` | ElevenLabs `/v1/voices` | returns `{voices: []}` when the key is unset, so the client can degrade |
| `POST /api/transcribe` | ElevenLabs speech-to-text | `{audio_base64, mime_type}` → `scribe_v2`, `language_code: 'ar'` → `{text}` |
| `POST /api/speak` | ElevenLabs text-to-speech | `{text, voice_id}` → `eleven_multilingual_v2` → raw `audio/mpeg` |

**Supabase is called directly from the browser and bypasses the Node server entirely** ([index.html:1106](public/index.html#L1106) holds the project URL and publishable key inline). Auth, progress sync, and avatar upload never touch `server.js`. So a request either goes through the proxy (Claude, ElevenLabs) or straight to Supabase — never both.

### The Claude contract: JSON smuggled through free text

There is no structured-output enforcement. [`buildSystemPrompt()`](public/index.html#L1975) instructs the model to emit *only* a JSON object (`darija_ar`, `darija_latin`, `french`, `feedback`, `feedback_phrase`), and [`callAvatarAPI()`](public/index.html#L1921) recovers it with `raw.match(/\{[\s\S]*\}/)` + `JSON.parse`. **Prompt and parser are coupled** — changing the response shape means editing both, and a malformed reply surfaces as a retry bubble ([`addErrorBubble`](public/index.html#L1961)) rather than a crash.

Four independent call sites hit `/api/chat`, each with its own ad-hoc prompt and its own parsing quirk — don't assume one shared helper:

- [`callAvatarAPI()`](public/index.html#L1921) — the role-play turn; the only one that sends `system` and the conversation `history`
- [hint button](public/index.html#L2008) — one-shot suggestion, strips ` ```json ` fences
- [`runTranslation()`](public/index.html#L2044) — FR→darija, deliberately **not** appended to `history`
- [`submitQuizAnswer()`](public/index.html#L2187) — uses Claude as a fuzzy grader for quiz answers

### Voice pipeline

Input: mic button → `MediaRecorder` (webm, 20 s auto-stop) → base64 → `/api/transcribe` → transcript fed into `handleUserInput()` ([setup](public/index.html#L1814)). A text field is always available as a fallback and is the only path when `MediaRecorder` is missing.

Output: [`speak()`](public/index.html#L1574) posts to `/api/speak` and plays the mp3 through **one reused `Audio` element** (`avatarAudio`) — that reuse plus `unlockAudioOnce()` is what defeats mobile autoplay blocking, so don't replace it with fresh `new Audio()` per utterance. The voice is fixed, never user-selectable: [`loadVoices()`](public/index.html#L1608) searches the account for a voice named "Ghizlane" (then any darija/moroccan match) at boot. If that fails, `speakBrowserFallback()` uses `SpeechSynthesis` — reading the Arabic text when an Arabic voice exists, otherwise the latin transliteration.

### Client state and persistence

`localStorage` is the working store; on login the Supabase `progress` row **overwrites** local values ([`syncFromServer`](public/index.html#L1204)), and first-ever login pushes guest progress up. `syncToServer()` upserts `{user_id, points, completed, display_name, avatar, avatar_url, updated_at}`. Avatar photos are resized to a 240 px square and uploaded to the storage bucket named `Avatar` at `{user_id}/avatar.jpg` ([here](public/index.html#L1293)).

Keys: `tkellem_points`, `tkellem_completed` (array of `phrasebook_*` / `scenario_*` / `quiz_perfect` ids), `tkellem_streak`, `tkellem_last_active`, `tkellem_badges_seen`, `tkellem_onboarding_done`, and `tkellem_history_<scenarioId>` (one saved transcript per scenario, which is why cards show a "resume" state).

When Supabase is reachable, [`applyAuthGate()`](public/index.html#L1160) forces the account screen until the user is signed in **and** has a `display_name`; when `window.supabase` failed to load, the whole gate is skipped and the app runs guest-only.

### Navigation

Single page, eight sibling `<div id="screen-*">` blocks toggled by [`showScreen()`](public/index.html#L1726) against `ALL_SCREENS` — no router, no history API. Adding a screen means adding the div, the id to `ALL_SCREENS`, and its back-button wiring.

## Token cost strategy

Claude is on the critical path for four features and nothing else in the app spends tokens (ElevenLabs and Supabase don't). Measured prompt weights, in characters, straight from the source:

| Piece | Chars | Sent |
|---|---|---|
| `buildSystemPrompt()` fixed JSON contract + pedagogy rules | 1 739 | every conversation turn |
| kids-mode extra rules | +710 | every turn when `mode:'kids'` |
| `persona` (per scenario) | 620–960 | every conversation turn |
| quiz grader prompt | 571 | per quiz answer (12 per run) |
| hint prompt | 322 | per hint click |

The system prompt is therefore ~2 400–2 700 chars (~3 100–3 400 in kids mode), **re-sent on every turn**, on top of a `history` that grows without bound — `callAvatarAPI()` ships the whole transcript each time. A 10-turn conversation lands around 15 k input tokens against ~1.5 k output, so **input is roughly two-thirds of the bill and almost all of it is the same bytes repeated**. That works out to a few cents per conversation, which matches what the README promises users.

Those token figures are extrapolated from character counts — French, arabizi and arabic script tokenize very differently, so confirm with `client.messages.count_tokens` (or `ant messages count-tokens`) before and after any change rather than trusting the estimate.

### Step 0 — make spend observable

Log `data.usage` in [server.js](server.js) after each `/api/chat` response: `input_tokens`, `output_tokens`, `cache_creation_input_tokens`, `cache_read_input_tokens`. Nothing below is verifiable without it, and `cache_read_input_tokens` stuck at 0 across turns is the one signal that caching is silently not working.

### Lever 1 — prompt caching (biggest win, no quality risk)

Add top-level `cache_control: {type: 'ephemeral'}` to the request body in [server.js](server.js). The API places the breakpoint on the last cacheable block, so system + all prior turns are cached and the next turn re-reads that prefix at ~0.1× instead of full price. Expect the input side of a long conversation to fall by roughly two-thirds. Verify with `cache_read_input_tokens`, not by assumption.

Three conditions this depends on — protect them:

- **Minimum cacheable prefix on `claude-sonnet-4-6` is 1024 tokens.** The system prompt alone probably sits just under it, so nothing caches for the first exchange or two and then it kicks in. This also means shortening the system prompt can push the prefix below the threshold and *disable* caching outright.
- **The prefix must be byte-identical between turns.** `buildSystemPrompt()` is deterministic today — keep it that way. Interpolating a date, the learner's name, a point total or anything per-request into the system prompt invalidates the cache on every turn and silently removes the whole saving.
- **5-minute TTL.** Normal turn cadence (record → transcribe → reply → listen) stays well inside it; a learner who walks away pays one fresh cache write.

Caching does nothing for the hint, translation and quiz calls — those prompts are ~150 tokens, far below any minimum. Don't expect savings there; use levers 3 and 4 instead.

### Lever 2 — effort

`effort` defaults to `high` on Sonnet 4.6. These four tasks are short-form generation and classification, which is exactly the shape Anthropic's guidance puts at `output_config: {effort: 'low'}` with `thinking: {type: 'disabled'}` — set both explicitly. Note thinking is already off (on Sonnet 4.6 an omitted `thinking` field means no thinking), so this is about verbosity and overall spend, not about disabling reasoning.

Start with the three utility calls where `low` is obviously safe. A/B `low` against `medium` for the role-play turn — that reply *is* the product, so it's the one place to measure quality rather than assume.

### Lever 3 — route cheap tasks to a cheaper model

Grading a one-word quiz answer and translating one sentence do not need Sonnet. `claude-haiku-4-5` is $1/$5 per Mtok against Sonnet's $3/$15 — ~3× cheaper on those paths — and it supports structured outputs (`output_config.format`), which would also remove the regex-and-retry JSON parsing there.

Implement this as a **server-side allowlist keyed by task**, never a model string from the client: `{task:'quiz'}` → `claude-haiku-4-5`, `{task:'chat'}` → `claude-sonnet-4-6`. A client-supplied `model` field lets anyone with the page open bill the account on the most expensive model available.

### Lever 4 — don't call Claude at all

- **Quiz**: normalize (lowercase, strip accents, tolerate `3`/`ع` and `7`/`ح`) and compare against `item.latin` / `item.ar` locally first. Exact and near-exact answers — the majority — resolve for free; only genuinely ambiguous ones reach the grader, turning 12 calls per run into 2–3.
- **Hint button**: memoize by `(scenario.id, last avatar turn)`. Two clicks on the same turn currently cost two calls.
- **Translation panel**: cache results in `localStorage`; learners retype the same handful of phrases.
- **A failed JSON parse costs a second full-price call** — `addErrorBubble()` retries the whole turn. Any prompt change that makes malformed JSON more likely raises cost as well as breaking the UX.

### Lever 5 — bound the history (last, and coarsely)

Cap `history` before sending; a scenario arc is 5 steps, so ~20 messages is already generous. Trim in **coarse steps** (drop the oldest 8 once the array passes 24), never as a per-turn sliding window: cutting the front of the transcript changes the cached prefix, so a sliding window would invalidate the cache every single turn and cost more than it saves. Lever 1 already makes repeated history cheap, which is why this comes last.

### What not to do

- **Don't shorten the system prompt to save tokens.** Cached, it bills at ~0.1×, and it is the only thing holding the JSON contract, the darija-not-fusha rule and the feedback pedagogy together. Cutting it invites malformed JSON (a retry is a full extra call) and weaker coaching — a false economy twice over — and can drop the prefix under the 1024-token cache minimum.
- **Don't lower `max_tokens` expecting savings.** Output bills on tokens actually produced, not on the ceiling. `max_tokens: 1000` is a runaway guard; tightening it to ~200 on the utility calls is harmless, doing it on the role-play turn risks truncated JSON — which costs a retry.
- **Don't switch to `claude-sonnet-5` for cost.** It tokenizes the same text into ~30% more tokens, so at list price ($3/$15) it is a net increase over Sonnet 4.6; the intro pricing that currently offsets that ends 2026-08-31, which is too short a window to design around. Worse, its adaptive thinking is **on** when `thinking` is omitted, which would add reasoning tokens to every turn. It is the right move for *quality* (and unlocks structured outputs, killing the regex parsing), but then pass `thinking: {type: 'disabled'}` explicitly and re-measure everything.

## Adding content

All learning content is plain `const` arrays near the top of the script block — no CMS, no fetch:

- [`SCENARIOS`](public/index.html#L647) — 15 role-plays as `{mode, id, icon, name, role, desc, persona, opening:{ar,latin,fr}}`. `persona` is the per-scenario system prompt and encodes a numbered conversational arc the model should advance through. `mode` is `'standard'` (11) or `'kids'` (4) and drives the tab filter plus extra gentle-feedback rules in `buildSystemPrompt()`; omitting it is safe — [line 883](public/index.html#L883) defaults it to `'standard'`.
- [`PHRASEBOOK`](public/index.html#L888) — 6 categories of `{ar, latin, fr}` phrases
- [`QUIZ_ITEMS`](public/index.html#L961) — 12 emoji→word items (emoji used as illustration to avoid image licensing)
- [`BADGES`](public/index.html#L1007) — each has a `check(completed, streak)` predicate evaluated against the ids in `tkellem_completed`
- [`ONBOARDING_SLIDES`](public/index.html#L2310) — shown once, gated by `tkellem_onboarding_done`

The guided path ([`renderProgress(true)`](public/index.html#L2241)) hard-codes a three-step gate: finish every phrasebook category → quiz → free scenarios. Its step conditions read `tkellem_completed` directly, so new content types need matching id prefixes to count.

## Conventions

- **Everything user-facing is French; comments in the source are French too.** Match that when editing.
- Darija is always carried as the triple `{ar, latin, fr}` — arabic script, arabizi transliteration, french gloss. Keep all three in sync; the UI and the TTS both depend on it (`speak()` falls back to `latin`).
- Emoji are rendered as Twemoji `<img>` via [`emojiImg()`](public/index.html#L1122) because native phone rendering is inconsistent — use it instead of inlining an emoji in generated markup.
- No framework: DOM built with template strings and `document.getElementById`, handlers assigned as `.onclick`. Design tokens are CSS custom properties (`--cream`, `--zellige`, …) in the single `<style>` block.

## Gotchas

- **[public/index[1].html](public/index%5B1%5D.html) is a stale browser-download of an earlier prototype** (~32 KB vs ~113 KB): it still uses `webkitSpeechRecognition` and has no Supabase, phrasebook, quiz, or badges. Nothing links to it, but `express.static` still serves it. Never edit it, and don't mine it for "existing" patterns.
- `index.html` is a ~113 KB single file — prefer targeted `Edit` calls over rewriting it.
- Scenario transcripts persist per scenario; a code change to the `history` shape (`{role, ar, latin, fr}`) will break saved sessions already in users' `localStorage`.

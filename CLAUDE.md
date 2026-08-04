# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

The application is **not** at the workspace root — it lives in [Tkellem/](Tkellem/), which is also the git repo root (remote `github.com/mohamediazehaf-fr/Tkellem`, current branch `feature/add_home_link`). Run every command from `Tkellem/`.

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

**[Tkellem/server.js](Tkellem/server.js) exists only to keep API keys off the client.** It holds no state, no database, no session, no business logic — it serves `public/` statically and forwards four calls, injecting secrets from `process.env`:

| Endpoint | Forwards to | Notes |
|---|---|---|
| `POST /api/chat` | Anthropic Messages API | model hardcoded at [server.js:28](Tkellem/server.js#L28), `max_tokens: 1000`; body is `{system, messages}` passed through verbatim |
| `GET /api/voices` | ElevenLabs `/v1/voices` | returns `{voices: []}` when the key is unset, so the client can degrade |
| `POST /api/transcribe` | ElevenLabs speech-to-text | `{audio_base64, mime_type}` → `scribe_v2`, `language_code: 'ar'` → `{text}` |
| `POST /api/speak` | ElevenLabs text-to-speech | `{text, voice_id}` → `eleven_multilingual_v2` → raw `audio/mpeg` |

**Supabase is called directly from the browser and bypasses the Node server entirely** ([index.html:1098](Tkellem/public/index.html#L1098) holds the project URL and publishable key inline). Auth, progress sync, and avatar upload never touch `server.js`. So a request either goes through the proxy (Claude, ElevenLabs) or straight to Supabase — never both.

### The Claude contract: JSON smuggled through free text

There is no structured-output enforcement. [`buildSystemPrompt()`](Tkellem/public/index.html#L1955) instructs the model to emit *only* a JSON object (`darija_ar`, `darija_latin`, `french`, `feedback`, `feedback_phrase`), and [`callAvatarAPI()`](Tkellem/public/index.html#L1901) recovers it with `raw.match(/\{[\s\S]*\}/)` + `JSON.parse`. **Prompt and parser are coupled** — changing the response shape means editing both, and a malformed reply surfaces as a retry bubble ([`addErrorBubble`](Tkellem/public/index.html#L1941)) rather than a crash.

Four independent call sites hit `/api/chat`, each with its own ad-hoc prompt and its own parsing quirk — don't assume one shared helper:

- [`callAvatarAPI()`](Tkellem/public/index.html#L1901) — the role-play turn; the only one that sends `system` and the conversation `history`
- [hint button](Tkellem/public/index.html#L1988) — one-shot suggestion, strips ` ```json ` fences
- [`runTranslation()`](Tkellem/public/index.html#L2024) — FR→darija, deliberately **not** appended to `history`
- [`submitQuizAnswer()`](Tkellem/public/index.html#L2167) — uses Claude as a fuzzy grader for quiz answers

### Voice pipeline

Input: mic button → `MediaRecorder` (webm, 20 s auto-stop) → base64 → `/api/transcribe` → transcript fed into `handleUserInput()` ([setup](Tkellem/public/index.html#L1794)). A text field is always available as a fallback and is the only path when `MediaRecorder` is missing.

Output: [`speak()`](Tkellem/public/index.html#L1566) posts to `/api/speak` and plays the mp3 through **one reused `Audio` element** (`avatarAudio`) — that reuse plus `unlockAudioOnce()` is what defeats mobile autoplay blocking, so don't replace it with fresh `new Audio()` per utterance. The voice is fixed, never user-selectable: [`loadVoices()`](Tkellem/public/index.html#L1600) searches the account for a voice named "Ghizlane" (then any darija/moroccan match) at boot. If that fails, `speakBrowserFallback()` uses `SpeechSynthesis` — reading the Arabic text when an Arabic voice exists, otherwise the latin transliteration.

### Client state and persistence

`localStorage` is the working store; on login the Supabase `progress` row **overwrites** local values ([`syncFromServer`](Tkellem/public/index.html#L1196)), and first-ever login pushes guest progress up. `syncToServer()` upserts `{user_id, points, completed, display_name, avatar, avatar_url, updated_at}`. Avatar photos are resized to a 240 px square and uploaded to the storage bucket named `Avatar` at `{user_id}/avatar.jpg` ([here](Tkellem/public/index.html#L1285)).

Keys: `tkellem_points`, `tkellem_completed` (array of `phrasebook_*` / `scenario_*` / `quiz_perfect` ids), `tkellem_streak`, `tkellem_last_active`, `tkellem_badges_seen`, `tkellem_onboarding_done`, and `tkellem_history_<scenarioId>` (one saved transcript per scenario, which is why cards show a "resume" state).

When Supabase is reachable, [`applyAuthGate()`](Tkellem/public/index.html#L1152) forces the account screen until the user is signed in **and** has a `display_name`; when `window.supabase` failed to load, the whole gate is skipped and the app runs guest-only.

### Navigation

Single page, eight sibling `<div id="screen-*">` blocks toggled by [`showScreen()`](Tkellem/public/index.html#L1718) against `ALL_SCREENS` — no router, no history API. Adding a screen means adding the div, the id to `ALL_SCREENS`, and its back-button wiring.

## Adding content

All learning content is plain `const` arrays near the top of the script block — no CMS, no fetch:

- [`SCENARIOS`](Tkellem/public/index.html#L639) — 15 role-plays as `{mode, id, icon, name, role, desc, persona, opening:{ar,latin,fr}}`. `persona` is the per-scenario system prompt and encodes a numbered conversational arc the model should advance through. `mode` is `'standard'` (11) or `'kids'` (4) and drives the tab filter plus extra gentle-feedback rules in `buildSystemPrompt()`; omitting it is safe — [line 875](Tkellem/public/index.html#L875) defaults it to `'standard'`.
- [`PHRASEBOOK`](Tkellem/public/index.html#L880) — 6 categories of `{ar, latin, fr}` phrases
- [`QUIZ_ITEMS`](Tkellem/public/index.html#L953) — 12 emoji→word items (emoji used as illustration to avoid image licensing)
- [`BADGES`](Tkellem/public/index.html#L999) — each has a `check(completed, streak)` predicate evaluated against the ids in `tkellem_completed`
- [`ONBOARDING_SLIDES`](Tkellem/public/index.html#L2290) — shown once, gated by `tkellem_onboarding_done`

The guided path ([`renderProgress(true)`](Tkellem/public/index.html#L2221)) hard-codes a three-step gate: finish every phrasebook category → quiz → free scenarios. Its step conditions read `tkellem_completed` directly, so new content types need matching id prefixes to count.

## Conventions

- **Everything user-facing is French; comments in the source are French too.** Match that when editing.
- Darija is always carried as the triple `{ar, latin, fr}` — arabic script, arabizi transliteration, french gloss. Keep all three in sync; the UI and the TTS both depend on it (`speak()` falls back to `latin`).
- Emoji are rendered as Twemoji `<img>` via [`emojiImg()`](Tkellem/public/index.html#L1114) because native phone rendering is inconsistent — use it instead of inlining an emoji in generated markup.
- No framework: DOM built with template strings and `document.getElementById`, handlers assigned as `.onclick`. Design tokens are CSS custom properties (`--cream`, `--zellige`, …) in the single `<style>` block.

## Gotchas

- **[Tkellem/public/index[1].html](Tkellem/public/index%5B1%5D.html) is a stale browser-download of an earlier prototype** (~32 KB vs ~113 KB): it still uses `webkitSpeechRecognition` and has no Supabase, phrasebook, quiz, or badges. Nothing links to it, but `express.static` still serves it. Never edit it, and don't mine it for "existing" patterns.
- `index.html` is a ~113 KB single file — prefer targeted `Edit` calls over rewriting it.
- Scenario transcripts persist per scenario; a code change to the `history` shape (`{role, ar, latin, fr}`) will break saved sessions already in users' `localStorage`.

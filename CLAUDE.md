# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

The application is **not** at the workspace root — it lives in this directory (`Tkellem/`), which is also the git repo root (remote `github.com/mohamediazehaf-fr/Tkellem`, work happens directly on `main`). Run every command from `Tkellem/`.

```
Tkellem/
  server.js              # Express API-key proxy (~400 lines) — the entire backend
  package.json           # express only; node >= 18
  public/
    index.html           # public landing page (SEO) — redirects a signed-in visitor to /app
    app.html             # the entire frontend: HTML + CSS + JS inline (~5200 lines)
    manifest.json        # PWA manifest
    icons/               # 180/192/512 png
  supabase.sql           # tables, RLS and operational notes — run once in the SQL editor
  relecture-darija.csv   # phrasebook export for native-speaker review (UTF-8 BOM, ";")
  README.md              # step-by-step Render deployment walkthrough (French, non-technical)
```

## The product is called Beldi; the code still says Tkellem

The app was renamed from *Tkellem* to **Beldi** (بلدي, "of the country, authentic") in August 2026, after
[tkellem.fr](https://tkellem.fr/) turned out to be an existing darija product. Only user-visible strings moved.
**Three families of identifier deliberately kept the old name, and renaming them would break production:**

- `TKELLEM_*` environment variables — their values live in the Render dashboard, not in the repo. Renaming the
  code side alone silently reverts every optimisation lever to its default.
- `localStorage` keys `tkellem_*` — they hold points, streak, pseudo, quiz records, SRS boxes and the voice id.
  Renaming them logs every existing learner back to zero progress with no migration path.
- `AUDIO_CACHE_NAME`, the `Tkellem/` directory and the GitHub remote — cosmetic, but changing them buys nothing.

**Two live origins, deliberately.** The canonical address is `https://beldi-darija.fr` (OVH domain, apex `A` → Render's
`216.24.57.1`, `www` → `CNAME` to the service host). The Render service is still *named* `tkellem`, so
`tkellem.onrender.com` keeps serving the same app — that is the point: renaming the service would change the origin,
and `localStorage` is per-origin, so every learner would lose streak, SRS schedule and quiz records. Both hostnames
work; only the canonical tag, OG tags and JSON-LD name the domain.

Note also that the many `public/index.html#L…` anchors below still point at the pre-split filename; the code they
describe now lives in `public/app.html`, and the line numbers have drifted. Trust the symbol names, not the anchors.

## Commands

```powershell
npm install
$env:ANTHROPIC_API_KEY   = "sk-ant-..."
$env:ELEVENLABS_API_KEY  = "..."
node server.js            # or: npm start  → http://localhost:3000
```

There is **no build step, no bundler, no test suite, and no linter**. `npm start` is the only script. Verify changes by loading the app in a browser (Chrome recommended) — `localhost` counts as a secure context, so the microphone works without HTTPS.

Deployment is push-to-deploy and needs nothing in the repo — no `render.yaml`, no CI workflow. Render's own **Auto-Deploy** (service → Settings → Build & Deploy, on by default for a GitHub-connected service) watches the configured branch, here `main`, and rebuilds (`npm install` / `node server.js`) on every push, with the API keys supplied as environment variables. A failed build leaves the previous version serving, so a broken push degrades to "no update" rather than an outage.

**Every push to `main` therefore reaches real users within minutes.** There is no test suite and no staging service, so the browser check above is the only gate — run it before pushing, not after.

The free tier sleeps after 15 min of inactivity, so the first request after idling takes several seconds.

## Architecture

Two files carry the whole app, and the split between them is the key thing to understand:

**[server.js](server.js) exists only to keep API keys off the client.** It holds no state, no database, no session, no business logic — it serves `public/` statically and forwards four calls, injecting secrets from `process.env`:

| Endpoint | Forwards to | Notes |
|---|---|---|
| `POST /api/chat` | Anthropic Messages API | body is `{system, messages, task}`; `buildChatPayload()` picks model / `max_tokens` / effort / caching from `TASK_PROFILES` — see Token cost strategy |
| `GET /api/voices` | ElevenLabs `/v1/voices` | returns `{voices: []}` when the key is unset, so the client can degrade |
| `POST /api/transcribe` | ElevenLabs speech-to-text | `{audio_base64, mime_type}` → `scribe_v2`, `language_code: 'ar'` → `{text}` |
| `POST /api/speak` | ElevenLabs text-to-speech `/stream` | `{text, voice_id}` → `TTS_MODEL` → `audio/mpeg` piped straight through — see Audio latency |

**Supabase is called directly from the browser and bypasses the Node server entirely** ([index.html:1220](public/index.html#L1220) holds the project URL and publishable key inline). Auth, progress sync, and avatar upload never touch `server.js`. So a request either goes through the proxy (Claude, ElevenLabs) or straight to Supabase — never both.

### The Claude contract: JSON smuggled through free text

There is no structured-output enforcement. [`buildSystemPrompt()`](public/index.html#L2162) instructs the model to emit *only* a JSON object (`darija_ar`, `darija_latin`, `french`, `feedback`, `feedback_phrase`), and [`callAvatarAPI()`](public/index.html#L2107) recovers it with `raw.match(/\{[\s\S]*\}/)` + `JSON.parse`. **Prompt and parser are coupled** — changing the response shape means editing both, and a malformed reply surfaces as a retry bubble ([`addErrorBubble`](public/index.html#L2148)) rather than a crash.

Four independent call sites hit `/api/chat`, each with its own ad-hoc prompt and its own parsing quirk — don't assume one shared helper:

- [`callAvatarAPI()`](public/index.html#L2107) — the role-play turn; the only one that sends `system` and the conversation `history`
- [hint button](public/index.html#L2195) — one-shot suggestion, strips ` ```json ` fences
- [`runTranslation()`](public/index.html#L2232) — FR→darija, deliberately **not** appended to `history`
- [`submitQuizAnswer()`](public/index.html#L2428) — uses Claude as a fuzzy grader for quiz answers

### Voice pipeline

Input: mic button → `MediaRecorder` (webm, 20 s auto-stop) → base64 → `/api/transcribe` → transcript fed into `handleUserInput()` ([setup](public/index.html#L2000)). A text field is always available as a fallback and is the only path when `MediaRecorder` is missing.

Output: [`speak(text, latin, btn)`](public/index.html#L1748) posts to `/api/speak` and plays the mp3 through **one reused `Audio` element** (`avatarAudio`) — that reuse plus `unlockAudioOnce()` is what defeats mobile autoplay blocking, so don't replace it with fresh `new Audio()` per utterance. The voice is fixed, never user-selectable. `loadVoices()` runs a cascade at boot: `ELEVENLABS_VOICE_ID` if set → a name matching `ELEVENLABS_VOICE_NAME` (default *ghizlane*) → any voice whose name or labels mention darija/moroccan/arab → **the account's first voice**. That last rung matters more than it looks: any ElevenLabs voice reads arabic acceptably with a multilingual model, whereas `speakBrowserFallback()` hands arabic script to a French system voice and produces noise. A voice disappearing from the account must degrade to a different voice, never to the browser. The status line always names the voice actually in use, and flags it when it isn't the expected one — a silent fallback means an app speaking in the wrong voice with nobody understanding why.

The resolved voice id is kept in `tkellem_voice_id`, and reused when `/api/voices` comes back empty — because the storage path embeds the voice id, so without it the shared cache becomes unreachable and *already-paid-for* audio goes unused. With the fallback, an ElevenLabs outage or a bad key still leaves every fixed phrase speaking correctly; only unseen text degrades to the browser voice. Worth remembering that one key powers three things — TTS, STT for the conversation mic, and the pronunciation exercise — so an authentication failure takes out far more than the voice.

**Changing voice invalidates the whole audio cache**, since the storage path is `<voiceId>/<hash>.mp3`. Old folders become orphaned and can be deleted from the bucket.

### Audio latency

Playing a phrase used to take 1.5–2.5 s, essentially all of it TTS generation. Three things address it, and they compose:

- **Two models, split by purpose — and the shared cache is what justifies it.** Learning content (phrasebook, grammar, « Je débute », quiz words) uses `ELEVENLABS_TTS_MODEL`, default **`eleven_multilingual_v2`**: highest quality, and its slowness is paid *once for all users* because the result is cached. Conversation audio passes `quality: 'fast'` → `ELEVENLABS_TTS_MODEL_FAST`, default **`eleven_turbo_v2_5`**, **not cached**, because each reply is unique text that will never be replayed. That default was `eleven_flash_v2_5` until August 2026 and was changed on a quality complaint: flash optimises latency at the cost of a flat, mechanical timbre, which is a defect in an app whose product *is* the voice. Changing this variable is free of consequences for the stored audio — `ttsKey()` hashes `TTS_MODEL`, not the fast one, and the fast path is never cached. In a pronunciation app a mispronounced word is a real defect — the learner copies it — so never route learning content through the fast model to save latency the cache already absorbs.
- **Finding the right `say` is empirical — use [`public/tts-lab.html`](public/tts-lab.html), never guesswork.** That page (noindex, unlinked, served by the server so its `/api/*` calls resolve) plays candidate spellings on the app's own voice. It exists because two rounds of reasoning-from-first-principles produced wrong fixes, one of which made a word worse. **The measured result: no single strategy wins.** A fatha fixed `سَلام`; a sukun fixed `بْسلامة`; plene spelling — short vowels written with ا و ي — fixed `كولشي بيخير` and `شوكران`; turning a final ة into ا fixed `كنهضر شويا الدارجا`; and for `bla jmil` the **latin transliteration beat the arabic outright** (`say:'blajmil'`), because the engine reads « bila jamil » from any arabic spelling. Four other words were already correct and needed nothing. Conclusion: test, don't reason. Emphatic consonants (ط ص ض ق) darken a neighbouring vowel and are worth trying when an « a » sounds too bright.
- **Some mispronunciations are data defects, not engine defects.** `أنا متزوج` is the *modern standard arabic* word while its transliteration says the darija `mzewwej`; the engine is right and the entry is inconsistent. Same class: a final ة reads « t » in MSA where darija drops it. These belong to native review, not to `say`.
- **`say` overrides what gets spoken, without touching what gets shown.** Undiacriticised arabic is ambiguous for a TTS engine: `شكرا` is read « choukra » because the tanwin carrying the final *-an* is never written. Any data entry may carry an optional `say` holding a vocalised variant; `sayText(p)` returns `p.say || p.ar` and is used at the **nine** call sites that speak data. The five that speak model output pass `.ar` directly and must stay that way. Do **not** fix such a word by editing `ar` — it is the review-card identifier (`phraseId = leafId + '#' + ar`), so changing it orphans every learner's progress on that phrase, and it puts diacritics in the UI where the other 340 entries have none. Grading is unaffected by design: only `speak()` calls were rerouted, and speech-to-text never returns diacritics, so a vocalised target would break the comparison. **Maintenance hazard:** `say` duplicates the text, so editing `ar` without editing `say` makes the audio drift from the display silently — prefer `say` on short entries, and for long sentences fix the source instead.
- **Scenario openings go through the cache, deliberately.** `startScenario` speaks `s.opening.ar` with `quality: 'high'`, not `'fast'`, because that string is fixed data in `SCENARIOS` — identical for every learner. It sat on `'fast'` until August 2026, so each of the fifteen openings was regenerated for every user who entered the scenario. The waste grew linearly with the audience. Rule of thumb: `'fast'` is for text the model just produced, `'high'` for anything that comes from a data file.
- **Legacy note.** `ELEVENLABS_TTS_MODEL` in [server.js](server.js), formerly `eleven_flash_v2_5` (built for real-time; also half the credits per character). `eleven_turbo_v2_5` is the middle ground and `eleven_multilingual_v2` the original, highest-quality, slowest option — one env var, three points on the quality/speed curve. Judge it by ear on arabic: voice quality *is* the product here.
- **Streaming.** `/api/speak` calls ElevenLabs' `/stream` endpoint and pipes the body through with `Readable.fromWeb()` instead of buffering the whole mp3, so generation and both transfers overlap. Headers are already sent by then, hence the stream `error` handler that just ends the response.
- **Client cache.** `audioCache` (60 entries, LRU-ish, blob URLs revoked on eviction) keyed by `voiceId|text`. The phrasebook, quiz words, scenario openings and every "Réécouter" replay the *same* strings, so second and later plays are instant and cost nothing. `playAudioUrl()` resets `currentTime` when the same URL is replayed — without that, re-clicking a cached phrase would silently do nothing.

**When adding a `speak()` call from a button, pass the button as the third argument.** `setAudioLoading()` swaps its 🔊 for a spinner and disables it during generation — the disable is not cosmetic, a double-click means a second paid generation. Automatic playback passes the bubble's replay button, which `addBubble()` returns for that purpose; calls with no button (quiz correction, translation panel) show nothing because their surrounding UI already reacted.

### Pronunciation practice

Every phrase in the phrasebook carries a 🎤 next to its 🔊. Tap to record (tap again, or wait 6 s, to stop) → `transcribeBlob()` → ElevenLabs STT in arabic → `gradePronunciation()` asks Claude (`task: 'pron'`, Haiku) to compare the transcript against the target and return `{level: 1|2|3, message, tip}`. Level 3 awards `PRON_POINTS` **once per phrase** (key `pron_<catId>_<index>` in `tkellem_completed`, so it can't be farmed) and ends the loop; levels 1–2 offer "réécouter le modèle" and "je réessaie", which is the retry loop the feature is built around. A phrase already nailed shows a green mic.

**What this actually measures is intelligibility to a speech-to-text engine, not phonetics.** There is no phoneme scoring anywhere in the stack. A sloppy attempt that STT still resolves to the right word scores 3, and an isolated word with no sentence context can fail on a good attempt. Worth knowing before trusting a level, and before promising learners more precision than this design can deliver.

The three levels live in `PRON_LEVELS` — wording is deliberately encouraging at every level, including the lowest, matching the kids-mode rules in `buildSystemPrompt()`. Keep it that way: the learner is meant to retry, not to feel judged.

Recording is guarded by a single module-level `pronRecorder`, so two phrases can never record at once. The conversation screen's mic is a separate path (`setupSpeechRecognition()`) — the two share only `transcribeBlob()` and `blobToBase64()`.

### Client state and persistence

`localStorage` is the working store; on login the Supabase `progress` row **overwrites** local values ([`syncFromServer`](public/index.html#L1331)), and first-ever login pushes guest progress up. `syncToServer()` upserts `{user_id, points, completed, display_name, avatar, avatar_url, updated_at}`. Avatar photos are resized to a 240 px square and uploaded to the storage bucket named `Avatar` at `{user_id}/avatar.jpg` ([here](public/index.html#L1420)).

Keys: `tkellem_points`, `tkellem_completed` (array of `phrasebook_*` / `scenario_*` / `quiz_perfect` ids), `tkellem_streak`, `tkellem_last_active`, `tkellem_badges_seen`, `tkellem_onboarding_done`, and `tkellem_history_<scenarioId>` (one saved transcript per scenario, which is why cards show a "resume" state).

When Supabase is reachable, [`applyAuthGate()`](public/index.html#L1284) forces the account screen until the user is signed in **and** has a `display_name`; when `window.supabase` failed to load, the whole gate is skipped and the app runs guest-only.

### Navigation

Single page, eight sibling `<div id="screen-*">` blocks toggled by [`showScreen()`](public/index.html#L1909) against `ALL_SCREENS` — no router, no history API. Adding a screen means adding the div, the id to `ALL_SCREENS`, and its back-button wiring.

A **fixed bottom tab bar** (`#tabbar`) carries the four destinations — Apprendre / Défis / Parcours / Compte — and is the app's primary navigation; the home screen is just the Apprendre tab's content, no longer a menu of everything. `syncTabbar()` runs from `showScreen()` and hides the bar on the three screens that demand full attention (`screen-convo`, `screen-blitz`, `screen-onboarding`) and while the auth gate is closed. **`tabTarget()` is a function, not a const map** — `applyAuthGate()` can call `showScreen()` during boot, before this section's consts would be initialised, and a const there reintroduces the blank-page bug. Screens carry `padding-bottom: calc(var(--tab-h) + 28px)` so content clears the bar.

The header is **sticky chrome shared by every screen** — the banner goes home, the star badge to progress, the avatar to the account — so navigation never requires scrolling back up. The phrasebook breadcrumb sticks directly beneath it at `top: var(--header-h)`, and that variable is **measured at runtime** by `syncHeaderHeight()` (on load, on resize, and after `document.fonts.ready`, since web fonts change the header's height) rather than hard-coded. Anything else pinned below the header — currently `.points-toast` — must offset from the same variable, or it will overlap once the fonts settle.

**Two screens bound their own height instead of growing** — `#screen-convo` and `#screen-onboarding` use `calc(100dvh - var(--header-h))` (with a `100vh` fallback line first). Without a definite height, `#transcript{flex:1;overflow-y:auto}` cannot scroll internally: **a flex item defaults to `min-height:auto` and refuses to shrink below its content**, so the transcript grew and the whole *page* scrolled, carrying the scene header and the composer out of view. Any future scroll-inside-a-panel layout needs both the bounded parent and `min-height:0` on the scrolling child, or it will silently fail the same way.

Controls that sit above long lists are sticky, not just the breadcrumb — the scenario Ados/Enfants switch pins under the header too. The rule: if a control governs a list, it must stay reachable while scrolling that list.

`showScreen()` also resets the scroll position; without it a new screen appeared at the previous screen's scroll offset. Phrasebook level changes reset it too, but a **same-level re-render must not** (the "j'ai appris" button re-renders in place and should leave the learner where they were), which is why `scrollToTop()` sits in the click handlers rather than inside `renderPhrasebook()`.

**Every screen starts hidden, so the page has no body until `applyAuthGate()` picks one.** That makes the boot path load-bearing: `initAuth()` must reach `applyAuthGate({initial:true})` on every route, including when `getSession()` throws (hence the try/catch) and when `window.supabase` never loaded. The `initial` flag exists because the post-boot calls deliberately do *not* move the user — Supabase fires `onAuthStateChange` on token refresh, and without that distinction a refresh mid-conversation would yank them to home. A blank page under the header is the signature of this path failing.

Landing screens: signed in with a `display_name` → home; signed in without one → account (profile creation); not signed in → account (login); no Supabase at all → home as a guest. Note a refresh during onboarding lands on home rather than resuming the slides, and `tkellem_onboarding_done` stays unset.

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

### Levers 0–3 are implemented — and switchable

All of it lives in one config block at the top of [server.js](server.js) and is driven by environment variables, so reverting is a Render env-var change and a restart — **no code edit, no frontend redeploy**:

| Variable | `=off` disables | Default |
|---|---|---|
| `TKELLEM_OPTIMIZE` | **everything** — rebuilds the exact pre-optimisation request (Sonnet 4.6 for all four tasks, `max_tokens: 1000`, no cache, no effort) | on |
| `TKELLEM_LOG_USAGE` | the `[tokens]` log line (lever 0) | on |
| `TKELLEM_CACHE` | prompt caching (lever 1) | on |
| `TKELLEM_EFFORT` | `effort` + explicit `thinking` (lever 2) | on |
| `TKELLEM_CHEAP_MODELS` | Haiku routing — everything back on Sonnet (lever 3) | on |
| `TKELLEM_CHAT_EFFORT` | — | `medium` (`low`/`high`/`max` accepted; anything else falls back to `medium`) |

The four client call sites now send a `task` (`chat` / `hint` / `translate` / `quiz`) and **never a model name** — `resolveTask()` maps anything unknown to `chat`, so nothing from the browser can select a model outside `TASK_PROFILES`. Per-task profile: model, `max_tokens`, effort level, and whether caching applies.

Granular switches exist to isolate a quality regression: turn one lever off at a time rather than reaching for `TKELLEM_OPTIMIZE=off`.

### Step 0 — make spend observable

Every `/api/chat` response logs one line: `[tokens] <task> <model> in= cache_read= cache_write= out=`. This is the measurement instrument for everything else — `cache_read` climbing across a conversation means caching works; stuck at 0 means the prefix changed or is still under the minimum.

### Lever 1 — prompt caching (biggest win, no quality risk)

Top-level `cache_control: {type: 'ephemeral'}` is sent on the `chat` task only. The API places the breakpoint on the last cacheable block, so system + all prior turns are cached and the next turn re-reads that prefix at ~0.1× instead of full price. Expect the input side of a long conversation to fall by roughly two-thirds. Verify with `cache_read_input_tokens`, not by assumption.

Three conditions this depends on — protect them:

- **Minimum cacheable prefix on `claude-sonnet-4-6` is 1024 tokens.** The system prompt alone probably sits just under it, so nothing caches for the first exchange or two and then it kicks in. This also means shortening the system prompt can push the prefix below the threshold and *disable* caching outright.
- **The prefix must be byte-identical between turns.** `buildSystemPrompt()` is deterministic today — keep it that way. Interpolating a date, the learner's name, a point total or anything per-request into the system prompt invalidates the cache on every turn and silently removes the whole saving.
- **5-minute TTL.** Normal turn cadence (record → transcribe → reply → listen) stays well inside it; a learner who walks away pays one fresh cache write.

Caching does nothing for the hint, translation and quiz calls — those prompts are ~150 tokens, far below any minimum. Don't expect savings there; use levers 3 and 4 instead.

### Lever 2 — effort

`effort` defaults to `high` on Sonnet 4.6. These tasks are short-form generation and classification, which is exactly the shape Anthropic's guidance puts at `output_config: {effort: 'low'}` with `thinking: {type: 'disabled'}`. Thinking was already off (an omitted `thinking` field means no thinking on Sonnet 4.6), so making it explicit changes nothing — the saving comes from `effort`.

The `chat` task ships at `medium`; A/B it against `low` with `TKELLEM_CHAT_EFFORT` before committing, since that reply *is* the product.

**`effort` and `thinking` are only sent to models in `MODELS_WITH_EFFORT`.** Haiku 4.5 returns a 400 on both — adding a model to a task profile without checking that list is how this breaks.

### Lever 3 — route cheap tasks to a cheaper model

Grading a one-word quiz answer and translating one sentence do not need Sonnet, so `hint` / `translate` / `quiz` run on `claude-haiku-4-5` ($1/$5 per Mtok against Sonnet's $3/$15, ~3× cheaper on those paths). `chat` stays on Sonnet 4.6.

Haiku 4.5 also supports structured outputs (`output_config.format`), which would remove the regex-and-retry JSON parsing on those three paths — not done, worth doing if malformed JSON shows up in the logs.

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

## Spaced repetition and the daily session

**The retention layer, and it costs nothing to run** — pure `localStorage`, no API call, no token. `tkellem_srs` maps a card id to `{box, due}` in day numbers; `SRS_INTERVALS` grows 1→2→4→8→16→32→60 days. `noteReview(id, success)` promotes on success and resets the box to 0 on failure, so a phrase that resists comes back tomorrow.

- Card ids are **derived from the arabic text**, not from a list position (`phraseId()` = `leafId#ar`), so inserting a phrase into a category never shifts anyone's schedule.
- A phrase enters the cycle when its category is validated (`seedLeafReviews`), never before — reviewing what was never learned is noise. Quiz words enter when the learner asks to be shown the answer.
- `allReviewablePhrases()` walks `PHRASEBOOK`, `GRAMMAR` *and* `QUIZ_BANKS`; a word failed in the quiz must resurface in the session, otherwise failure leads nowhere.
- The session grades by **self-assessment** ("Je savais" / "Pas vraiment"), which is how every spaced-repetition system works and is more honest than a multiple choice where you can guess. Every third card is **listening-only** — audio first, meaning hidden — because understanding by ear is the real difficulty of darija and everywhere else the audio comes with the text.
- Finishing a session calls `touchStreak()`: this is what finally gives the streak counter something to feed on.

`renderKnowledge()` counts only cards in **box ≥ 2** — seen once is not known — and maps the total to a can-do statement. "140 phrases bien ancrées · de quoi tenir une conversation courte" tells a learner something that "Confirmé 🌟 à 200 points" never did.

**"Je ne trouve pas — montre-moi"** exists in the image quiz and the grammar drills, deliberately *not* in the timed blitz where the countdown already resolves being stuck. The wording avoids "je ne sais pas": it describes a momentary search, not a deficiency. Giving up reveals the word, speaks it, and schedules it for early review — it is a learning path, not a penalty.

## Games: blitz quiz, leaderboard, duels

**No Claude call anywhere in this module, by design.** Questions are multiple-choice and graded locally — mandatory for a timed game (a network round-trip per answer would kill the rhythm), and free as a side effect. Keep it that way: the moment a question needs LLM grading it stops being a game.

- `getQuestionPool()` aggregates `BASICS_WORDS` + every phrasebook leaf + `QUIZ_ITEMS`, deduped through `normFr()` — which strips articles, because "Le taxi" and "taxi" as two options in the same question is an unanswerable question, not a hard one.
- `buildQuiz(seed)` is **deterministic** via `seededRandom()` (mulberry32). That is the whole basis of fair duels: both players get the same questions, order and distractors from the same seed. Never introduce `Math.random()` into quiz construction — only into seed *choice*.
- Scoring is `correct count`, tie-break is total answering time (`performance.now()` accumulated per question). This mirrors the duel rule exactly; don't add a speed bonus to the score or the two stop agreeing.
- **A received challenge has `opponent_id = NULL`, so it matches no filter on your own id.** `loadMyDuels()` therefore runs two queries — your duels, plus open challenges from others — and renders the second group as invitations with a "Relever le défi" button. Without that second query the invitation is invisible in the app and only reachable through the shared link, which is exactly how the feature first shipped broken. Only invitations whose challenger has actually played (`challenger_score != null`) are offered, since otherwise there's no score to beat.
- If writing a duel result fails, `settleDuel()` says so on screen instead of rendering the outcome from local state — a player who believes their score was saved while the row never changed leaves the other one waiting forever.
- **Duels are asynchronous by share link**, not realtime: the challenger plays, sends a link, the opponent plays the same seed whenever. With a handful of users a realtime lobby would be an empty room.

**The Défis screen has its own sub-tabs** (`gamesTab`: Jouer / Défis / Amis / Classement) in a sticky segmented control, because stacking all four sections made one endless page. Only the active section exists in the DOM, so `renderFriends()` / `loadMyDuels()` / `loadLeaderboard()` all bail on a missing container *before* querying — keep that guard first in any new loader, or switching tabs will fire pointless requests. Two consequences to respect: the pending-count dots are painted by `updateSegDots()` after the async counts land (never by re-rendering, which would relaunch the loads), and anything needing the pseudo field must go through `promptForPseudo()`, which switches to the Classement tab first — the input simply doesn't exist on the other tabs.

**Friends and notifications.** `friendships` holds one directed row per pair (`requester` → `addressee`, `status` pending/accepted) with the pseudo copied in, so a friends list renders without reading anyone else's profile. `loadFriends()` sorts rows into `social.friends / incoming / outgoing`, and `relationWith(userId)` is what decides each leaderboard row's button — never offer "+ Ami" to someone already linked. Two duel flavours now exist: **open** (`opponent_id` null, anyone can take it, surfaced as an invitation to everyone) and **targeted** (`opponent_id` set at creation by `challengeFriend()`, lands straight in that person's list). Both work under the existing policies — no schema change was needed for targeted duels.

The tab badge counts incoming friend requests plus duels where `opponent_id = me and opponent_score is null`. It refreshes on boot, on auth change, when the Défis screen opens, and after a game — **there is no polling and no realtime subscription**, so a request that arrives while the app is open shows up on the next visit to Défis, not instantly. Deliberate: a websocket for five users isn't worth the moving parts. Presence-based random matchmaking was declined for the same reason — with this user count the online pool is empty, so "défi ouvert" plays that role asynchronously instead.

Note you can only befriend someone who appears in the leaderboard, i.e. who has played at least once — there is no user directory, and adding one would mean exposing a list of all accounts.

Supabase side lives in [supabase.sql](supabase.sql) — **the user must run it once**; the app degrades with an explicit "table probably missing" message until then. Two tables: `leaderboard` (public read, own-row write, holds *only* pseudo + best score — `progress` stays private, which is the privacy boundary) and `duels`. Two accepted limits documented in that file: **scores are client-reported and forgeable**, and an unaccepted duel is readable by any authenticated user, not just the link holder. Hardening either one without the other is wasted effort.

`window.history.replaceState` clears the `?duel=` param — write `window.history`, never bare `history`, since the conversation transcript already owns that name at module scope.

## Adding content

All learning content is plain `const` arrays near the top of the script block — no CMS, no fetch:

- [`SCENARIOS`](public/index.html#L682) — 15 role-plays as `{mode, id, icon, name, role, desc, persona, opening:{ar,latin,fr}}`. `persona` is the per-scenario system prompt and encodes a numbered conversational arc the model should advance through. `mode` is `'standard'` (11) or `'kids'` (4) and drives the tab filter plus extra gentle-feedback rules in `buildSystemPrompt()`; omitting it is safe — [line 918](public/index.html#L918) defaults it to `'standard'`.
- [`PHRASEBOOK`](public/index.html#L923) — **a tree, not a flat list.** A node either has `phrases` (a leaf, completable, keyed `phrasebook_<id>`) or `children` (a group, never completable itself — it only keeps the top level from sprawling). Currently 6 top-level cards, one of which groups the 5 number levels. Optional leaf fields: `note` (a construction rule shown as a highlighted block above the list — the number levels use it so the learner grasps the *system* instead of memorising; rendered via `innerHTML`, so `<strong>` is fine but it must stay author-written) and `advanced: true`.
  - `phrasebookLeaves()` flattens the tree; **`PHRASEBOOK_LEAVES` and `CORE_PHRASEBOOK` — not `PHRASEBOOK` — are what any progress computation must use**, since the tree contains non-completable groups. `CORE_PHRASEBOOK` drops the `advanced` leaves and is what the guided path's step 1 and the `b_all_phrasebook` badge count, so adding content can never lengthen the guided path or revoke an earned badge. The progress stat tile deliberately counts every leaf (`phrasebookDoneAll`), so the two numbers differ by design.
  - Navigation is driven by `phrasebookPath` (the array of nodes from root to current), the single source of truth: `renderPhrasebook(path)` shows a grid for a group and the phrase list for a leaf, and the breadcrumb is derived from the same path. The breadcrumb is the *only* way back up — there is no per-level back button — so any new nesting level works without extra wiring.
- **`alt: [...]` on a quiz item lists other correct answers.** Darija borrows from both standard Arabic and French, so several words often coexist for one thing (chat = *mouch* familier / *qett* de l'arabe standard; voiture = *ssiyara* / *tomobil*). The grader receives them as equally valid and is also told to accept unlisted regional variants; a wrong answer shows them, since discovering the alternatives is part of learning. **Do not extend this to `gradePronunciation()`** — there the learner is asked to pronounce *that specific word*, so a synonym is not a correct attempt.
- `QUIZ_BANKS` — three image banks (`debutant` / `intermediaire` / `avance`, ~54 items) plus `QUIZ_LEVELS` for the entry screen. A run draws `QUIZ_LENGTH` items at random from one bank, so consecutive runs differ; per-level records live in `tkellem_quizbest_<level>`. `renderQuizLevels()` is the only entry point — never call `startQuiz()` without a level id. `QUIZ_ITEMS` survives solely to feed the blitz question pool.
- A group with **`progressive: true`** opens its children one at a time: child *i* is locked until every earlier child is completed (`renderPhrasebookGrid`). "Expressions courantes" uses it for ten tiers of ten. The first tier deliberately keeps the old leaf id `expressions` so existing completions carry over — **when tiering an existing category, always keep the original id on tier 1**, or every user loses that progress.
- **Discussion libre**: `freeTalkScenario(topic)` builds a scenario object on the fly from what the learner types, so no persona is stored. It passes `forceRestart = true` because the topic changes between sessions and resuming an unrelated transcript would be nonsense.
- [`BADGES`](public/index.html#L1121) — each has a `check(completed, streak)` predicate evaluated against the ids in `tkellem_completed`
- [`ONBOARDING_SLIDES`](public/index.html#L2554) — shown once, gated by `tkellem_onboarding_done`
- `BASICS_SOUNDS` / `BASICS_WORDS` / `BASICS_SENTENCE` — the « Je débute » screen, for learners with no base at all. `BASICS_SOUNDS` is the arabizi decoder (`3`, `kh`, `gh`, `h`, `q`…) and is the point of the whole screen: the wall for a francophone beginner is reading `3achra`, not vocabulary. **It documents the convention this app actually uses**, so if a transliteration style ever changes, that table has to change with it. Reached as a non-blocking step 0 of the guided path — deliberately *not* a new home card, and deliberately finishable in ten minutes, which is what keeps it from becoming a course. It ends by launching the épicier scenario.

`buildPhraseRow(phrase, progressKey)` builds the standard listen + practice row and is shared by the phrasebook and « Je débute » — use it for any new phrase list and the pronunciation exercise comes along for free.

The guided path ([`renderProgress(true)`](public/index.html#L2482)) hard-codes a three-step gate: finish every phrasebook category → quiz → free scenarios. Its step conditions read `tkellem_completed` directly, so new content types need matching id prefixes to count.

## Conventions

- **Everything user-facing is French; comments in the source are French too.** Match that when editing.
- Darija is always carried as the triple `{ar, latin, fr}` — arabic script, arabizi transliteration, french gloss. Keep all three in sync; the UI and the TTS both depend on it (`speak()` falls back to `latin`).
- **Two icon systems, and the split is deliberate.** Structural chrome (navigation, listen/practice buttons, points star, streak, chevrons, section headers) uses the **inline SVG sprite** defined at the top of `<body>` — `<svg class="ic"><use href="#s-name"/></svg>`, sized by `.ic` / `.ic-lg` / `.ic-sm`, coloured by `currentColor`. Content identity (scenario cards, phrasebook category icons, badges, quiz items, avatars) stays **emoji via [`emojiImg()`](public/index.html#L1236)**, because a grocer and a taxi read better as pictures than as line icons. Adding a chrome icon means adding a `<g id="s-…">` to the sprite, not an emoji — every `emojiImg()` call is a separate CDN request.
- **A pinned control stays pinned only while it has something to do.** `.complete-btn` sticks above the tab bar so it's reachable in a long list, but gains `.acquired` once the category is learned — static, unfilled, a confirmation line rather than a dimmed button occupying the bottom of every screen. Apply the same rule to any future sticky CTA.
- **Pressable is the house gesture.** `.press` (plus `.press-z` / `.press-saf` / `.press-palm` / `.press-hen` for coloured grounds) gives a solid bottom edge via `box-shadow: 0 var(--edge) 0` and translates down on `:active`. Any new button should use it, or it will read as flat next to everything else.
- Design tokens live in `:root`: one role per colour (saffron = points/action, henna = streak/urgency, palm = success, zellige = structure), plus `--muted` / `--line` neutrals biased toward the teal, radii `--r-lg/md/sm`, and `--edge`. Prefer the tokens over the hardcoded neutrals that survive in older rules.
- `:root.kids-ui` amplifies sizes and saturation across the whole app, driven by the "Enfants" choice on the scenario screen and persisted in `tkellem_mode`. It's on the root element, not `.app`, so it also reaches the fixed tab bar.
- No framework: DOM built with template strings and `document.getElementById`, handlers assigned as `.onclick`.

## Gotchas

- **[public/index[1].html](public/index%5B1%5D.html) is a stale browser-download of an earlier prototype** (~32 KB vs ~113 KB): it still uses `webkitSpeechRecognition` and has no Supabase, phrasebook, quiz, or badges. Nothing links to it, but `express.static` still serves it. Never edit it, and don't mine it for "existing" patterns.
- `index.html` is a ~113 KB single file — prefer targeted `Edit` calls over rewriting it.
- Scenario transcripts persist per scenario; a code change to the `history` shape (`{role, ar, latin, fr}`) will break saved sessions already in users' `localStorage`.

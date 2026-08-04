const express = require('express');
const path = require('path');
const { Readable } = require('stream');

const app = express();
app.use(express.json({ limit: '8mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

// ---------------------------------------------------------------
// OPTIMISATION DES TOKENS (voir CLAUDE.md § Token cost strategy)
// Tout se désactive par variable d'environnement, sans toucher au
// code : TKELLEM_OPTIMIZE=off rétablit exactement la requête
// d'origine (Sonnet pour tout, sans cache, sans effort).
// ---------------------------------------------------------------
const OPTIMIZE      = process.env.TKELLEM_OPTIMIZE     !== 'off'; // interrupteur général
const LOG_USAGE     = process.env.TKELLEM_LOG_USAGE    !== 'off'; // levier 0 : journal des tokens
const USE_CACHE     = process.env.TKELLEM_CACHE        !== 'off'; // levier 1 : prompt caching
const USE_EFFORT    = process.env.TKELLEM_EFFORT       !== 'off'; // levier 2 : effort + thinking explicite
const CHEAP_MODELS  = process.env.TKELLEM_CHEAP_MODELS !== 'off'; // levier 3 : Haiku sur les tâches simples

const BASELINE_MODEL = 'claude-sonnet-4-6'; // modèle d'origine, seul utilisé si OPTIMIZE=off
const BASELINE_MAX_TOKENS = 1000;

// 'high' est le défaut du modèle ; 'medium' réduit la dépense sans casser le rôle-play.
// À passer à 'low' si la qualité tient sur tes scénarios.
const CHAT_EFFORT = ['low','medium','high','max'].includes(process.env.TKELLEM_CHAT_EFFORT)
  ? process.env.TKELLEM_CHAT_EFFORT
  : 'medium';

// Profil par tâche. Le client envoie {task}, JAMAIS un nom de modèle : une valeur
// inconnue retombe sur 'chat', donc rien venu du navigateur ne peut choisir un
// modèle hors de cette table (sinon n'importe qui pourrait faire facturer le
// compte sur le modèle le plus cher).
const TASK_PROFILES = {
  chat:      { model: BASELINE_MODEL,     maxTokens: 1000, effort: CHAT_EFFORT, cache: true  },
  hint:      { model: 'claude-haiku-4-5', maxTokens: 300,  effort: 'low',       cache: false },
  translate: { model: 'claude-haiku-4-5', maxTokens: 300,  effort: 'low',       cache: false },
  quiz:      { model: 'claude-haiku-4-5', maxTokens: 200,  effort: 'low',       cache: false },
  pron:      { model: 'claude-haiku-4-5', maxTokens: 250,  effort: 'low',       cache: false }
};

// Sonnet 4.6 accepte thinking + effort ; Haiku 4.5 renvoie une erreur 400 si on les
// envoie. On ne les ajoute donc que pour les modèles listés ici.
const MODELS_WITH_EFFORT = ['claude-sonnet-4-6'];

// hasOwn et pas TASK_PROFILES[task] : sinon task='constructor' remonterait une
// propriété héritée d'Object.prototype et fabriquerait un profil bancal.
function resolveTask(task){
  return Object.hasOwn(TASK_PROFILES, task) ? task : 'chat';
}

function buildChatPayload({ system, messages, task }){
  if(!OPTIMIZE){
    return { model: BASELINE_MODEL, max_tokens: BASELINE_MAX_TOKENS, system, messages };
  }
  const profile = TASK_PROFILES[resolveTask(task)];
  const model = CHEAP_MODELS ? profile.model : BASELINE_MODEL;
  const payload = { model, max_tokens: profile.maxTokens, system, messages };

  if(USE_EFFORT && MODELS_WITH_EFFORT.includes(model)){
    payload.thinking = { type: 'disabled' };           // déjà le défaut, rendu explicite
    payload.output_config = { effort: profile.effort }; // sans ça le modèle part sur 'high'
  }
  // Le cache ne paie que là où un long préfixe identique est renvoyé à chaque tour.
  if(USE_CACHE && profile.cache){
    payload.cache_control = { type: 'ephemeral' };
  }
  return payload;
}

// cache_read qui monte au fil des tours = le cache fonctionne. Bloqué à 0 = soit un
// octet du préfixe change d'une requête à l'autre, soit le préfixe est encore sous
// le minimum cachable (1024 tokens sur Sonnet 4.6).
function logUsage(task, model, usage){
  if(!LOG_USAGE || !usage) return;
  // resolveTask : on ne recopie jamais la valeur brute du client dans les logs
  console.log(`[tokens] ${resolveTask(task)} ${model}`
    + ` in=${usage.input_tokens}`
    + ` cache_read=${usage.cache_read_input_tokens || 0}`
    + ` cache_write=${usage.cache_creation_input_tokens || 0}`
    + ` out=${usage.output_tokens}`);
}

// ---------------------------------------------------------------
// LATENCE DE LA VOIX (ElevenLabs)
// multilingual_v2 génère tout le fichier avant de répondre, d'où 1,5 à
// 2,5 s d'attente. Les modèles "flash" sont conçus pour le temps réel.
// ELEVENLABS_TTS_MODEL=eleven_multilingual_v2 rétablit l'ancien modèle
// si la qualité de voix te paraît en baisse.
// ---------------------------------------------------------------
const TTS_MODEL = process.env.ELEVENLABS_TTS_MODEL || 'eleven_flash_v2_5';

// ---------------------------------------------------------------
// Conversation avec l'avatar (Claude)
// ---------------------------------------------------------------
app.post('/api/chat', async (req, res) => {
  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY n'est pas configurée sur le serveur." });
  }
  try {
    const { system, messages, task } = req.body;
    const payload = buildChatPayload({ system, messages, task });
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(payload)
    });
    const data = await r.json();
    if (!r.ok) {
      console.error('Erreur Anthropic:', data);
      return res.status(r.status).json(data);
    }
    logUsage(task, payload.model, data.usage);
    res.json(data);
  } catch (err) {
    console.error('Erreur /api/chat:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------
// Liste des voix ElevenLabs disponibles sur le compte configuré
// ---------------------------------------------------------------
app.get('/api/voices', async (req, res) => {
  if (!ELEVENLABS_API_KEY) {
    return res.json({ voices: [] });
  }
  try {
    const r = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: { 'xi-api-key': ELEVENLABS_API_KEY }
    });
    const data = await r.json();
    res.json(data);
  } catch (err) {
    console.error('Erreur /api/voices:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------
// Transcription vocale (ElevenLabs Speech-to-Text) — reçoit l'audio
// enregistré par le téléphone et renvoie le texte transcrit
// ---------------------------------------------------------------
app.post('/api/transcribe', async (req, res) => {
  if (!ELEVENLABS_API_KEY) {
    return res.status(400).json({ error: "ELEVENLABS_API_KEY n'est pas configurée sur le serveur." });
  }
  try {
    const { audio_base64, mime_type } = req.body;
    if (!audio_base64) {
      return res.status(400).json({ error: 'audio_base64 est requis.' });
    }
    const buffer = Buffer.from(audio_base64, 'base64');
    const blob = new Blob([buffer], { type: mime_type || 'audio/webm' });
    const form = new FormData();
    form.append('file', blob, 'audio.webm');
    form.append('model_id', 'scribe_v2');
    form.append('language_code', 'ar');

    const r = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: { 'xi-api-key': ELEVENLABS_API_KEY },
      body: form
    });
    const data = await r.json();
    if (!r.ok) {
      console.error('Erreur ElevenLabs STT:', data);
      return res.status(r.status).json(data);
    }
    res.json({ text: data.text || '' });
  } catch (err) {
    console.error('Erreur /api/transcribe:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------
// Synthèse vocale (ElevenLabs) — renvoie un flux audio mp3
// ---------------------------------------------------------------
app.post('/api/speak', async (req, res) => {
  if (!ELEVENLABS_API_KEY) {
    return res.status(400).json({ error: "ELEVENLABS_API_KEY n'est pas configurée sur le serveur." });
  }
  try {
    const { text, voice_id } = req.body;
    if (!text || !voice_id) {
      return res.status(400).json({ error: 'text et voice_id sont requis.' });
    }
    // endpoint /stream : ElevenLabs renvoie l'audio au fur et à mesure qu'il le
    // génère, au lieu d'attendre le fichier complet
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice_id}/stream`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        text,
        model_id: TTS_MODEL,
        voice_settings: { stability: 0.45, similarity_boost: 0.8 }
      })
    });
    if (!r.ok) {
      const errText = await r.text();
      console.error('Erreur ElevenLabs:', errText);
      return res.status(r.status).send(errText);
    }
    // on réémet le flux au lieu de le bufferiser : les deux transferts
    // (ElevenLabs→serveur et serveur→navigateur) se chevauchent
    res.set('Content-Type', 'audio/mpeg');
    const audioStream = Readable.fromWeb(r.body);
    audioStream.on('error', (err) => {
      console.error('Erreur flux ElevenLabs:', err); // en-têtes déjà envoyés, on coupe
      res.end();
    });
    audioStream.pipe(res);
  } catch (err) {
    console.error('Erreur /api/speak:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Tkellem backend démarré sur le port ' + PORT));

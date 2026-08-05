const express = require('express');
const path = require('path');
const crypto = require('crypto');
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
// Deux modèles, deux usages. Le cache partagé change l'arbitrage : une phrase du
// carnet n'est générée qu'une fois pour tous, donc la lenteur du modèle de qualité
// ne coûte qu'au premier auditeur — autant prendre le meilleur. En conversation en
// revanche, chaque réponse est unique et jamais réutilisée : là, le rythme primer.
const TTS_MODEL = process.env.ELEVENLABS_TTS_MODEL || 'eleven_multilingual_v2';
const TTS_MODEL_FAST = process.env.ELEVENLABS_TTS_MODEL_FAST || 'eleven_flash_v2_5';

// ---------------------------------------------------------------
// STOCK D'AUDIO PARTAGÉ (Supabase Storage)
// Le contenu fixe de l'app — carnet, grammaire, « Je débute » — ne change jamais,
// mais était régénéré pour chaque utilisateur et à chaque rechargement. On le
// génère désormais UNE fois pour tout le monde : le coût de la voix pour ce
// contenu devient un paiement unique au lieu de croître avec le nombre d'usagers.
// Inactif tant que SUPABASE_URL et SUPABASE_SERVICE_KEY ne sont pas renseignés :
// l'app se comporte alors exactement comme avant.
// ---------------------------------------------------------------
const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const TTS_BUCKET = process.env.TTS_BUCKET || 'tts';
const TTS_CACHE = process.env.TKELLEM_TTS_CACHE !== 'off'
  && !!(SUPABASE_URL && SUPABASE_SERVICE_KEY);

// Le modèle entre dans la clé : changer ELEVENLABS_TTS_MODEL régénère au lieu de
// servir l'ancienne voix. Le navigateur calcule la même empreinte de son côté.
// Seul le contenu d'apprentissage est mis en stock, donc seul TTS_MODEL y figure.
function ttsKey(voiceId, text){
  const hex = crypto.createHash('sha1').update(TTS_MODEL + '|' + text, 'utf8').digest('hex');
  return `${voiceId}/${hex}.mp3`;
}

function ttsPublicBase(){
  return `${SUPABASE_URL}/storage/v1/object/public/${TTS_BUCKET}`;
}

async function putTtsCache(key, buffer){
  try{
    const r = await fetch(`${SUPABASE_URL}/storage/v1/object/${TTS_BUCKET}/${key}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY,
        'Content-Type': 'audio/mpeg',
        'x-upsert': 'true',
        'Cache-Control': 'public, max-age=31536000, immutable'
      },
      body: buffer
    });
    if(!r.ok) console.warn('Stock audio : dépôt refusé', r.status, (await r.text()).slice(0, 200));
  }catch(err){
    console.warn('Stock audio indisponible :', err.message); // jamais bloquant
  }
}

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
    // On profite de cet appel, déjà fait au démarrage, pour dire au navigateur où
    // chercher l'audio déjà généré. Sans ça il ne peut pas calculer la même clé.
    res.json({
      ...data,
      tts_cache: TTS_CACHE ? { base: ttsPublicBase(), prefix: TTS_MODEL } : null
    });
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
    const { text, voice_id, quality } = req.body;
    if (!text || !voice_id) {
      return res.status(400).json({ error: 'text et voice_id sont requis.' });
    }
    // 'fast' = audio de conversation : unique, jamais réutilisé, donc ni qualité
    // maximale ni mise en stock. Tout le reste est du contenu d'apprentissage.
    const fast = quality === 'fast';
    const model = fast ? TTS_MODEL_FAST : TTS_MODEL;
    const cacheable = TTS_CACHE && !fast;
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
        model_id: model,
        voice_settings: { stability: 0.45, similarity_boost: 0.8 }
      })
    });
    if (!r.ok) {
      const errText = await r.text();
      console.error('Erreur ElevenLabs:', errText);
      return res.status(r.status).send(errText);
    }
    res.set('Content-Type', 'audio/mpeg');

    if(cacheable){
      // On garde l'audio en mémoire le temps de le renvoyer ET de le déposer dans le
      // stock partagé. C'est la seule génération que ce texte coûtera, jamais plus.
      const buffer = Buffer.from(await r.arrayBuffer());
      res.send(buffer);
      putTtsCache(ttsKey(voice_id, text), buffer); // en tâche de fond, sans attendre
      return;
    }

    // sans stock partagé : on réémet le flux, les deux transferts se chevauchent
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

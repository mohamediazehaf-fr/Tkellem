const express = require('express');
const path = require('path');
const crypto = require('crypto');
const { Readable } = require('stream');

const app = express();
app.set('trust proxy', true); // Render place un proxy devant : sans ça toutes les IP sont identiques
app.use(express.json({ limit: '8mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// La racine sert la page de présentation, indexable par Google ; l'app vit sur /app.
// Une adresse propre sans .html : c'est celle qu'on partage et qu'on référence.
app.get('/app', (req, res) => res.sendFile(path.join(__dirname, 'public', 'app.html')));

// ---------------------------------------------------------------
// GARDE-FOU DE DÉBIT (par adresse IP, en mémoire)
// Ce n'est pas de l'anti-fraude : c'est le filet qui évite qu'un onglet laissé
// ouvert, un script maladroit ou un enfant qui garde le doigt sur le micro ne
// vide ton compte ElevenLabs en une nuit. Les plafonds sont volontairement très
// larges — un usage humain normal ne les approche pas.
// Compteurs en mémoire : remis à zéro à chaque redéploiement, et c'est très bien.
// ---------------------------------------------------------------
const RATE_LIMITS = {
  '/api/chat':       { max: Number(process.env.LIMIT_CHAT       || 300), windowMs: 3600000 },
  '/api/speak':      { max: Number(process.env.LIMIT_SPEAK      || 400), windowMs: 3600000 },
  '/api/transcribe': { max: Number(process.env.LIMIT_TRANSCRIBE || 300), windowMs: 3600000 }
};
const RATE_ENABLED = process.env.TKELLEM_RATE_LIMIT !== 'off';
const hits = new Map(); // "ip route" -> [horodatages]

function rateLimiter(req, res, next){
  const rule = RATE_LIMITS[req.path];
  if(!RATE_ENABLED || !rule) return next();
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip || 'inconnu';
  const key = ip + ' ' + req.path;
  const now = Date.now();
  const recent = (hits.get(key) || []).filter(t => now - t < rule.windowMs);
  if(recent.length >= rule.max){
    console.warn(`[quota] ${key} : ${recent.length} appels sur l'heure, refusé`);
    return res.status(429).json({
      error: "Beaucoup d'activité depuis ton appareil. Réessaie dans quelques minutes."
    });
  }
  recent.push(now);
  hits.set(key, recent);
  // ménage : sans ça la Map enfle indéfiniment au fil des visiteurs
  if(hits.size > 5000){
    for(const [k, v] of hits){
      if(!v.length || now - v[v.length - 1] > rule.windowMs) hits.delete(k);
    }
  }
  next();
}
app.use(rateLimiter);

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

// Modèle du rôle-play, réglable sans redéployer. Sonnet 5 est là pour une raison
// précise : il accepte les SORTIES STRUCTURÉES, où l'API impose elle-même le format
// de la réponse. Un JSON invalide devient alors impossible — on ne colmate plus.
// Repli immédiat en cas de souci : ANTHROPIC_CHAT_MODEL=claude-sonnet-4-6
const CHAT_MODEL = process.env.ANTHROPIC_CHAT_MODEL || 'claude-sonnet-5';
const STRUCTURED = process.env.TKELLEM_STRUCTURED !== 'off';

// Modèles capables d'imposer un schéma de sortie
const MODELS_WITH_SCHEMA = ['claude-sonnet-5', 'claude-opus-5', 'claude-haiku-4-5'];

// Champs à plat plutôt qu'un objet imbriqué pour le feedback : les schémas stricts
// n'aiment ni les types nullables ni l'imbrication. Une chaîne vide vaut « rien à dire ».
const AVATAR_SCHEMA = {
  type: 'object',
  properties: {
    darija_ar:      { type: 'string', description: "La réponse en darija, en alphabet arabe. Jamais un mot de français ici." },
    darija_latin:   { type: 'string', description: "La même réponse en alphabet latin (arabizi)." },
    french:         { type: 'string', description: "Traduction française naturelle de la réponse." },
    feedback:       { type: 'string', description: "Remarque pédagogique en français sur le dernier message de l'apprenant, 20 mots maximum. Chaîne vide si sa phrase était correcte — ne commente pas systématiquement." },
    feedback_ar:    { type: 'string', description: "La formulation correcte en alphabet arabe, ou chaîne vide s'il n'y a pas de remarque." },
    feedback_latin: { type: 'string', description: "La même formulation correcte en alphabet latin, ou chaîne vide." }
  },
  required: ['darija_ar', 'darija_latin', 'french', 'feedback', 'feedback_ar', 'feedback_latin'],
  additionalProperties: false
};

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
  chat:      { model: CHAT_MODEL,         maxTokens: 1000, effort: CHAT_EFFORT, cache: true,
               schema: AVATAR_SCHEMA },
  hint:      { model: 'claude-haiku-4-5', maxTokens: 300,  effort: 'low',       cache: false },
  translate: { model: 'claude-haiku-4-5', maxTokens: 300,  effort: 'low',       cache: false },
  quiz:      { model: 'claude-haiku-4-5', maxTokens: 200,  effort: 'low',       cache: false },
  pron:      { model: 'claude-haiku-4-5', maxTokens: 250,  effort: 'low',       cache: false }
};

// Sonnet 4.6 et Sonnet 5 acceptent thinking + effort ; Haiku 4.5 renvoie une erreur
// 400 si on les envoie. On ne les ajoute donc que pour les modèles listés ici.
// Pour Sonnet 5 le « thinking: disabled » n'est pas optionnel : sans lui, il active
// son raisonnement adaptatif par défaut et facture des tokens de réflexion à
// chaque tour, pour une tâche qui n'en a aucun besoin.
const MODELS_WITH_EFFORT = ['claude-sonnet-4-6', 'claude-sonnet-5'];

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
    payload.thinking = { type: 'disabled' };           // obligatoire sur Sonnet 5
    payload.output_config = { effort: profile.effort }; // sans ça le modèle part sur 'high'
  }
  // Schéma imposé par l'API : le modèle ne peut plus produire un JSON invalide.
  if(STRUCTURED && profile.schema && MODELS_WITH_SCHEMA.includes(model)){
    payload.output_config = {
      ...(payload.output_config || {}),
      format: { type: 'json_schema', schema: profile.schema }
    };
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
        'anthropic-version': '2023-06-01',
        // en-tête requis tant que les sorties structurées sont en bêta ; sans effet
        // si la fonctionnalité est passée en disponibilité générale
        ...(payload.output_config?.format ? { 'anthropic-beta': 'structured-outputs-2025-11-13' } : {})
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
      tts_cache: TTS_CACHE ? { base: ttsPublicBase(), prefix: TTS_MODEL } : null,
      // Voix souhaitée, réglable sans toucher au code. L'identifiant l'emporte sur
      // le nom : c'est le seul moyen sûr si deux voix portent un nom proche, ou si
      // la voix est renommée sur le compte.
      // Voix de référence de toute l'app : Ghizlane, native darija.
      voice_pref: {
        id: process.env.ELEVENLABS_VOICE_ID || null,
        name: process.env.ELEVENLABS_VOICE_NAME || 'ghizlane'
      }
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
app.listen(PORT, () => console.log('Beldi backend démarré sur le port ' + PORT));

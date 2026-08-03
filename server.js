const express = require('express');
const path = require('path');

const app = express();
app.use(express.json({ limit: '8mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

// ---------------------------------------------------------------
// Conversation avec l'avatar (Claude)
// ---------------------------------------------------------------
app.post('/api/chat', async (req, res) => {
  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY n'est pas configurée sur le serveur." });
  }
  try {
    const { system, messages } = req.body;
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system,
        messages
      })
    });
    const data = await r.json();
    if (!r.ok) {
      console.error('Erreur Anthropic:', data);
      return res.status(r.status).json(data);
    }
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
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.45, similarity_boost: 0.8 }
      })
    });
    if (!r.ok) {
      const errText = await r.text();
      console.error('Erreur ElevenLabs:', errText);
      return res.status(r.status).send(errText);
    }
    const buffer = Buffer.from(await r.arrayBuffer());
    res.set('Content-Type', 'audio/mpeg');
    res.send(buffer);
  } catch (err) {
    console.error('Erreur /api/speak:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Tkellem backend démarré sur le port ' + PORT));

// Vercel Serverless Function — ElevenLabs TTS Proxy
// Keeps ELEVENLABS_API_KEY safe on the server side
// POST /api/tts  { text: "..." }  → returns audio/mpeg stream

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Missing "text" in request body' });
  }

  // Limit text length to prevent abuse / huge API bills
  const MAX_CHARS = 15000;
  const trimmed = text.slice(0, MAX_CHARS);

  const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'RTFg9niKcgGLDwa3RFlz';
  const API_KEY = process.env.ELEVENLABS_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({ error: 'ElevenLabs API key not configured' });
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': API_KEY,
        },
        body: JSON.stringify({
          text: trimmed,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.6,
            similarity_boost: 0.8,
            style: 0.15,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('ElevenLabs error:', response.status, errText);
      return res.status(response.status).json({
        error: `ElevenLabs API error: ${response.status}`,
      });
    }

    // Stream the audio back to the client
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // cache 24h

    const reader = response.body.getReader();
    const push = async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(Buffer.from(value));
      }
      res.end();
    };

    await push();
  } catch (err) {
    console.error('TTS proxy error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

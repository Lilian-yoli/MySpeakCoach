import { createReadStream } from 'fs';
import { synthesize } from '../services/ttsService.js';
import { logger } from '../utils/logger.js';

const SUPPORTED_LANGS = new Set(['en', 'ja', 'ko', 'fr', 'es', 'de']);
const MAX_TEXT_LEN = 300;

export async function getTTS(req, res) {
  const { text, lang = 'en' } = req.query;

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ error: 'text is required' });
  }
  if (text.length > MAX_TEXT_LEN) {
    return res.status(400).json({ error: `text must be ≤ ${MAX_TEXT_LEN} characters` });
  }
  if (!SUPPORTED_LANGS.has(lang)) {
    return res.status(400).json({ error: `unsupported lang: ${lang}` });
  }

  try {
    const filePath = await synthesize(text.trim(), lang);
    res.set('Content-Type', 'audio/mpeg');
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    createReadStream(filePath).pipe(res);
  } catch (err) {
    logger.error('TTS', err.message);
    res.status(502).json({ error: 'TTS synthesis failed' });
  }
}

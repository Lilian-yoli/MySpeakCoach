import { createHash } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import { writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = join(__dirname, '../../tts-cache');

if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });

// Maps app lang codes → Google Translate TTS lang codes
const LANG_MAP = {
  en: 'en', ja: 'ja', ko: 'ko',
  fr: 'fr', es: 'es', de: 'de',
};

function cachePath(text, lang) {
  const key = createHash('sha256').update(`${lang}:${text}`).digest('hex');
  return join(CACHE_DIR, `${key}.mp3`);
}

/**
 * Returns the local path to an MP3 file for the given text+lang.
 * Fetches from Google Translate TTS on cache miss and saves to disk.
 */
export async function synthesize(text, lang = 'en') {
  const ttsLang = LANG_MAP[lang] ?? 'en';
  const file = cachePath(text, ttsLang);

  if (existsSync(file)) return file;

  const url =
    'https://translate.google.com/translate_tts' +
    `?ie=UTF-8&client=tw-ob&tl=${encodeURIComponent(ttsLang)}&q=${encodeURIComponent(text)}`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; MySpeak/1.0)',
      'Referer': 'https://translate.google.com/',
    },
  });

  if (!res.ok) throw new Error(`Google TTS returned ${res.status}`);

  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(file, buf);
  return file;
}

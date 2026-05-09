import { useState, useCallback } from 'react';

// Module-level singletons — survive component remounts
let _ttsInstance = null;
let _loadPromise = null;
let _audioCtx = null;
let _currentSource = null;
let _fetchPatched = false;

const KOKORO_MODEL_ID = 'onnx-community/Kokoro-82M-v1.0-ONNX';

const LANG_LOCALE = {
  en: 'en-US', ja: 'ja-JP', fr: 'fr-FR',
  ko: 'ko-KR', es: 'es-ES', de: 'de-DE',
};

/**
 * @huggingface/transformers deliberately omits Authorization headers in browser builds.
 * We patch window.fetch once to inject the token only for HuggingFace URLs.
 * VITE_HF_TOKEN must be set in .env.local (a HuggingFace read-only token).
 */
function patchFetchForHF() {
  if (_fetchPatched) return;
  _fetchPatched = true;

  const token = import.meta.env.VITE_HF_TOKEN;
  if (!token) return;

  const _orig = window.fetch.bind(window);
  window.fetch = function (input, init = {}) {
    const url = typeof input === 'string' ? input
      : input instanceof URL ? input.href
      : input?.url ?? '';
    if (url.includes('huggingface.co') || url.includes('hf.co')) {
      const headers = new Headers(init.headers ?? {});
      if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
      init = { ...init, headers };
    }
    return _orig(input, init);
  };
}

function getAudioContext() {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return _audioCtx;
}

function stopCurrent() {
  if (_currentSource) {
    try { _currentSource.stop(); } catch { /* already ended */ }
    _currentSource = null;
  }
}

async function ensureKokoro() {
  if (_ttsInstance) return _ttsInstance;
  if (!_loadPromise) {
    _loadPromise = (async () => {
      patchFetchForHF();
      const { KokoroTTS } = await import('kokoro-js');
      const tts = await KokoroTTS.from_pretrained(KOKORO_MODEL_ID, {
        dtype: 'q8',
        device: 'wasm',
      });
      _ttsInstance = tts;
      return tts;
    })().catch(err => {
      _loadPromise = null; // allow retry on next click
      throw err;
    });
  }
  return _loadPromise;
}

/**
 * TTS hook.
 * - English  → Kokoro neural TTS (lazy model load ~80 MB on first use)
 * - Other    → browser Web Speech API fallback
 *
 * ttsState: 'idle' | 'loading' | 'ready' | 'speaking' | 'error'
 *
 * Setup for English TTS:
 *   1. Go to https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX and accept the license
 *   2. Create a HuggingFace read token at https://huggingface.co/settings/tokens
 *   3. Add  VITE_HF_TOKEN=hf_xxxx  to .env.local in the project root
 */
export function useKokoroTTS() {
  const [ttsState, setTtsState] = useState(() => (_ttsInstance ? 'ready' : 'idle'));

  const speak = useCallback(async (text, lang = 'en') => {
    stopCurrent();

    if (lang !== 'en') {
      window.speechSynthesis?.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = LANG_LOCALE[lang] ?? 'en-US';
      utter.rate = ['ja', 'ko'].includes(lang) ? 0.8 : 0.9;
      window.speechSynthesis?.speak(utter);
      return;
    }

    try {
      if (!_ttsInstance) setTtsState('loading');
      const tts = await ensureKokoro();
      setTtsState('speaking');

      const result = await tts.generate(text, { voice: 'af_heart' });

      const ctx = getAudioContext();
      if (ctx.state === 'suspended') await ctx.resume();

      const buffer = ctx.createBuffer(1, result.audio.length, result.sampling_rate);
      buffer.copyToChannel(result.audio, 0);

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      _currentSource = source;
      source.onended = () => { _currentSource = null; setTtsState('ready'); };
      source.start();
    } catch (err) {
      console.error('[KokoroTTS]', err);
      setTtsState('error');
    }
  }, []);

  return { speak, ttsState };
}

import { useState, useCallback, useRef } from 'react';
import { API_BASE } from '../config.js';

export function useKokoroTTS() {
  const [ttsState, setTtsState] = useState('idle');
  const audioRef = useRef(null);

  const speak = useCallback((text, lang = 'en') => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const url = `${API_BASE}/tts?text=${encodeURIComponent(text)}&lang=${encodeURIComponent(lang)}`;
    const audio = new Audio(url);
    audioRef.current = audio;

    setTtsState('loading');

    audio.oncanplay = () => setTtsState('speaking');
    audio.onended = () => { setTtsState('idle'); audioRef.current = null; };
    audio.onerror = () => { setTtsState('error'); audioRef.current = null; };

    audio.play().catch(() => setTtsState('error'));
  }, []);

  return { speak, ttsState };
}

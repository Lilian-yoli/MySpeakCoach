import { useState, useCallback, useEffect } from 'react';
import { getAuthHeader } from './useAuth';
import { API_BASE } from '../config.js';
const STORAGE_KEY = 'myspeak_lang';

export function useLanguage() {
  const [registeredLangs, setRegisteredLangs] = useState([]);
  const [activeLang, setActiveLangState] = useState(
    () => localStorage.getItem(STORAGE_KEY) || 'en'
  );

  const setActiveLang = useCallback((code) => {
    localStorage.setItem(STORAGE_KEY, code);
    setActiveLangState(code);
  }, []);

  const loadLanguages = useCallback(async () => {
    try {
      const res  = await fetch(`${API_BASE}/languages`, { headers: getAuthHeader() });
      const json = await res.json();
      if (json.success) setRegisteredLangs(json.languages);
    } catch { /* silent — non-critical */ }
  }, []);

  const addLanguage = useCallback(async (code) => {
    const res  = await fetch(`${API_BASE}/languages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ language: code }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    setRegisteredLangs(prev => prev.includes(code) ? prev : [...prev, code]);
    setActiveLang(code);
  }, [setActiveLang]);

  const removeLanguage = useCallback(async (code) => {
    const res  = await fetch(`${API_BASE}/languages/${code}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    setRegisteredLangs(prev => prev.filter(l => l !== code));
    // if removed the active one, fall back to first remaining
    setActiveLangState(prev => {
      if (prev !== code) return prev;
      const remaining = registeredLangs.filter(l => l !== code);
      const next = remaining[0] || 'en';
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, [registeredLangs]);

  useEffect(() => { loadLanguages(); }, [loadLanguages]);

  return { registeredLangs, activeLang, setActiveLang, addLanguage, removeLanguage, loadLanguages };
}

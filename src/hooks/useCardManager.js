import { useState, useCallback } from 'react';
import { getAuthHeader } from './useAuth';

const API_BASE = 'http://localhost:3001/api';

function groupByOriginalText(cards) {
  const map = new Map();
  for (const card of cards) {
    if (!map.has(card.originalText)) map.set(card.originalText, []);
    map.get(card.originalText).push(card);
  }
  return Array.from(map.entries()).map(([originalText, cards]) => ({ originalText, cards }));
}

export function useCardManager(activeLang = 'en') {
  const [groups, setGroups] = useState([]);
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const loadCards = useCallback(async () => {
    setStatus('loading');
    setErrorMessage('');
    try {
      const res = await fetch(`${API_BASE}/cards?lang=${activeLang}`, { headers: getAuthHeader() });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed to load cards');
      setGroups(groupByOriginalText(json.data));
      setStatus('ready');
    } catch (err) {
      setErrorMessage(err.message);
      setStatus('error');
    }
  }, [activeLang]);

  const deleteGroup = useCallback(async (anyCardId, originalText) => {
    const res = await fetch(`${API_BASE}/cards/${anyCardId}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Delete failed');
    setGroups(prev => prev.filter(g => g.originalText !== originalText));
  }, []);

  const updateCard = useCallback(async (cardId, question, answer) => {
    const res = await fetch(`${API_BASE}/cards/${cardId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ question, answer }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Update failed');
    setGroups(prev =>
      prev.map(g => ({
        ...g,
        cards: g.cards.map(c => c.id === cardId ? { ...c, question, answer } : c),
      }))
    );
    return json.card;
  }, []);

  const addCards = useCallback(async (sentences) => {
    const res = await fetch(`${API_BASE}/cards/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ inputs: sentences, language: activeLang }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to create cards');
    return json.data;
  }, [activeLang]);

  const suggestSentences = useCallback(async (query) => {
    const res = await fetch(`${API_BASE}/cards/suggest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ query, language: activeLang }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to get suggestions');
    return json.suggestions;
  }, [activeLang]);

  const continueSentence = useCallback(async (sentence) => {
    const res = await fetch(`${API_BASE}/cards/continue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ sentence, language: activeLang }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to get continuations');
    return json.continuations;
  }, [activeLang]);

  const moveGroupLanguage = useCallback(async (originalText, language) => {
    const res = await fetch(`${API_BASE}/cards/group-language`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ originalText, language }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to move group');
    setGroups(prev => prev.filter(g => g.originalText !== originalText));
  }, []);

  return { groups, status, errorMessage, loadCards, deleteGroup, updateCard, addCards, suggestSentences, continueSentence, moveGroupLanguage };
}

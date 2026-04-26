import { useState, useCallback } from 'react';

const API_BASE = 'http://localhost:3001/api';

/**
 * 將卡片陣列依 originalText 分組，回傳 [{ originalText, cards[] }]
 */
function groupByOriginalText(cards) {
  const map = new Map();
  for (const card of cards) {
    if (!map.has(card.originalText)) map.set(card.originalText, []);
    map.get(card.originalText).push(card);
  }
  return Array.from(map.entries()).map(([originalText, cards]) => ({ originalText, cards }));
}

export function useCardManager() {
  const [groups, setGroups] = useState([]);
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'ready' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  const loadCards = useCallback(async () => {
    setStatus('loading');
    setErrorMessage('');
    try {
      const res = await fetch(`${API_BASE}/cards`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed to load cards');
      setGroups(groupByOriginalText(json.data));
      setStatus('ready');
    } catch (err) {
      setErrorMessage(err.message);
      setStatus('error');
    }
  }, []);

  // 傳入群組中任一張卡片的 id，後端會刪除同一 originalText 的整組
  const deleteGroup = useCallback(async (anyCardId, originalText) => {
    const res = await fetch(`${API_BASE}/cards/${anyCardId}`, { method: 'DELETE' });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Delete failed');

    setGroups(prev => prev.filter(g => g.originalText !== originalText));
  }, []);

  const updateCard = useCallback(async (cardId, question, answer) => {
    const res = await fetch(`${API_BASE}/cards/${cardId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, answer }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Update failed');

    setGroups(prev =>
      prev.map(g => ({
        ...g,
        cards: g.cards.map(c => c.id === cardId ? { ...c, question, answer } : c)
      }))
    );
    return json.card;
  }, []);

  const continueSentence = useCallback(async (sentence) => {
    const res = await fetch(`${API_BASE}/cards/continue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sentence }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to get continuations');
    return json.continuations;
  }, []);

  const suggestSentences = useCallback(async (query) => {
    const res = await fetch(`${API_BASE}/cards/suggest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to get suggestions');
    return json.suggestions;
  }, []);

  const addCards = useCallback(async (sentences) => {
    const res = await fetch(`${API_BASE}/cards/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputs: sentences }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to create cards');
    return json.data;
  }, []);

  return { groups, status, errorMessage, loadCards, deleteGroup, updateCard, addCards, suggestSentences, continueSentence };
}

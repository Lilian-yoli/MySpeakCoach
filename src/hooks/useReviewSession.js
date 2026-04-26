import { useState, useCallback } from 'react';

const API_BASE = 'http://localhost:3001/api';

const TYPE_ORDER = { CLOZE: 0, L1_PROMPT: 1, CONTEXT: 2 };
const sortByType = (cards) =>
  [...cards].sort((a, b) => (TYPE_ORDER[a.cardType] ?? 3) - (TYPE_ORDER[b.cardType] ?? 3));

/**
 * Hook that manages the SRS review session lifecycle:
 *  - fetch due cards from the backend
 *  - track current card index & answer state
 *  - submit review completion and advance to the next card
 */
export function useReviewSession() {
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'active' | 'revealed' | 'submitting' | 'finished' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  /** Fetch all due cards and start the session */
  const startSession = useCallback(async () => {
    setStatus('loading');
    setErrorMessage('');
    try {
      const res = await fetch(`${API_BASE}/cards/due`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed to load cards');

      if (json.data.length === 0) {
        setCards([]);
        setStatus('finished');
        return;
      }

      setCards(sortByType(json.data));
      setCurrentIndex(0);
      setStatus('active');
    } catch (err) {
      setErrorMessage(err.message);
      setStatus('error');
    }
  }, []);

  /** Reveal the answer for the current card */
  const revealAnswer = useCallback(() => {
    setStatus('revealed');
  }, []);

  /** Mark the current card as reviewed and advance */
  const markReviewed = useCallback(async () => {
    const card = cards[currentIndex];
    if (!card) return;

    setStatus('submitting');
    try {
      const res = await fetch(`${API_BASE}/cards/${card.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed to submit review');

      const next = currentIndex + 1;
      if (next >= cards.length) {
        setStatus('finished');
      } else {
        setCurrentIndex(next);
        setStatus('active');
      }
    } catch (err) {
      setErrorMessage(err.message);
      setStatus('error');
    }
  }, [cards, currentIndex]);

  /** Reset the whole session back to idle */
  const resetSession = useCallback(() => {
    setCards([]);
    setCurrentIndex(0);
    setStatus('idle');
    setErrorMessage('');
  }, []);

  const currentCard = cards[currentIndex] ?? null;
  const progress = cards.length > 0 ? ((currentIndex) / cards.length) * 100 : 0;

  return {
    cards,
    currentCard,
    currentIndex,
    totalCards: cards.length,
    progress,
    status,
    errorMessage,
    startSession,
    revealAnswer,
    markReviewed,
    resetSession,
  };
}

import { useState, useCallback } from 'react';

export function useSessionManager() {
  const [isActive, setIsActive] = useState(false);
  const [transcript, setTranscript] = useState([]);

  const startSession = useCallback(() => {
    setIsActive(true);
    setTranscript([]);
  }, []);

  const addTranscript = useCallback((role, text) => {
    setTranscript(prev => [...prev, { role, text }]);
  }, []);

  const endSession = useCallback(() => {
    setIsActive(false);
  }, []);

  return { isActive, transcript, startSession, addTranscript, endSession };
}

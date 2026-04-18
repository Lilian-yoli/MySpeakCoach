// src/hooks/useSessionManager.test.js
import { renderHook, act } from '@testing-library/react';
import { expect, test } from 'vitest';
import { useSessionManager } from './useSessionManager';

test('manages session state correctly', () => {
  const { result } = renderHook(() => useSessionManager());
  expect(result.current.isActive).toBe(false);
  expect(result.current.transcript).toEqual([]);

  act(() => {
    result.current.startSession();
  });
  expect(result.current.isActive).toBe(true);

  act(() => {
    result.current.addTranscript('user', 'Hello');
  });
  expect(result.current.transcript).toHaveLength(1);
  expect(result.current.transcript[0]).toEqual({ role: 'user', text: 'Hello' });

  act(() => {
    result.current.endSession();
  });
  expect(result.current.isActive).toBe(false);
});

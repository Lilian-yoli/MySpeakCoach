/**
 * Calculate the next review interval in days using Fibonacci sequence
 * @param {number} stage Current review stage (1-indexed)
 * @returns {number} Interval in days
 */
export const getFibonacciInterval = (stage) => {
  if (stage <= 0) return 1;
  const fib = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
  const index = stage - 1;
  if (index >= fib.length) return fib[fib.length - 1]; // Cap interval
  return fib[index];
};

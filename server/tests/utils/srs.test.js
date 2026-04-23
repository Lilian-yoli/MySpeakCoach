import { getFibonacciInterval } from '../../src/utils/srs.js';

describe('getFibonacciInterval', () => {
    test('returns correct intervals based on stage', () => {
        expect(getFibonacciInterval(1)).toBe(1);
        expect(getFibonacciInterval(2)).toBe(2);
        expect(getFibonacciInterval(3)).toBe(3);
        expect(getFibonacciInterval(4)).toBe(5);
        expect(getFibonacciInterval(5)).toBe(8);
        expect(getFibonacciInterval(6)).toBe(13);
        expect(getFibonacciInterval(15)).toBe(89); // cap test at the highest array element
    });
});

import { describe, it, expect } from 'vitest';
import { add, divide } from './calculator';

describe('calculator', () => {
  describe('add', () => {
    it('two numbers should be added correctly', () => {
      expect(add(1, 2)).toBe(3);
      expect(add(-1, -2)).toBe(-3);
      expect(add(0, 0)).toBe(0);
    });
  });

  describe('divide', () => {
    it('two numbers should be divided correctly', () => {
      expect(divide(6, 2)).toBe(3);
      expect(divide(10, 4)).toBe(2.5);
    });

    it('should throw an error when dividing by zero', () => {
      expect(() => divide(10, 0)).toThrow('Division by zero');
    });
  });
});

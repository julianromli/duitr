import { describe, it, expect } from 'vitest';
import { AITransactionService } from '@/services/aiTransactionService';

describe('AITransactionService - parseAmount', () => {
  const service = AITransactionService.getInstance();
  // Access private method via any type for testing
  const parseAmount = (amount: string | number) => (service as any).parseAmount(amount);

  describe('Number input', () => {
    it('should return number as-is', () => {
      expect(parseAmount(350000)).toBe(350000);
      expect(parseAmount(32000)).toBe(32000);
      expect(parseAmount(0)).toBe(0);
    });
  });

  describe('Format "ribu" with space', () => {
    it('should parse "350 ribu" correctly', () => {
      expect(parseAmount('350 ribu')).toBe(350000);
    });

    it('should parse "32 ribu" correctly', () => {
      expect(parseAmount('32 ribu')).toBe(32000);
    });

    it('should parse "10 ribu" correctly', () => {
      expect(parseAmount('10 ribu')).toBe(10000);
    });
  });

  describe('Format "ribu" without space', () => {
    it('should parse "350ribu" correctly', () => {
      expect(parseAmount('350ribu')).toBe(350000);
    });

    it('should parse "32ribu" correctly', () => {
      expect(parseAmount('32ribu')).toBe(32000);
    });
  });

  describe('Format "rb" (abbreviated)', () => {
    it('should parse "350rb" correctly', () => {
      expect(parseAmount('350rb')).toBe(350000);
    });

    it('should parse "30rb" correctly', () => {
      expect(parseAmount('30rb')).toBe(30000);
    });
  });

  describe('Format "k" (thousands)', () => {
    it('should parse "50k" correctly', () => {
      expect(parseAmount('50k')).toBe(50000);
    });

    it('should parse "10k" correctly', () => {
      expect(parseAmount('10k')).toBe(10000);
    });
  });

  describe('Format "juta" (millions)', () => {
    it('should parse "2 juta" correctly', () => {
      expect(parseAmount('2 juta')).toBe(2000000);
    });

    it('should parse "2.5 juta" correctly', () => {
      expect(parseAmount('2.5 juta')).toBe(2500000);
    });

    it('should parse "1.5jt" correctly', () => {
      expect(parseAmount('1.5jt')).toBe(1500000);
    });
  });

  describe('Plain numbers', () => {
    it('should parse "350" correctly', () => {
      expect(parseAmount('350')).toBe(350);
    });

    it('should parse "32000" correctly', () => {
      expect(parseAmount('32000')).toBe(32000);
    });
  });

  describe('Edge cases', () => {
    it('should handle "0" correctly', () => {
      expect(parseAmount('0')).toBe(0);
    });

    it('should handle empty string', () => {
      expect(parseAmount('')).toBe(0);
    });

    it('should handle invalid input', () => {
      expect(parseAmount('invalid')).toBe(0);
    });

    it('should handle mixed case "350 RIBU"', () => {
      expect(parseAmount('350 RIBU')).toBe(350000);
    });
  });

  describe('Bug fix verification', () => {
    it('should parse "350 ribu" as 350000 not 350 (original bug)', () => {
      const result = parseAmount('350 ribu');
      expect(result).toBe(350000);
      expect(result).not.toBe(350);
    });

    it('should parse "32 ribu" as 32000', () => {
      const result = parseAmount('32 ribu');
      expect(result).toBe(32000);
      expect(result).not.toBe(32);
    });
  });
});

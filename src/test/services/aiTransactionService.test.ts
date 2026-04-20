import { beforeEach, describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { AITransactionService } from '@/services/aiTransactionService';
import { getMockSupabaseFunctionInvoke } from '@/test/setup';

describe('AITransactionService - parseAmount', () => {
  const service = AITransactionService.getInstance();
  const parseAmount = (amount: string | number) => (service as unknown as { parseAmount: (value: string | number) => number }).parseAmount(amount);

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

describe('AITransactionService - parseTransactionInput', () => {
  const service = AITransactionService.getInstance();
  const mockInvoke = getMockSupabaseFunctionInvoke();

  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it('passes short category reasons through from the parser', async () => {
    mockInvoke.mockResolvedValue({
      data: {
        result: {
          success: true,
          message: 'Parsed successfully',
          transactions: [
            {
              description: 'Lunch',
              amount: '25rb',
              category: 'Dining',
              type: 'expense',
              confidence: 0.92,
              reason: 'Contains lunch keyword'
            },
            {
              description: 'Salary',
              amount: 5000000,
              category: 'Salary',
              type: 'income',
              confidence: 0.98,
              explanation: 'Matches salary income'
            }
          ]
        }
      },
      error: null
    });

    const result = await service.parseTransactionInput('lunch 25rb and salary');

    expect(result.success).toBe(true);
    expect(result.transactions).toHaveLength(2);
    expect(result.transactions[0]).toMatchObject({
      description: 'Lunch',
      amount: 25000,
      category: 'Dining',
      categoryId: 2,
      type: 'expense',
      confidence: 0.92,
      reason: 'Contains lunch keyword'
    });
    expect(result.transactions[1]).toMatchObject({
      description: 'Salary',
      amount: 5000000,
      category: 'Salary',
      categoryId: 13,
      type: 'income',
      confidence: 0.98,
      reason: 'Matches salary income'
    });
  });

  it('preserves zero confidence from the parser', async () => {
    mockInvoke.mockResolvedValue({
      data: {
        result: {
          success: true,
          message: 'Parsed successfully',
          transactions: [
            {
              description: 'Unknown charge',
              amount: 10000,
              category: 'Other',
              type: 'expense',
              confidence: 0,
            }
          ]
        }
      },
      error: null
    });

    const result = await service.parseTransactionInput('mystery charge 10k');

    expect(result.success).toBe(true);
    expect(result.transactions[0]).toMatchObject({
      description: 'Unknown charge',
      confidence: 0,
    });
  });

  it('records a correction hint when the user edits AI output', () => {
    service.recordCorrectionHint(
      {
        description: 'Grab ride',
        amount: 25000,
        category: 'Shopping',
        categoryId: 7,
        type: 'expense',
        confidence: 0.82,
        reason: 'Matched a generic shopping pattern'
      },
      {
        description: 'Grab ride to office',
        amount: 26000,
        category: 'Transportation',
        categoryId: 3,
        type: 'expense',
        confidence: 0.82,
        reason: 'Matched transportation keywords'
      }
    );

    const raw = window.localStorage.getItem('duitr.ai.transaction-correction-hints');
    expect(raw).not.toBeNull();

    const stored = JSON.parse(raw || '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({
      categoryFrom: 'Shopping',
      categoryTo: 'Transportation',
      amountFrom: 25000,
      amountTo: 26000,
      descriptionFrom: 'Grab ride',
      descriptionTo: 'Grab ride to office',
      typeFrom: 'expense',
      typeTo: 'expense'
    });
  });

  it('includes recent correction hints in parse requests', async () => {
    window.localStorage.setItem(
      'duitr.ai.transaction-correction-hints',
      JSON.stringify([
        {
          categoryFrom: 'Shopping',
          categoryTo: 'Transportation',
          amountFrom: 25000,
          amountTo: 26000,
          descriptionFrom: 'Grab ride',
          descriptionTo: 'Grab ride to office',
          typeFrom: 'expense',
          typeTo: 'expense',
          ts: Date.now()
        }
      ])
    );

    mockInvoke.mockResolvedValue({
      data: {
        result: {
          success: true,
          message: 'Parsed successfully',
          transactions: []
        }
      },
      error: null
    });

    await service.parseTransactionInput('grab to office');

    expect(mockInvoke).toHaveBeenCalledWith(
      'gemini-finance-insight',
      expect.objectContaining({
        body: expect.objectContaining({
          correctionHints: [
            expect.objectContaining({
              categoryFrom: 'Shopping',
              categoryTo: 'Transportation',
              amountFrom: 25000,
              amountTo: 26000,
              descriptionFrom: 'Grab ride',
              descriptionTo: 'Grab ride to office'
            })
          ]
        })
      })
    );
  });

  it('clears stored correction hints', () => {
    window.localStorage.setItem(
      'duitr.ai.transaction-correction-hints',
      JSON.stringify([
        {
          categoryFrom: 'Shopping',
          categoryTo: 'Transportation',
          amountFrom: 25000,
          amountTo: 26000,
          descriptionFrom: 'Grab ride',
          descriptionTo: 'Grab ride to office',
          typeFrom: 'expense',
          typeTo: 'expense',
          ts: Date.now()
        }
      ])
    );

    service.clearCorrectionHints();

    expect(window.localStorage.getItem('duitr.ai.transaction-correction-hints')).toBe('[]');
    expect(service.getRecentCorrectionHints()).toEqual([]);
  });

  it('documents that split-item inputs must return separate transaction rows', () => {
    const prompt = readFileSync('supabase/functions/gemini-finance-insight/index.ts', 'utf8');

    expect(prompt).toMatch(/typeof value !== 'string'/i);
    expect(prompt).toMatch(/Return one transaction object per item/i);
    expect(prompt).toMatch(/makan siang 25k dan parkir 10k/i);
    expect(prompt).toMatch(/belanja sabun 30k, minum 15k, ongkir 8k/i);
    expect(prompt).toMatch(/gaji 8 juta dan bonus 500 ribu/i);
    expect(prompt).toMatch(/description, amount, category, type, confidence, and reason/i);
  });
});

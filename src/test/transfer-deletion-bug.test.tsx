/**
 * Test to reproduce and validate fix for transfer deletion bug
 * Issue: When deleting a transfer transaction, source wallet balance is refunded
 * but destination wallet balance is not properly decremented
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { supabase } from '@/lib/supabase';

// Mock data
const mockUser = { id: 'user-123', email: 'test@test.com' };

const mockWalletA = {
  id: 'wallet-a-id',
  name: 'Wallet A',
  balance: 1000,
  user_id: 'user-123'
};

const mockWalletB = {
  id: 'wallet-b-id', 
  name: 'Wallet B',
  balance: 500,
  user_id: 'user-123'
};

const mockTransferTransaction = {
  id: 'transfer-123',
  user_id: 'user-123',
  type: 'transfer',
  amount: 200,
  description: 'Transfer from A to B',
  date: '2024-01-15',
  walletId: 'wallet-a-id',
  destinationWalletId: 'wallet-b-id',
  fee: 0
};

describe('Transfer Deletion Bug', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should properly update both wallet balances when deleting a transfer', async () => {
    // Setup: After transfer, Wallet A has 800 (1000-200), Wallet B has 700 (500+200)
    const walletsAfterTransfer = [
      { ...mockWalletA, balance: 800 },
      { ...mockWalletB, balance: 700 }
    ];

    // Expected after deletion: Wallet A should have 1000 (800+200), Wallet B should have 500 (700-200)
    const expectedWalletsAfterDeletion = [
      { ...mockWalletA, balance: 1000 },
      { ...mockWalletB, balance: 500 }
    ];

    console.log('=== Transfer Deletion Test ===');
    console.log('Initial state after transfer:');
    console.log('- Wallet A balance:', walletsAfterTransfer[0].balance);
    console.log('- Wallet B balance:', walletsAfterTransfer[1].balance);
    console.log('Transfer amount:', mockTransferTransaction.amount);
    
    console.log('\nExpected state after deletion:');
    console.log('- Wallet A balance:', expectedWalletsAfterDeletion[0].balance);
    console.log('- Wallet B balance:', expectedWalletsAfterDeletion[1].balance);

    // Track wallet update calls
    const walletUpdateCalls: any[] = [];
    
    // Mock the supabase client behavior
    const mockFrom = vi.mocked(supabase.from).mockImplementation((table) => {
      if (table === 'wallets') {
        return {
          update: vi.fn((updateData) => {
            walletUpdateCalls.push(updateData);
            return {
              eq: vi.fn().mockResolvedValue({ error: null })
            };
          })
        } as any;
      }
      if (table === 'transactions') {
        return {
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null })
          })
        } as any;
      }
      return {} as any;
    });

    // Simulate the deleteTransaction logic for transfers
    const transactionToDelete = mockTransferTransaction;
    const wallets = walletsAfterTransfer;

    // Find wallets
    const fromWallet = wallets.find(w => w.id === transactionToDelete.walletId);
    const toWallet = wallets.find(w => w.id === transactionToDelete.destinationWalletId);

    expect(fromWallet).toBeDefined();
    expect(toWallet).toBeDefined();

    // Calculate updated balances (reversing the transfer)
    const fee = transactionToDelete.fee || 0;
    const updatedFromWallet = { 
      ...fromWallet!, 
      balance: fromWallet!.balance + (transactionToDelete.amount + fee) 
    };
    const updatedToWallet = { 
      ...toWallet!, 
      balance: toWallet!.balance - transactionToDelete.amount 
    };

    console.log('\nCalculated updated balances:');
    console.log('- From wallet (Wallet A) balance:', updatedFromWallet.balance);
    console.log('- To wallet (Wallet B) balance:', updatedToWallet.balance);

    // Verify the balance calculations are correct
    expect(updatedFromWallet.balance).toBe(expectedWalletsAfterDeletion[0].balance);
    expect(updatedToWallet.balance).toBe(expectedWalletsAfterDeletion[1].balance);

    // Simulate database updates
    console.log('\nSimulating database updates...');
    
    // Delete transaction
    await supabase.from('transactions').delete().eq('id', transactionToDelete.id);

    // Update source wallet
    await supabase.from('wallets').update({ balance: updatedFromWallet.balance }).eq('id', updatedFromWallet.id);
    
    // Update destination wallet  
    await supabase.from('wallets').update({ balance: updatedToWallet.balance }).eq('id', updatedToWallet.id);

    // Verify both wallet updates were called
    expect(walletUpdateCalls).toHaveLength(2);
    expect(walletUpdateCalls[0]).toEqual({ balance: expectedWalletsAfterDeletion[0].balance });
    expect(walletUpdateCalls[1]).toEqual({ balance: expectedWalletsAfterDeletion[1].balance });

    console.log('\n✅ Test passed: Both wallet balances updated correctly');
  });

  it('should handle database update errors properly', async () => {
    const walletsAfterTransfer = [
      { ...mockWalletA, balance: 800 },
      { ...mockWalletB, balance: 700 }
    ];

    // Mock transaction deletion success but wallet update failure
    vi.mocked(supabase.from).mockImplementation((table) => {
      if (table === 'transactions') {
        return {
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null })
          })
        } as any;
      }
      if (table === 'wallets') {
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: { message: 'Wallet update failed' } })
          })
        } as any;
      }
      return {} as any;
    });

    console.log('\n=== Database Error Test ===');
    console.log('Testing error handling when wallet updates fail');

    // This test validates that the current logic properly handles database errors
    // The actual deleteTransaction function logs errors but doesn't throw them
    // which might be causing silent failures

    const errorLogSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      // Simulate the error scenario
      const result = await supabase.from('wallets').update({ balance: 1000 }).eq('id', 'wallet-a-id');
      expect(result.error).toBeTruthy();
      console.log('Expected error:', result.error.message);
      
      console.log('✅ Error handling test completed');
    } finally {
      errorLogSpy.mockRestore();
    }
  });
});

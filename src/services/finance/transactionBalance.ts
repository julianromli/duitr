import type { Transaction, Wallet } from '@/types/finance';

export interface WalletBalanceUpdate {
  id: string;
  balance: number;
}

export class TransactionValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TransactionValidationError';
  }
}

export function resolveCategoryId(transaction: Pick<Transaction, 'type' | 'categoryId'>): number {
  const categoryId = transaction.categoryId || 0;
  if (categoryId && categoryId !== 0) return categoryId;
  if (transaction.type === 'transfer') return 18;
  return transaction.type === 'income' ? 17 : 12;
}

export function computeWalletUpdatesForCreate(
  transaction: Omit<Transaction, 'id' | 'userId'>,
  wallets: Wallet[],
): WalletBalanceUpdate[] {
  if (transaction.type === 'transfer') {
    if (!transaction.destinationWalletId) {
      throw new TransactionValidationError('Destination wallet is missing.');
    }
    const fromWallet = wallets.find((w) => w.id === transaction.walletId);
    const toWallet = wallets.find((w) => w.id === transaction.destinationWalletId);
    if (!fromWallet || !toWallet) {
      throw new TransactionValidationError('One or both wallets not found.');
    }
    if (fromWallet.id === toWallet.id) {
      throw new TransactionValidationError('Cannot transfer to the same wallet.');
    }
    const fee = transaction.fee ?? 0;
    return [
      { id: fromWallet.id, balance: fromWallet.balance - (transaction.amount + fee) },
      { id: toWallet.id, balance: toWallet.balance + transaction.amount },
    ];
  }

  const wallet = wallets.find((w) => w.id === transaction.walletId);
  if (!wallet) {
    throw new TransactionValidationError('Wallet not found.');
  }
  const balance =
    transaction.type === 'income'
      ? wallet.balance + transaction.amount
      : wallet.balance - transaction.amount;
  return [{ id: wallet.id, balance }];
}

export function computeWalletUpdatesForDelete(
  transaction: Transaction,
  wallets: Wallet[],
): WalletBalanceUpdate[] {
  if (transaction.type === 'transfer') {
    const fromWallet = wallets.find((w) => w.id === transaction.walletId);
    if (!fromWallet) {
      throw new TransactionValidationError('Source wallet not found.');
    }
    const fee = transaction.fee ?? 0;
    const updates: WalletBalanceUpdate[] = [
      { id: fromWallet.id, balance: fromWallet.balance + (transaction.amount + fee) },
    ];
    if (transaction.destinationWalletId) {
      const toWallet = wallets.find((w) => w.id === transaction.destinationWalletId);
      if (toWallet) {
        updates.push({ id: toWallet.id, balance: toWallet.balance - transaction.amount });
      }
    }
    return updates;
  }

  const wallet = wallets.find((w) => w.id === transaction.walletId);
  if (!wallet) {
    throw new TransactionValidationError('Wallet not found.');
  }
  const balance =
    transaction.type === 'income'
      ? wallet.balance - transaction.amount
      : wallet.balance + transaction.amount;
  return [{ id: wallet.id, balance }];
}

export function computeWalletUpdatesForUpdate(
  oldTransaction: Transaction,
  updatedTransaction: Transaction,
  wallets: Wallet[],
): WalletBalanceUpdate[] {
  const balanceUpdates: { walletId: string; change: number }[] = [];

  if (oldTransaction.type === 'transfer') {
    const oldFee = oldTransaction.fee ?? 0;
    balanceUpdates.push({ walletId: oldTransaction.walletId, change: oldTransaction.amount + oldFee });
    if (oldTransaction.destinationWalletId) {
      balanceUpdates.push({ walletId: oldTransaction.destinationWalletId, change: -oldTransaction.amount });
    }
  } else if (oldTransaction.type === 'income') {
    balanceUpdates.push({ walletId: oldTransaction.walletId, change: -oldTransaction.amount });
  } else if (oldTransaction.type === 'expense') {
    balanceUpdates.push({ walletId: oldTransaction.walletId, change: oldTransaction.amount });
  }

  if (updatedTransaction.type === 'transfer') {
    if (!updatedTransaction.destinationWalletId) {
      throw new TransactionValidationError('Destination wallet missing for transfer.');
    }
    const newFee = updatedTransaction.fee ?? 0;
    balanceUpdates.push({
      walletId: updatedTransaction.walletId,
      change: -(updatedTransaction.amount + newFee),
    });
    balanceUpdates.push({
      walletId: updatedTransaction.destinationWalletId,
      change: updatedTransaction.amount,
    });
  } else if (updatedTransaction.type === 'income') {
    balanceUpdates.push({ walletId: updatedTransaction.walletId, change: updatedTransaction.amount });
  } else if (updatedTransaction.type === 'expense') {
    balanceUpdates.push({ walletId: updatedTransaction.walletId, change: -updatedTransaction.amount });
  }

  const netBalanceChanges = balanceUpdates.reduce(
    (acc, update) => {
      acc[update.walletId] = (acc[update.walletId] || 0) + update.change;
      return acc;
    },
    {} as Record<string, number>,
  );

  const updates: WalletBalanceUpdate[] = [];
  for (const walletId in netBalanceChanges) {
    const change = netBalanceChanges[walletId];
    if (change === 0) continue;
    const wallet = wallets.find((w) => w.id === walletId);
    if (!wallet) {
      throw new TransactionValidationError(`Wallet ${walletId} not found.`);
    }
    updates.push({ id: walletId, balance: wallet.balance + change });
  }
  return updates;
}

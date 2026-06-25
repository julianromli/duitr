export const financeQueryKeys = {
  all: (userId?: string) => ['finance', userId] as const,
  wallets: (userId?: string) => [...financeQueryKeys.all(userId), 'wallets'] as const,
  transactions: (userId?: string) => [...financeQueryKeys.all(userId), 'transactions'] as const,
  budgets: (userId?: string) => [...financeQueryKeys.all(userId), 'budgets'] as const,
  wantToBuy: (userId?: string) => [...financeQueryKeys.all(userId), 'wantToBuy'] as const,
  pinjaman: (userId?: string) => [...financeQueryKeys.all(userId), 'pinjaman'] as const,
};

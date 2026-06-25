import { useQueries } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useCategories } from '@/hooks/useCategories';
import budgetService from '@/services/budgetService';
import { financeQueryKeys } from '@/services/finance/queryKeys';
import pinjamanService from '@/services/pinjamanService';
import transactionService from '@/services/transactionService';
import walletService from '@/services/walletService';
import wantToBuyService from '@/services/wantToBuyService';
import type { Budget, PinjamanItem, Transaction, Wallet, WantToBuyItem } from '@/types/finance';

export function useFinanceQueries(userId?: string) {
  const { t, i18n } = useTranslation();
  const { categories } = useCategories();

  const results = useQueries({
    queries: [
      {
        queryKey: financeQueryKeys.wallets(userId),
        queryFn: () => walletService.getAll(userId!),
        enabled: !!userId,
        staleTime: 2 * 60 * 1000,
      },
      {
        queryKey: financeQueryKeys.transactions(userId),
        queryFn: () => transactionService.getAll(userId!),
        enabled: !!userId,
        staleTime: 2 * 60 * 1000,
      },
      {
        queryKey: [...financeQueryKeys.budgets(userId), i18n.language, categories.length],
        queryFn: () =>
          budgetService.getAll(userId!, {
            categories,
            language: i18n.language,
            translate: t,
          }),
        enabled: !!userId,
        staleTime: 3 * 60 * 1000,
      },
      {
        queryKey: financeQueryKeys.wantToBuy(userId),
        queryFn: () => wantToBuyService.getAll(userId!),
        enabled: !!userId,
        staleTime: 3 * 60 * 1000,
      },
      {
        queryKey: financeQueryKeys.pinjaman(userId),
        queryFn: () => pinjamanService.getAll(userId!),
        enabled: !!userId,
        staleTime: 3 * 60 * 1000,
      },
    ],
  });

  const [walletsQuery, transactionsQuery, budgetsQuery, wantToBuyQuery, pinjamanQuery] = results;

  const isLoading = !!userId && results.some((result) => result.isLoading);
  const isError = results.some((result) => result.isError);

  return {
    wallets: (walletsQuery.data ?? []) as Wallet[],
    transactions: (transactionsQuery.data ?? []) as Transaction[],
    budgets: (budgetsQuery.data ?? []) as Budget[],
    wantToBuyItems: (wantToBuyQuery.data ?? []) as WantToBuyItem[],
    pinjamanItems: (pinjamanQuery.data ?? []) as PinjamanItem[],
    isLoading,
    isError,
  };
}

/**
 * useBudgetPredictions Hook
 * 
 * React Query hook for budget prediction operations.
 * Provides caching, loading states, and mutation handling for predictions.
 * 
 * Features:
 * - Automatic 6-hour cache with React Query
 * - Manual refresh mutation
 * - Loading and error states
 * - Bilingual support
 * - Auto-refetch when budgets or transactions change
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  getOrGeneratePredictions,
  PredictionError,
  formatPrediction,
  getRiskColor,
  getRiskBackgroundColor,
  cleanupOldPredictions,
} from '@/services/predictionService';
import {
  PredictBudgetRequest,
  PredictBudgetResponse,
  BudgetPrediction,
  Budget,
  Transaction,
} from '@/types/finance';
import { supabase } from '@/lib/supabase';

/**
 * Hook options interface
 */
interface UseBudgetPredictionsOptions {
  /** Budgets to generate predictions for */
  budgets: Budget[];
  /** User's transaction history */
  transactions: Transaction[];
  /** Enable/disable automatic fetching */
  enabled?: boolean;
  /** Callback on successful prediction generation */
  onSuccess?: (response: PredictBudgetResponse) => void;
  /** Callback on prediction error */
  onError?: (error: PredictionError) => void;
}

/**
 * Hook return value interface
 */
interface UseBudgetPredictionsReturn {
  /** Prediction data */
  predictions: BudgetPrediction[] | undefined;
  /** Overall risk level */
  overallRisk: 'low' | 'medium' | 'high' | undefined;
  /** AI-generated summary */
  summary: string | undefined;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: PredictionError | null;
  /** Is data being fetched in background */
  isFetching: boolean;
  /** Refresh predictions (ignores cache) */
  refresh: () => Promise<void>;
  /** Is refresh mutation in progress */
  isRefreshing: boolean;
  /** Format a prediction for display */
  formatForDisplay: (prediction: BudgetPrediction) => ReturnType<typeof formatPrediction>;
  /** Get risk color class */
  getRiskColor: (risk: 'low' | 'medium' | 'high') => string;
  /** Get risk background color class */
  getRiskBackgroundColor: (risk: 'low' | 'medium' | 'high') => string;
  /** Cleanup old predictions */
  cleanup: () => Promise<void>;
}

/**
 * React Query hook for budget predictions
 * 
 * @example
 * ```tsx
 * function BudgetPredictions() {
 *   const { budgets } = useBudgets();
 *   const { transactions } = useTransactions();
 *   
 *   const {
 *     predictions,
 *     overallRisk,
 *     summary,
 *     isLoading,
 *     error,
 *     refresh,
 *   } = useBudgetPredictions({
 *     budgets,
 *     transactions,
 *   });
 *   
 *   if (isLoading) return <div>Loading predictions...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   
 *   return (
 *     <div>
 *       <h2>Risk Level: {overallRisk}</h2>
 *       <p>{summary}</p>
 *       {predictions.map(p => (
 *         <PredictionCard key={p.categoryId} prediction={p} />
 *       ))}
 *       <button onClick={refresh}>Refresh</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useBudgetPredictions({
  budgets,
  transactions,
  enabled = true,
  onSuccess,
  onError,
}: UseBudgetPredictionsOptions): UseBudgetPredictionsReturn {
  const { i18n } = useTranslation();
  const queryClient = useQueryClient();
  const language = i18n.language === 'en' ? 'en' : 'id';

  // Get current user ID
  const getCurrentUserId = async (): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  };

  /**
   * Transform budgets to prediction request format
   */
  const buildRequest = (): PredictBudgetRequest | null => {
    if (!budgets || budgets.length === 0) {
      return null;
    }

    return {
      budgets: budgets.map((budget) => ({
        categoryId: budget.categoryId,
        categoryName: `Category ${budget.categoryId}`, // Category name will be enriched in formatPrediction
        limit: budget.amount,
        period: 'monthly' as const,
      })),
      transactions: transactions || [],
      currentDate: new Date().toISOString(),
    };
  };

  /**
   * Query key that changes when budgets or transactions change
   * This triggers automatic refetch
   */
  const queryKey = [
    'budgetPredictions',
    budgets.length,
    transactions.length,
    language,
  ];

  /**
   * Main query for fetching predictions
   */
  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const userId = await getCurrentUserId();
      if (!userId) {
        throw new PredictionError(
          language === 'en' ? 'User not authenticated' : 'User belum terautentikasi',
          'AUTH_ERROR'
        );
      }

      const request = buildRequest();
      if (!request) {
        throw new PredictionError(
          language === 'en' ? 'No budgets available' : 'Tidak ada budget',
          'NO_BUDGETS'
        );
      }

      return getOrGeneratePredictions(request, userId, language);
    },
    enabled: enabled && budgets.length > 0,
    staleTime: 6 * 60 * 60 * 1000, // 6 hours - matches cache TTL
    gcTime: 24 * 60 * 60 * 1000, // 24 hours - keep in memory longer
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    onSuccess: (data) => {
      if (onSuccess) {
        onSuccess(data);
      }
    },
    onError: (error) => {
      const predictionError = error instanceof PredictionError
        ? error
        : new PredictionError(
            language === 'en' 
              ? 'Failed to fetch predictions' 
              : 'Gagal mengambil prediksi',
            'UNKNOWN_ERROR',
            error
          );
      
      if (onError) {
        onError(predictionError);
      }
    },
  });

  /**
   * Mutation for manual refresh (bypasses cache)
   */
  const refreshMutation = useMutation({
    mutationFn: async () => {
      const userId = await getCurrentUserId();
      if (!userId) {
        throw new PredictionError(
          language === 'en' ? 'User not authenticated' : 'User belum terautentikasi',
          'AUTH_ERROR'
        );
      }

      const request = buildRequest();
      if (!request) {
        throw new PredictionError(
          language === 'en' ? 'No budgets available' : 'Tidak ada budget',
          'NO_BUDGETS'
        );
      }

      // Force new prediction by passing request directly
      // This bypasses cache since we're not calling getOrGeneratePredictions
      const { predictBudgetOverrun, storePredictions } = await import('@/services/predictionService');
      
      const response = await predictBudgetOverrun(request, language);
      
      // Store new predictions
      const currentDate = new Date();
      const periodStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const periodEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      await storePredictions(userId, response.predictions, periodStart, periodEnd);
      
      return response;
    },
    onSuccess: (data) => {
      // Update query cache with new data
      queryClient.setQueryData(queryKey, data);
      
      if (onSuccess) {
        onSuccess(data);
      }
    },
    onError: (error) => {
      const predictionError = error instanceof PredictionError
        ? error
        : new PredictionError(
            language === 'en' 
              ? 'Failed to refresh predictions' 
              : 'Gagal merefresh prediksi',
            'UNKNOWN_ERROR',
            error
          );
      
      if (onError) {
        onError(predictionError);
      }
    },
  });

  /**
   * Mutation for cleanup
   */
  const cleanupMutation = useMutation({
    mutationFn: async () => {
      const userId = await getCurrentUserId();
      if (!userId) {
        throw new PredictionError(
          language === 'en' ? 'User not authenticated' : 'User belum terautentikasi',
          'AUTH_ERROR'
        );
      }
      
      return cleanupOldPredictions(userId);
    },
  });

  // Format prediction helper
  const formatForDisplay = (prediction: BudgetPrediction) => {
    return formatPrediction(prediction, language);
  };

  return {
    predictions: query.data?.predictions,
    overallRisk: query.data?.overallRisk,
    summary: query.data?.summary,
    isLoading: query.isLoading,
    error: query.error instanceof PredictionError ? query.error : null,
    isFetching: query.isFetching,
    refresh: async () => {
      await refreshMutation.mutateAsync();
    },
    isRefreshing: refreshMutation.isPending,
    formatForDisplay,
    getRiskColor,
    getRiskBackgroundColor,
    cleanup: async () => {
      await cleanupMutation.mutateAsync();
    },
  };
}

/**
 * Hook for getting a single category's prediction
 * 
 * @example
 * ```tsx
 * function CategoryPrediction({ categoryId }: { categoryId: number }) {
 *   const { prediction, isLoading } = useCategoryPrediction(categoryId);
 *   
 *   if (isLoading) return <div>Loading...</div>;
 *   if (!prediction) return <div>No prediction available</div>;
 *   
 *   return <PredictionCard prediction={prediction} />;
 * }
 * ```
 */
export function useCategoryPrediction(categoryId: number) {
  const { predictions, isLoading, error, ...rest } = useBudgetPredictions({
    budgets: [],
    transactions: [],
    enabled: false, // Don't auto-fetch, rely on main query
  });

  const prediction = predictions?.find((p) => p.categoryId === categoryId);

  return {
    prediction,
    isLoading,
    error,
    ...rest,
  };
}

/**
 * PredictionService
 * 
 * Service layer for budget prediction operations.
 * Integrates with Gemini Finance Insight Edge Function for AI-powered predictions.
 * 
 * Features:
 * - AI-powered budget overrun predictions
 * - 6-hour caching for performance optimization
 * - Risk level calculation and categorization
 * - Bilingual support (EN/ID)
 * - Database persistence for prediction history
 */

import { supabase } from '@/lib/supabase';
import {
  BudgetPrediction,
  PredictBudgetRequest,
  PredictBudgetResponse,
  StoredPrediction,
  RiskLevel,
} from '@/types/finance';

/**
 * Cache TTL for predictions (6 hours in milliseconds)
 */
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

/**
 * Error class for prediction-related errors
 */
export class PredictionError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'PredictionError';
  }
}

/**
 * Check if cached predictions are still valid (< 6 hours old)
 * 
 * @param predictions - Array of stored predictions to validate
 * @returns true if cache is valid, false otherwise
 */
export function isCacheValid(predictions: StoredPrediction[]): boolean {
  if (!predictions || predictions.length === 0) {
    return false;
  }

  // Check if the most recent prediction is within TTL
  const mostRecent = predictions[0];
  const createdAt = new Date(mostRecent.created_at);
  const now = new Date();
  const ageMs = now.getTime() - createdAt.getTime();

  return ageMs < CACHE_TTL_MS;
}

/**
 * Fetch cached predictions from database
 * Returns predictions that are less than 6 hours old for the specified categories.
 * 
 * @param userId - User ID to fetch predictions for
 * @param categoryIds - Optional array of category IDs to filter by
 * @returns Array of cached predictions or null if no valid cache exists
 */
export async function fetchCachedPredictions(
  userId: string,
  categoryIds?: number[]
): Promise<StoredPrediction[] | null> {
  try {
    // Calculate cache cutoff time (6 hours ago)
    const cacheCutoff = new Date(Date.now() - CACHE_TTL_MS);

    let query = supabase
      .from('budget_predictions')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', cacheCutoff.toISOString())
      .order('prediction_date', { ascending: false });

    // Filter by category IDs if provided
    if (categoryIds && categoryIds.length > 0) {
      query = query.in('category_id', categoryIds);
    }

    const { data, error } = await query;

    if (error) {
      throw new PredictionError(
        'Failed to fetch cached predictions',
        'CACHE_FETCH_ERROR',
        error
      );
    }

    // Validate cache is still fresh
    if (data && data.length > 0 && isCacheValid(data)) {
      return data;
    }

    return null;
  } catch (error) {
    if (error instanceof PredictionError) {
      throw error;
    }
    throw new PredictionError(
      'Unexpected error fetching cached predictions',
      'UNKNOWN_ERROR',
      error
    );
  }
}

/**
 * Call Gemini Finance Insight Edge Function to generate budget predictions
 * 
 * @param request - Budget prediction request with budgets and transactions
 * @param language - Language for AI response ('en' | 'id')
 * @returns AI-generated prediction response
 */
export async function predictBudgetOverrun(
  request: PredictBudgetRequest,
  language: 'en' | 'id' = 'id'
): Promise<PredictBudgetResponse> {
  try {
    // Validate request
    if (!request.budgets || request.budgets.length === 0) {
      throw new PredictionError(
        language === 'en' 
          ? 'No budgets provided for prediction' 
          : 'Tidak ada budget untuk diprediksi',
        'INVALID_REQUEST'
      );
    }

    if (!request.transactions || !Array.isArray(request.transactions)) {
      throw new PredictionError(
        language === 'en'
          ? 'Transaction data is required'
          : 'Data transaksi diperlukan',
        'INVALID_REQUEST'
      );
    }

    // Call edge function
    const { data, error } = await supabase.functions.invoke('gemini-finance-insight', {
      body: {
        action: 'predict_budget',
        budgets: request.budgets,
        transactions: request.transactions,
        currentDate: request.currentDate || new Date().toISOString(),
        language,
      },
    });

    if (error) {
      throw new PredictionError(
        language === 'en'
          ? 'Failed to generate predictions'
          : 'Gagal membuat prediksi',
        'EDGE_FUNCTION_ERROR',
        error
      );
    }

    if (!data || !data.result) {
      throw new PredictionError(
        language === 'en'
          ? 'Invalid response from prediction service'
          : 'Respons tidak valid dari layanan prediksi',
        'INVALID_RESPONSE'
      );
    }

    return data.result as PredictBudgetResponse;
  } catch (error) {
    if (error instanceof PredictionError) {
      throw error;
    }
    throw new PredictionError(
      language === 'en'
        ? 'Unexpected error during prediction'
        : 'Terjadi kesalahan saat membuat prediksi',
      'UNKNOWN_ERROR',
      error
    );
  }
}

/**
 * Store predictions in database for caching
 * 
 * @param userId - User ID who owns the predictions
 * @param predictions - Array of predictions to store
 * @param periodStart - Start date of the prediction period
 * @param periodEnd - End date of the prediction period
 */
export async function storePredictions(
  userId: string,
  predictions: BudgetPrediction[],
  periodStart: Date,
  periodEnd: Date
): Promise<void> {
  try {
    // Transform predictions to database format
    const dbPredictions = predictions.map((prediction) => ({
      user_id: userId,
      category_id: prediction.categoryId,
      prediction_date: new Date().toISOString().split('T')[0], // Today's date
      period_start: periodStart.toISOString().split('T')[0],
      period_end: periodEnd.toISOString().split('T')[0],
      current_spend: prediction.currentSpend,
      budget_limit: prediction.budgetLimit,
      projected_spend: prediction.projectedSpend,
      overrun_amount: prediction.overrunAmount,
      risk_level: prediction.riskLevel,
      confidence: prediction.confidence,
      days_remaining: prediction.daysRemaining,
      recommended_daily_limit: prediction.recommendedDailyLimit,
      insight: prediction.insight,
      seasonal_note: prediction.seasonalNote || null,
    }));

    // Insert predictions into database
    const { error } = await supabase
      .from('budget_predictions')
      .insert(dbPredictions);

    if (error) {
      throw new PredictionError(
        'Failed to store predictions in database',
        'STORAGE_ERROR',
        error
      );
    }
  } catch (error) {
    if (error instanceof PredictionError) {
      throw error;
    }
    throw new PredictionError(
      'Unexpected error storing predictions',
      'UNKNOWN_ERROR',
      error
    );
  }
}

/**
 * Smart function: Check cache first, generate new predictions if needed
 * This is the primary function to use for getting predictions.
 * 
 * @param request - Budget prediction request
 * @param userId - User ID
 * @param language - Language for AI response ('en' | 'id')
 * @returns Prediction response (from cache or freshly generated)
 */
export async function getOrGeneratePredictions(
  request: PredictBudgetRequest,
  userId: string,
  language: 'en' | 'id' = 'id'
): Promise<PredictBudgetResponse> {
  try {
    // Extract category IDs from budgets
    const categoryIds = request.budgets.map((b) => b.categoryId);

    // Check cache first
    const cachedPredictions = await fetchCachedPredictions(userId, categoryIds);

    if (cachedPredictions) {
      // Transform cached predictions to response format
      const predictions: BudgetPrediction[] = cachedPredictions.map((stored) => ({
        categoryId: stored.category_id!,
        categoryName: request.budgets.find((b) => b.categoryId === stored.category_id)?.categoryName || `Category ${stored.category_id}`,
        currentSpend: stored.current_spend,
        budgetLimit: stored.budget_limit,
        projectedSpend: stored.projected_spend,
        overrunAmount: stored.overrun_amount,
        riskLevel: stored.risk_level,
        confidence: stored.confidence || 0.5,
        daysRemaining: stored.days_remaining || 0,
        recommendedDailyLimit: stored.recommended_daily_limit || 0,
        insight: stored.insight || '',
        seasonalNote: stored.seasonal_note || undefined,
      }));

      // Calculate overall risk
      let overallRisk: RiskLevel = 'low';
      if (predictions.some((p) => p.riskLevel === 'high')) {
        overallRisk = 'high';
      } else if (predictions.some((p) => p.riskLevel === 'medium')) {
        overallRisk = 'medium';
      }

      // Generate summary
      const highRiskCount = predictions.filter((p) => p.riskLevel === 'high').length;
      const mediumRiskCount = predictions.filter((p) => p.riskLevel === 'medium').length;
      
      const summary = language === 'en'
        ? `Budget predictions (cached): ${highRiskCount} high risk, ${mediumRiskCount} medium risk categories.`
        : `Prediksi budget (dari cache): ${highRiskCount} kategori risiko tinggi, ${mediumRiskCount} kategori risiko sedang.`;

      return {
        predictions,
        overallRisk,
        summary,
      };
    }

    // No valid cache - generate new predictions
    const response = await predictBudgetOverrun(request, language);

    // Store predictions for future cache hits
    const currentDate = new Date(request.currentDate || Date.now());
    const periodStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const periodEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    await storePredictions(userId, response.predictions, periodStart, periodEnd);

    return response;
  } catch (error) {
    if (error instanceof PredictionError) {
      throw error;
    }
    throw new PredictionError(
      language === 'en'
        ? 'Failed to get or generate predictions'
        : 'Gagal mendapatkan atau membuat prediksi',
      'UNKNOWN_ERROR',
      error
    );
  }
}

/**
 * Get color for risk level display
 * 
 * @param risk - Risk level ('low' | 'medium' | 'high')
 * @returns CSS color class or value
 */
export function getRiskColor(risk: RiskLevel): string {
  switch (risk) {
    case 'low':
      return 'text-green-600';
    case 'medium':
      return 'text-yellow-600';
    case 'high':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
}

/**
 * Get background color for risk level display
 * 
 * @param risk - Risk level ('low' | 'medium' | 'high')
 * @returns CSS background color class
 */
export function getRiskBackgroundColor(risk: RiskLevel): string {
  switch (risk) {
    case 'low':
      return 'bg-green-100';
    case 'medium':
      return 'bg-yellow-100';
    case 'high':
      return 'bg-red-100';
    default:
      return 'bg-gray-100';
  }
}

/**
 * Format prediction for display
 * 
 * @param prediction - Budget prediction to format
 * @returns Formatted display object
 */
export interface FormattedPrediction {
  title: string;
  subtitle: string;
  percentage: number;
  progressColor: string;
  riskBadge: {
    text: string;
    color: string;
    bgColor: string;
  };
  recommendation: string;
  confidence: string;
}

export function formatPrediction(
  prediction: BudgetPrediction,
  language: 'en' | 'id' = 'id'
): FormattedPrediction {
  const percentage = prediction.budgetLimit > 0
    ? Math.round((prediction.projectedSpend / prediction.budgetLimit) * 100)
    : 0;

  // Determine progress color
  let progressColor = 'bg-green-500';
  if (percentage >= 100) {
    progressColor = 'bg-red-500';
  } else if (percentage >= 85) {
    progressColor = 'bg-yellow-500';
  }

  // Risk badge text
  const riskText = language === 'en'
    ? prediction.riskLevel.charAt(0).toUpperCase() + prediction.riskLevel.slice(1)
    : prediction.riskLevel === 'low'
    ? 'Rendah'
    : prediction.riskLevel === 'medium'
    ? 'Sedang'
    : 'Tinggi';

  // Confidence text
  const confidencePercent = Math.round(prediction.confidence * 100);
  const confidenceText = language === 'en'
    ? `${confidencePercent}% confidence`
    : `${confidencePercent}% keyakinan`;

  return {
    title: prediction.categoryName,
    subtitle: language === 'en'
      ? `Projected: Rp${prediction.projectedSpend.toLocaleString('id-ID')} / Rp${prediction.budgetLimit.toLocaleString('id-ID')}`
      : `Proyeksi: Rp${prediction.projectedSpend.toLocaleString('id-ID')} / Rp${prediction.budgetLimit.toLocaleString('id-ID')}`,
    percentage,
    progressColor,
    riskBadge: {
      text: riskText,
      color: getRiskColor(prediction.riskLevel),
      bgColor: getRiskBackgroundColor(prediction.riskLevel),
    },
    recommendation: prediction.insight,
    confidence: confidenceText,
  };
}

/**
 * Delete old predictions (older than 90 days)
 * Should be called periodically for cleanup
 * 
 * @param userId - Optional user ID to limit cleanup to specific user
 * @returns Number of deleted predictions
 */
export async function cleanupOldPredictions(userId?: string): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);

    let query = supabase
      .from('budget_predictions')
      .delete()
      .lt('created_at', cutoffDate.toISOString());

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { error, count } = await query;

    if (error) {
      throw new PredictionError(
        'Failed to cleanup old predictions',
        'CLEANUP_ERROR',
        error
      );
    }

    return count || 0;
  } catch (error) {
    if (error instanceof PredictionError) {
      throw error;
    }
    throw new PredictionError(
      'Unexpected error during cleanup',
      'UNKNOWN_ERROR',
      error
    );
  }
}

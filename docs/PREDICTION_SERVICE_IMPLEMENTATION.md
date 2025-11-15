# Budget Prediction Service Implementation

## Overview

Implemented TypeScript service layer for AI-powered budget predictions with React Query integration, 6-hour caching, and full type safety.

## Files Created

### 1. `src/types/finance.ts` (Updated)
Added prediction-related types:
- `RiskLevel` - Union type for risk levels
- `BudgetPrediction` - AI-generated prediction structure
- `PredictBudgetRequest` - Request format for edge function
- `PredictBudgetResponse` - Response from AI service
- `StoredPrediction` - Database schema mapping

### 2. `src/services/predictionService.ts` (New)
Core prediction service with comprehensive functionality:

#### Key Functions

**Cache Management:**
- `isCacheValid(predictions)` - Validate 6-hour cache freshness
- `fetchCachedPredictions(userId, categoryIds?)` - Get cached predictions from DB

**AI Integration:**
- `predictBudgetOverrun(request, language)` - Call Gemini edge function
- `storePredictions(userId, predictions, periodStart, periodEnd)` - Persist to DB

**Smart Orchestration:**
- `getOrGeneratePredictions(request, userId, language)` - Check cache first, generate if needed (PRIMARY FUNCTION)

**UI Helpers:**
- `getRiskColor(risk)` - Get Tailwind color class for risk level
- `getRiskBackgroundColor(risk)` - Get background color class
- `formatPrediction(prediction, language)` - Format for display with i18n

**Maintenance:**
- `cleanupOldPredictions(userId?)` - Delete predictions older than 90 days

#### Error Handling
- Custom `PredictionError` class with error codes
- User-friendly error messages in EN/ID
- Comprehensive try-catch blocks

### 3. `src/hooks/useBudgetPredictions.ts` (New)
React Query hook for prediction management:

#### Features
- **Auto-caching**: 6-hour staleTime matches cache TTL
- **Auto-refetch**: Query key includes budgets.length and transactions.length
- **Manual refresh**: `refresh()` bypasses cache and forces new AI call
- **Bilingual**: Respects i18n language setting
- **Loading states**: `isLoading`, `isFetching`, `isRefreshing`
- **Error handling**: Typed `PredictionError` responses

#### Return Values
```typescript
{
  predictions: BudgetPrediction[] | undefined;
  overallRisk: 'low' | 'medium' | 'high' | undefined;
  summary: string | undefined;
  isLoading: boolean;
  error: PredictionError | null;
  isFetching: boolean;
  refresh: () => Promise<void>;
  isRefreshing: boolean;
  formatForDisplay: (prediction) => FormattedPrediction;
  getRiskColor: (risk) => string;
  getRiskBackgroundColor: (risk) => string;
  cleanup: () => Promise<void>;
}
```

## Usage Examples

### Basic Usage
```typescript
import { useBudgetPredictions } from '@/hooks/useBudgetPredictions';
import { useBudgets } from '@/hooks/useBudgets';
import { useTransactions } from '@/hooks/useTransactions';

function BudgetPredictions() {
  const { budgets } = useBudgets();
  const { transactions } = useTransactions();
  
  const {
    predictions,
    overallRisk,
    summary,
    isLoading,
    error,
    refresh,
    formatForDisplay,
  } = useBudgetPredictions({
    budgets,
    transactions,
  });
  
  if (isLoading) return <Spinner />;
  if (error) return <Alert>{error.message}</Alert>;
  
  return (
    <div>
      <h2>Overall Risk: {overallRisk}</h2>
      <p>{summary}</p>
      
      {predictions?.map((prediction) => {
        const formatted = formatForDisplay(prediction);
        return (
          <Card key={prediction.categoryId}>
            <Badge className={formatted.riskBadge.bgColor}>
              {formatted.riskBadge.text}
            </Badge>
            <h3>{formatted.title}</h3>
            <p>{formatted.subtitle}</p>
            <Progress value={formatted.percentage} className={formatted.progressColor} />
            <p>{formatted.recommendation}</p>
            <small>{formatted.confidence}</small>
          </Card>
        );
      })}
      
      <Button onClick={refresh}>Refresh Predictions</Button>
    </div>
  );
}
```

### Direct Service Usage (Without Hook)
```typescript
import { getOrGeneratePredictions } from '@/services/predictionService';
import { supabase } from '@/lib/supabase';

async function generatePredictions() {
  const { data: { user } } = await supabase.auth.getUser();
  
  const request = {
    budgets: [
      { categoryId: 1, categoryName: 'Groceries', limit: 1000000, period: 'monthly' },
      { categoryId: 2, categoryName: 'Dining', limit: 500000, period: 'monthly' },
    ],
    transactions: [...], // User's expense transactions
    currentDate: new Date().toISOString(),
  };
  
  try {
    const response = await getOrGeneratePredictions(request, user!.id, 'id');
    console.log('Predictions:', response.predictions);
    console.log('Overall Risk:', response.overallRisk);
    console.log('Summary:', response.summary);
  } catch (error) {
    if (error instanceof PredictionError) {
      console.error('Prediction error:', error.message, error.code);
    }
  }
}
```

### Custom Options
```typescript
const {
  predictions,
  error,
  refresh,
} = useBudgetPredictions({
  budgets,
  transactions,
  enabled: budgets.length > 0, // Conditional fetching
  onSuccess: (response) => {
    console.log('Predictions loaded:', response);
    // Track analytics, show toast, etc.
  },
  onError: (error) => {
    console.error('Failed to load predictions:', error);
    // Show error notification
  },
});
```

## Architecture Flow

```
┌─────────────────────────────────────────────────────────┐
│  UI Component (useBudgetPredictions hook)              │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ├─ Query Key: [budgets.length, transactions.length]
                   │  (Auto-refetch when data changes)
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  getOrGeneratePredictions()                             │
│  (Smart orchestration layer)                            │
└──────────────┬──────────────────────┬───────────────────┘
               │                      │
               │ Check Cache          │ Cache Miss
               ▼                      ▼
   ┌─────────────────────┐  ┌──────────────────────────┐
   │ fetchCachedPredictions │  predictBudgetOverrun()    │
   │ (< 6 hours old)       │  (Call Gemini AI)         │
   └─────────────────────┘  └──────────┬───────────────┘
               │                       │
               │                       ▼
               │              ┌─────────────────────────┐
               │              │ storePredictions()       │
               │              │ (Cache for 6 hours)     │
               │              └─────────────────────────┘
               │                       │
               └───────────┬───────────┘
                           │
                           ▼
               ┌─────────────────────────────────────────┐
               │  Return PredictBudgetResponse           │
               │  - predictions[]                        │
               │  - overallRisk                          │
               │  - summary                              │
               └─────────────────────────────────────────┘
```

## Performance Characteristics

### Caching Strategy
- **First request**: Calls AI (2-5 seconds)
- **Subsequent requests** (< 6 hours): Returns cached data (< 100ms)
- **Manual refresh**: Always calls AI
- **Auto-refetch**: Triggered when budgets/transactions change

### React Query Configuration
```typescript
{
  staleTime: 6 * 60 * 60 * 1000,  // 6 hours - data considered fresh
  gcTime: 24 * 60 * 60 * 1000,    // 24 hours - keep in memory
  retry: 2,                        // Retry failed requests twice
  retryDelay: exponential,         // 1s, 2s, 4s...
}
```

## Error Codes

| Code | Description | User Action |
|------|-------------|-------------|
| `AUTH_ERROR` | User not authenticated | Re-login required |
| `INVALID_REQUEST` | Missing budgets/transactions | Check data availability |
| `EDGE_FUNCTION_ERROR` | AI service unavailable | Retry later |
| `INVALID_RESPONSE` | Malformed AI response | Contact support |
| `CACHE_FETCH_ERROR` | Database read failed | Check connection |
| `STORAGE_ERROR` | Database write failed | Check permissions |
| `NO_BUDGETS` | No budgets to predict | Create budgets first |
| `UNKNOWN_ERROR` | Unexpected error | Check logs |

## Type Safety

All functions fully typed with:
- Request/response interfaces
- Strict null checks
- Discriminated unions for risk levels
- Database schema mapping
- JSDoc comments on all exports

## Testing Checklist

- [ ] Type check passes: `bunx tsc --noEmit` ✅
- [ ] Cache hit returns data < 100ms
- [ ] Cache miss calls AI and stores result
- [ ] Manual refresh bypasses cache
- [ ] Error handling shows user-friendly messages
- [ ] Bilingual support (EN/ID)
- [ ] Auto-refetch on data changes
- [ ] Risk colors display correctly
- [ ] formatPrediction() outputs correct format

## Integration Requirements

### Prerequisites
1. ✅ Edge function deployed: `gemini-finance-insight`
2. ✅ Database table: `budget_predictions`
3. ✅ RLS policies enabled
4. ✅ React Query configured in app
5. ✅ i18next for translations

### Next Steps
1. Create UI components to display predictions
2. Add prediction cards to Dashboard
3. Implement prediction detail modal
4. Add refresh button with loading state
5. Set up periodic cleanup cron job (90 days)

## Related Files

- Edge function: `supabase/functions/gemini-finance-insight/index.ts`
- Database schema: `docs/BUDGET_PREDICTIONS_SCHEMA.md`
- Migration: `supabase/migrations/20251115_create_budget_predictions.sql`
- Budget service: `src/services/budgetService.ts`
- Transaction service: `src/services/transactionService.ts`

## Notes

- Service follows existing patterns from budgetService.ts and transactionService.ts
- Hook follows pattern from useBudgets.ts with React Query
- All user-facing text supports EN/ID via i18n
- TypeScript strict mode compatible
- No external dependencies beyond existing stack
- Full JSDoc documentation on all exports

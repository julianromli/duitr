# Budget Predictions Database Schema

## Overview

The `budget_predictions` table stores AI-generated budget predictions for performance caching and historical tracking. This table enables the application to:
- Cache expensive AI prediction computations
- Track prediction accuracy over time
- Provide quick access to recent predictions
- Analyze historical spending patterns

## Table Structure

### Primary Key
- **id**: UUID (auto-generated)

### Foreign Keys
- **user_id**: References `auth.users(id)` - Owner of the prediction (CASCADE DELETE)
- **category_id**: References `categories(category_id)` - Optional category filter (CASCADE DELETE)

### Prediction Timing
- **prediction_date**: DATE - When the prediction was generated (default: CURRENT_DATE)
- **period_start**: DATE - Start of the budget period being analyzed
- **period_end**: DATE - End of the budget period being analyzed

### Financial Data
- **current_spend**: NUMERIC(20,2) - Current spending at prediction time (≥ 0)
- **budget_limit**: NUMERIC(20,2) - Budget limit for the period (> 0)
- **projected_spend**: NUMERIC(20,2) - AI-predicted final spending amount (≥ 0)
- **overrun_amount**: NUMERIC(20,2) - Predicted amount over budget (default: 0)

### Risk Assessment
- **risk_level**: TEXT - Risk level: 'low', 'medium', or 'high'
- **confidence**: NUMERIC(3,2) - AI confidence score (0.0 to 1.0)

### Recommendations
- **days_remaining**: INTEGER - Days left in the budget period
- **recommended_daily_limit**: NUMERIC(20,2) - Suggested daily spending limit (≥ 0)

### AI Insights
- **insight**: TEXT - Human-readable AI-generated insight
- **seasonal_note**: TEXT - Optional note about seasonal patterns

### Timestamps
- **created_at**: TIMESTAMPTZ - Creation timestamp (auto-set)
- **updated_at**: TIMESTAMPTZ - Last update timestamp (auto-updated by trigger)

## Indexes

### Primary Lookup Index
```sql
idx_predictions_user_category_date (user_id, category_id, prediction_date DESC)
```
**Purpose**: Fast retrieval of user's predictions for a specific category, newest first  
**Query Pattern**: `SELECT * FROM budget_predictions WHERE user_id = ? AND category_id = ? ORDER BY prediction_date DESC`

### Cleanup Index
```sql
idx_predictions_created_at (created_at)
```
**Purpose**: Efficient deletion of old predictions  
**Query Pattern**: `DELETE FROM budget_predictions WHERE created_at < NOW() - INTERVAL '90 days'`

### Risk Filter Index (Partial)
```sql
idx_predictions_risk (user_id, risk_level) WHERE risk_level IN ('medium', 'high')
```
**Purpose**: Fast filtering of high-risk predictions for alerts  
**Query Pattern**: `SELECT * FROM budget_predictions WHERE user_id = ? AND risk_level IN ('medium', 'high')`

### Period Lookup Index
```sql
idx_predictions_period (user_id, period_end DESC)
```
**Purpose**: Quick access to current/future predictions  
**Query Pattern**: `SELECT * FROM budget_predictions WHERE user_id = ? AND period_end >= CURRENT_DATE`

## Row Level Security (RLS)

### Enabled
RLS is enabled on the `budget_predictions` table to ensure data isolation between users.

### Policies

1. **SELECT**: Users can view only their own predictions
   ```sql
   auth.uid() = user_id
   ```

2. **INSERT**: Users and service role can create predictions
   ```sql
   auth.uid() = user_id OR auth.role() = 'service_role'
   ```

3. **UPDATE**: Users can update only their own predictions
   ```sql
   auth.uid() = user_id
   ```

4. **DELETE**: Users can delete only their own predictions
   ```sql
   auth.uid() = user_id
   ```

## Functions

### cleanup_old_predictions()
**Purpose**: Delete predictions older than 90 days  
**Returns**: INTEGER - Count of deleted rows  
**Security**: DEFINER with search_path set to public  
**Usage**: Can be called manually or scheduled via cron

```sql
SELECT cleanup_old_predictions();
```

### update_prediction_timestamp()
**Purpose**: Automatically update `updated_at` on row modification  
**Trigger**: BEFORE UPDATE on budget_predictions  
**Usage**: Automatic (no manual invocation needed)

## Query Patterns

### Get Latest Prediction for a Category
```sql
SELECT * 
FROM budget_predictions 
WHERE user_id = $1 
  AND category_id = $2 
ORDER BY prediction_date DESC 
LIMIT 1;
```
**Performance**: Uses `idx_predictions_user_category_date`

### Get All High-Risk Predictions
```sql
SELECT * 
FROM budget_predictions 
WHERE user_id = $1 
  AND risk_level IN ('medium', 'high')
ORDER BY prediction_date DESC;
```
**Performance**: Uses `idx_predictions_risk` (partial index)

### Get Active Predictions (Current Period)
```sql
SELECT * 
FROM budget_predictions 
WHERE user_id = $1 
  AND period_end >= CURRENT_DATE
ORDER BY period_end ASC;
```
**Performance**: Uses `idx_predictions_period`

### Cache Check (Avoid Duplicate Predictions)
```sql
SELECT * 
FROM budget_predictions 
WHERE user_id = $1 
  AND category_id = $2 
  AND prediction_date = CURRENT_DATE
LIMIT 1;
```
**Performance**: Uses `idx_predictions_user_category_date`

### Cleanup Old Predictions
```sql
DELETE FROM budget_predictions 
WHERE created_at < NOW() - INTERVAL '90 days';
```
**Performance**: Uses `idx_predictions_created_at`

## Data Integrity

### Check Constraints
- `current_spend >= 0` - No negative spending
- `budget_limit > 0` - Budget must be positive
- `projected_spend >= 0` - No negative projections
- `risk_level IN ('low', 'medium', 'high')` - Valid risk levels only
- `confidence >= 0 AND confidence <= 1` - Valid confidence range
- `recommended_daily_limit >= 0` - No negative recommendations

### Foreign Key Constraints
- **CASCADE DELETE** on user deletion - All predictions deleted when user is deleted
- **CASCADE DELETE** on category deletion - Predictions deleted when category is removed

## Performance Characteristics

### Expected Query Performance
- User category lookups: **<10ms** (indexed)
- Risk-based filters: **<20ms** (partial index)
- Period-based queries: **<15ms** (indexed)
- Cleanup operations: **<50ms** (indexed on created_at)

### Storage Estimates
- Average row size: ~500 bytes
- 1,000 predictions: ~500 KB
- 10,000 predictions: ~5 MB
- 100,000 predictions: ~50 MB

With 90-day auto-cleanup, typical users will have 10-100 predictions stored.

## Migration

**File**: `supabase/migrations/20251115_create_budget_predictions.sql`

**Rollback**:
```sql
DROP TRIGGER IF EXISTS set_prediction_timestamp ON public.budget_predictions;
DROP FUNCTION IF EXISTS public.update_prediction_timestamp();
DROP FUNCTION IF EXISTS public.cleanup_old_predictions();
DROP TABLE IF EXISTS public.budget_predictions CASCADE;
```

## Integration Notes

### Service Layer
Create a `PredictionService` to handle:
- Caching logic (check before calling AI)
- Cleanup scheduling
- Prediction retrieval
- Risk aggregation

### TypeScript Types
```typescript
export interface BudgetPrediction {
  id: string;
  user_id: string;
  category_id: number | null;
  prediction_date: string;
  period_start: string;
  period_end: string;
  current_spend: number;
  budget_limit: number;
  projected_spend: number;
  overrun_amount: number;
  risk_level: 'low' | 'medium' | 'high';
  confidence: number | null;
  days_remaining: number | null;
  recommended_daily_limit: number | null;
  insight: string | null;
  seasonal_note: string | null;
  created_at: string;
  updated_at: string;
}
```

### React Query Hook Example
```typescript
export function useBudgetPrediction(categoryId: number) {
  return useQuery({
    queryKey: ['prediction', categoryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_predictions')
        .select('*')
        .eq('category_id', categoryId)
        .order('prediction_date', { ascending: false })
        .limit(1)
        .single();
      
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
```

## Maintenance

### Scheduled Cleanup
Set up a daily cron job to clean old predictions:
```sql
-- Supabase Edge Function or pg_cron
SELECT cron.schedule(
  'cleanup-predictions',
  '0 2 * * *', -- 2 AM daily
  $$SELECT cleanup_old_predictions()$$
);
```

### Monitoring
Track:
- Table size growth
- Query performance (pg_stat_statements)
- Cache hit rate (predictions reused vs new AI calls)
- Average confidence scores

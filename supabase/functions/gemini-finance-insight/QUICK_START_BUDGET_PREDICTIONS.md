# Quick Start: Budget Predictions API

## Basic Usage

### 1. Simple Request
```typescript
const { data, error } = await supabase.functions.invoke('gemini-finance-insight', {
  body: {
    action: 'predict_budget',
    language: 'id',  // or 'en'
    budgets: [
      {
        categoryId: 1,
        categoryName: 'Dining',
        limit: 1000000,
        period: 'monthly'
      }
    ],
    transactions: [
      {
        categoryId: 1,
        amount: 250000,
        date: '2024-01-15T10:00:00Z',
        type: 'expense'
      },
      {
        categoryId: 1,
        amount: 180000,
        date: '2024-01-18T14:30:00Z',
        type: 'expense'
      }
    ],
    currentDate: new Date().toISOString()
  }
});

const { predictions, overallRisk, summary } = data.result;
```

### 2. Response Structure
```typescript
{
  "result": {
    "predictions": [
      {
        "categoryId": 1,
        "categoryName": "Dining",
        "currentSpend": 430000,
        "budgetLimit": 1000000,
        "projectedSpend": 696774,  // Based on velocity
        "overrunAmount": 0,
        "riskLevel": "low",
        "confidence": 0.7,
        "daysRemaining": 11,
        "recommendedDailyLimit": 51818,
        "insight": "Pengeluaran makan terkendali dengan baik. Pertahankan pola ini dan sisakan buffer Rp 50K per hari untuk fleksibilitas.",
        "seasonalNote": undefined
      }
    ],
    "overallRisk": "low",
    "summary": "Kondisi budget Anda sehat dengan semua kategori terkendali. Teruskan kebiasaan baik ini dan pertahankan pola pengeluaran saat ini."
  }
}
```

## Key Features

### ✅ Spending Velocity
Calculates daily spending rate and projects to month-end

### ✅ Risk Assessment
- **LOW**: Safe (≤85% of budget)
- **MEDIUM**: Watch out (85-100% of budget)
- **HIGH**: Alert (>100% of budget)

### ✅ AI Insights
Gemini generates natural language explanations:
- WHY the risk exists
- WHAT to do about it

### ✅ Seasonal Patterns
Compares current month vs last 3 months to detect unusual spending

### ✅ Bilingual
Supports English and Indonesian

## Integration Examples

### React Component
```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

function BudgetPredictions({ budgets, transactions }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['budget-predictions', budgets, transactions],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('gemini-finance-insight', {
        body: {
          action: 'predict_budget',
          language: 'id',
          budgets,
          transactions,
          currentDate: new Date().toISOString()
        }
      });
      
      if (error) throw error;
      return data.result;
    }
  });

  if (isLoading) return <div>Menganalisis budget...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>Prediksi Budget</h2>
      <p className={`risk-${data.overallRisk}`}>
        Risiko: {data.overallRisk.toUpperCase()}
      </p>
      <p>{data.summary}</p>
      
      {data.predictions.map(pred => (
        <div key={pred.categoryId} className="prediction-card">
          <h3>{pred.categoryName}</h3>
          <div className="stats">
            <span>Pengeluaran: Rp {pred.currentSpend.toLocaleString()}</span>
            <span>Limit: Rp {pred.budgetLimit.toLocaleString()}</span>
            <span>Proyeksi: Rp {pred.projectedSpend.toLocaleString()}</span>
          </div>
          <div className={`risk-badge ${pred.riskLevel}`}>
            {pred.riskLevel.toUpperCase()}
          </div>
          <p className="insight">{pred.insight}</p>
          {pred.daysRemaining > 0 && (
            <p className="recommendation">
              Sisa hari: {pred.daysRemaining} | 
              Limit harian: Rp {pred.recommendedDailyLimit.toLocaleString()}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
```

### Service Function
```typescript
// src/services/budgetPredictionService.ts
import { supabase } from '@/lib/supabase';

export interface BudgetPredictionRequest {
  budgets: Array<{
    categoryId: number;
    categoryName: string;
    limit: number;
    period: 'monthly';
  }>;
  transactions: Array<{
    categoryId: number;
    amount: number;
    date: string;
    type: 'expense' | 'income';
  }>;
  language?: 'en' | 'id';
}

export async function predictBudgets(request: BudgetPredictionRequest) {
  const { data, error } = await supabase.functions.invoke('gemini-finance-insight', {
    body: {
      action: 'predict_budget',
      language: request.language || 'id',
      budgets: request.budgets,
      transactions: request.transactions,
      currentDate: new Date().toISOString()
    }
  });

  if (error) {
    console.error('Budget prediction error:', error);
    throw new Error('Failed to generate budget predictions');
  }

  return data.result;
}

// Usage
const predictions = await predictBudgets({
  budgets: userBudgets,
  transactions: userTransactions,
  language: 'id'
});
```

## Testing Tips

### Test Case 1: Under Budget (Expected: Low Risk)
```typescript
{
  budgets: [{ categoryId: 1, categoryName: "Food", limit: 1000000, period: "monthly" }],
  transactions: [
    { categoryId: 1, amount: 150000, date: "2024-01-10", type: "expense" }
  ],
  currentDate: "2024-01-15"
}
// Expected: projectedSpend ~310,000, riskLevel: "low"
```

### Test Case 2: High Risk
```typescript
{
  budgets: [{ categoryId: 2, categoryName: "Shopping", limit: 500000, period: "monthly" }],
  transactions: [
    { categoryId: 2, amount: 450000, date: "2024-01-10", type: "expense" }
  ],
  currentDate: "2024-01-15"
}
// Expected: projectedSpend ~930,000, riskLevel: "high"
```

### Test Case 3: Multiple Categories
```typescript
{
  budgets: [
    { categoryId: 1, categoryName: "Food", limit: 800000, period: "monthly" },
    { categoryId: 2, categoryName: "Transport", limit: 400000, period: "monthly" }
  ],
  transactions: [
    { categoryId: 1, amount: 300000, date: "2024-01-10", type: "expense" },
    { categoryId: 2, amount: 150000, date: "2024-01-12", type: "expense" }
  ],
  currentDate: "2024-01-15"
}
// Expected: Both categories analyzed, overall risk calculated
```

## Common Issues

### Issue: Empty predictions array
**Cause:** No budgets or transactions provided  
**Solution:** Ensure both arrays have data

### Issue: All predictions have confidence 0.5
**Cause:** Not enough transactions or time elapsed  
**Solution:** Need more data (3+ transactions, 7+ days)

### Issue: No seasonal notes
**Cause:** Less than 2 months of historical data  
**Solution:** Normal - seasonal analysis needs 2+ months

### Issue: Generic AI insights
**Cause:** AI API failure or rate limiting  
**Solution:** Check GEMINI_API_KEY and quota

## Performance Notes

- **Response Time**: 2-4 seconds for 3-5 budgets
- **API Calls**: N + 1 (N budgets + 1 summary)
- **Token Usage**: ~512 per insight + 1024 summary
- **Rate Limits**: Subject to Gemini API quotas

## Next Steps

1. **Display Predictions**: Create UI components for risk badges
2. **Notifications**: Alert users about high-risk categories
3. **Historical Tracking**: Store predictions to show trends
4. **Custom Thresholds**: Let users set their own risk levels
5. **Budget Adjustments**: Suggest budget increases based on patterns

---

For detailed documentation, see `BUDGET_PREDICTION_FEATURE.md`

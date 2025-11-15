# Budget Prediction Feature - Implementation Documentation

## Overview

Enhanced the Gemini Finance Insight edge function with predictive budget analysis capabilities using AI-powered insights and spending velocity algorithms.

## New Action Type: `predict_budget`

### Request Format

```typescript
{
  "action": "predict_budget",
  "language": "id" | "en",  // Optional, defaults to 'id'
  "budgets": [
    {
      "categoryId": number,
      "categoryName": string,  // Optional
      "limit": number,
      "period": "monthly"
    }
  ],
  "transactions": [
    {
      "categoryId": number,
      "amount": number,
      "date": string,  // ISO 8601 format
      "type": "expense" | "income"
    }
  ],
  "currentDate": string  // Optional, ISO 8601 format, defaults to now
}
```

### Response Format

```typescript
{
  "result": {
    "predictions": [
      {
        "categoryId": number,
        "categoryName": string,
        "currentSpend": number,
        "budgetLimit": number,
        "projectedSpend": number,
        "overrunAmount": number,
        "riskLevel": "low" | "medium" | "high",
        "confidence": number,  // 0.0 - 1.0
        "daysRemaining": number,
        "recommendedDailyLimit": number,
        "insight": string,  // AI-generated explanation
        "seasonalNote": "higher_than_usual" | "lower_than_usual" | undefined
      }
    ],
    "overallRisk": "low" | "medium" | "high",
    "summary": string  // AI-generated overall summary
  }
}
```

## Core Algorithms

### 1. Spending Velocity Algorithm

Calculates projected month-end spending based on current velocity:

```typescript
velocity = totalSpent / daysElapsed
projectedSpend = velocity × totalDaysInMonth
overrunAmount = max(0, projectedSpend - budgetLimit)
```

**Key Points:**
- Calculates spending rate per day
- Projects to month-end based on current pace
- Handles edge cases (first day of month, no spending)

### 2. Risk Scoring Logic

Three-tier risk assessment:

- **LOW**: projected ≤ 85% of budget
- **MEDIUM**: projected 85-100% of budget  
- **HIGH**: projected > 100% of budget

### 3. Confidence Scoring

Based on data quality and time elapsed:

```typescript
baseConfidence = 0.5

// Transaction count bonus (max +0.3)
if (transactions >= 10) bonus += 0.3
else if (transactions >= 5) bonus += 0.2
else if (transactions >= 3) bonus += 0.1

// Days elapsed bonus (max +0.2)
if (daysElapsed >= 15) bonus += 0.2
else if (daysElapsed >= 7) bonus += 0.1

confidence = min(baseConfidence + bonus, 1.0)
```

### 4. Seasonal Pattern Recognition

Compares current spending against last 3 months:

1. Get spending for same period in previous 3 months
2. Calculate historical average
3. Compare current vs average
4. Flag if difference > 20%

**Returns:**
- `hasPattern: boolean` - Whether a significant pattern exists
- `note: string` - "higher_than_usual" or "lower_than_usual"
- `historicalAverage: number` - Average spending from past 3 months

## AI Integration

### Per-Category Insights

For each budget category, Gemini generates:
- **WHY** the risk exists (spending patterns, trends)
- **ONE** specific, actionable recommendation

**Prompt Structure:**
- Category spending data
- Risk level and projections
- Seasonal pattern (if applicable)
- Request for 1-2 sentence insight

### Overall Summary

Gemini generates a 2-3 sentence summary covering:
- Overall financial situation
- Risk level assessment
- ONE priority action for the user

## Edge Case Handling

### No Transactions
- Velocity = 0
- Projected spend = 0
- Risk level = LOW
- Confidence = 0.5 (base)

### First Day of Month
- Days elapsed = 1
- Confidence reduced (needs more time)
- Velocity calculated but flagged as early

### Mid-Month Start
- Handles partial month data correctly
- Days elapsed = current day
- Days remaining adjusted accordingly

### Last Day of Month
- Days remaining = 0
- Recommended daily limit = 0
- Full month data available

### No Budget Set
- Category skipped (not in budgets array)

### Category with No Spending
- Current spend = 0
- Projected = 0
- Risk = LOW

## Bilingual Support

Supports English (en) and Indonesian (id):

### English Examples
- Risk levels: "LOW", "MEDIUM", "HIGH"
- Insights: "High spending on weekends detected. Reduce by Rp 15,000/day."
- Summary: "Budget on track. Focus on reducing dining expenses."

### Indonesian Examples
- Risk levels: "RENDAH", "SEDANG", "TINGGI"
- Insights: "Pengeluaran tinggi di akhir pekan terdeteksi. Kurangi Rp 15.000/hari."
- Summary: "Budget terkendali. Fokus kurangi pengeluaran makan."

## Performance Optimization

1. **Minimal Gemini API Calls:**
   - One call per budget category for insights
   - One call for overall summary
   - Total: N + 1 calls (where N = number of budgets)

2. **Efficient Data Processing:**
   - Single pass through transactions for spending calculation
   - Map-based lookups for O(1) category access
   - Three historical passes for seasonal analysis

3. **Error Handling:**
   - Fallback insights if AI fails
   - Graceful degradation (no crash)
   - Detailed error logging

## Testing Scenarios

### Scenario 1: Under Budget (Low Risk)
```typescript
{
  budgets: [{ categoryId: 1, categoryName: "Dining", limit: 1000000, period: "monthly" }],
  transactions: [
    { categoryId: 1, amount: 200000, date: "2024-01-15", type: "expense" }
  ],
  currentDate: "2024-01-20"
}
```
**Expected:**
- currentSpend: 200,000
- projectedSpend: ~310,000 (200k / 20 days × 31 days)
- riskLevel: "low"
- confidence: 0.6-0.7

### Scenario 2: On Track (Medium Risk)
```typescript
{
  budgets: [{ categoryId: 2, categoryName: "Shopping", limit: 500000, period: "monthly" }],
  transactions: [
    { categoryId: 2, amount: 450000, date: "2024-01-15", type: "expense" }
  ],
  currentDate: "2024-01-20"
}
```
**Expected:**
- currentSpend: 450,000
- projectedSpend: ~697,500
- riskLevel: "high" (>100%)
- confidence: 0.6-0.7

### Scenario 3: Overbudget (High Risk)
```typescript
{
  budgets: [{ categoryId: 3, categoryName: "Entertainment", limit: 300000, period: "monthly" }],
  transactions: [
    { categoryId: 3, amount: 350000, date: "2024-01-15", type: "expense" }
  ],
  currentDate: "2024-01-20"
}
```
**Expected:**
- currentSpend: 350,000
- projectedSpend: ~542,500
- riskLevel: "high"
- overrunAmount: 242,500
- recommendedDailyLimit: 0 (already over)

### Scenario 4: Seasonal Pattern
```typescript
// Requires 3+ months of historical data
{
  budgets: [{ categoryId: 1, categoryName: "Dining", limit: 1000000, period: "monthly" }],
  transactions: [
    // Current month (much higher)
    { categoryId: 1, amount: 500000, date: "2024-03-15", type: "expense" },
    // Previous months (normal)
    { categoryId: 1, amount: 200000, date: "2024-02-15", type: "expense" },
    { categoryId: 1, amount: 220000, date: "2024-01-15", type: "expense" },
  ],
  currentDate: "2024-03-15"
}
```
**Expected:**
- seasonalNote: "higher_than_usual"
- historicalAverage: ~210,000
- Insight mentions seasonal spike

### Scenario 5: Multiple Budgets
```typescript
{
  budgets: [
    { categoryId: 1, categoryName: "Dining", limit: 1000000, period: "monthly" },
    { categoryId: 2, categoryName: "Shopping", limit: 500000, period: "monthly" },
    { categoryId: 3, categoryName: "Transport", limit: 300000, period: "monthly" }
  ],
  transactions: [
    { categoryId: 1, amount: 800000, date: "2024-01-15", type: "expense" },
    { categoryId: 2, amount: 450000, date: "2024-01-15", type: "expense" },
    { categoryId: 3, amount: 150000, date: "2024-01-15", type: "expense" }
  ],
  currentDate: "2024-01-20"
}
```
**Expected:**
- overallRisk: "high" (Dining projected over)
- Summary covers all categories
- Priority action focuses on highest risk

## Integration Example

### Frontend Call
```typescript
const response = await supabase.functions.invoke('gemini-finance-insight', {
  body: {
    action: 'predict_budget',
    language: 'id',
    budgets: userBudgets,
    transactions: userTransactions,
    currentDate: new Date().toISOString()
  }
});

const { predictions, overallRisk, summary } = response.data.result;

// Display predictions in UI
predictions.forEach(pred => {
  console.log(`${pred.categoryName}: ${pred.riskLevel}`);
  console.log(`Insight: ${pred.insight}`);
  console.log(`Recommended daily limit: Rp ${pred.recommendedDailyLimit}`);
});

console.log(`Overall Risk: ${overallRisk}`);
console.log(`Summary: ${summary}`);
```

## Error Handling

### Common Errors

1. **Missing budgets array**
   - Error: "Budgets array is required for budget prediction"
   - Status: 500

2. **Missing transactions array**
   - Error: "Transactions array is required for budget prediction"
   - Status: 500

3. **AI insight generation failure**
   - Fallback: "Perlu monitoring budget." / "Budget monitoring required."
   - No error thrown, uses graceful degradation

4. **Invalid date format**
   - Falls back to current date
   - No error thrown

## Backward Compatibility

✅ **Fully backward compatible**
- Existing actions (`evaluate`, `parse_transactions`) unchanged
- New action is opt-in via `action: 'predict_budget'`
- CORS headers consistent
- Error handling patterns maintained

## Performance Considerations

### API Call Optimization
- **Per request**: N + 1 Gemini API calls
  - N = number of budgets (for individual insights)
  - 1 = overall summary
- **Total tokens**: ~512 per insight + 1024 for summary
- **Estimated time**: ~2-4 seconds for 3-5 budgets

### Memory Usage
- Efficient Map-based spending calculations
- Single pass data aggregation
- No large data structures held in memory

### Scalability
- Works well with 1-20 budgets
- For >20 budgets, consider batching insights
- Historical analysis limited to 3 months (performance trade-off)

## Future Enhancements (Not Implemented)

1. **Weekly/Daily Budgets**: Currently only monthly
2. **Custom Risk Thresholds**: Fixed at 85%/100%
3. **ML-Based Projections**: Currently linear velocity
4. **Batch Processing**: One-by-one budget processing
5. **Caching**: No caching of historical patterns

## Maintenance Notes

### Dependencies
- Deno standard library (0.168.0)
- Gemini 2.5 Flash API
- No additional dependencies

### Environment Variables
- `GEMINI_API_KEY` - Required for AI insights

### Testing
- Unit test helper functions independently
- Integration test with sample data
- Verify bilingual output quality
- Monitor Gemini API quota usage

### Monitoring
- Log AI generation failures
- Track confidence scores
- Monitor API call duration
- Alert on high error rates

---

**Implementation Date:** 2024-01-15  
**Version:** 1.0.0  
**Author:** Python Pro Subagent  
**Edge Function:** `gemini-finance-insight/index.ts`

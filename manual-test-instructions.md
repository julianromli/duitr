# Manual Test Instructions for USD Transaction

## Test Objective
Verify that the `original_amount` field is properly populated when creating transactions, fixing the "null value in column 'original_amount'" error.

## Test Steps

1. **Open the Application**
   - Navigate to http://localhost:8081/
   - Ensure you are logged in

2. **Create a Test Transaction**
   - Click on "Add Transaction" or the "+" button
   - Fill in the transaction details:
     - Amount: 100
     - Type: Expense
     - Category: Any category (e.g., "Other")
     - Description: "Test USD transaction"
     - Wallet: Select any available wallet

3. **Submit the Transaction**
   - Click "Save" or "Add Transaction"
   - Observe if the transaction is created successfully
   - Check for any error messages

## Expected Results

✅ **Success Criteria:**
- Transaction should be created without any "original_amount" null constraint errors
- Transaction should appear in the transaction list
- No error toasts or console errors should appear

❌ **Failure Indicators:**
- "null value in column 'original_amount'" error
- Transaction creation fails
- Error messages in console or UI

## Technical Details

The fix involves:
1. `formatTransactionForDB` function now sets:
   - `original_amount` = transaction amount
   - `original_currency` = user's currency (from useCurrency hook)
   - `converted_amount` = converted amount (if different currency)
   - `converted_currency` = base currency (IDR)
   - `exchange_rate` = conversion rate
   - `rate_timestamp` = current timestamp

2. Currency conversion is handled automatically:
   - If user currency = IDR: no conversion needed
   - If user currency ≠ IDR: converts to IDR using exchange rate API

## Next Steps

If the test passes:
- Mark the fix as successful
- Update todo list to completed

If the test fails:
- Check console for specific error messages
- Verify the formatTransactionForDB function is being called correctly
- Check if useCurrency and useExchangeRate hooks are working properly
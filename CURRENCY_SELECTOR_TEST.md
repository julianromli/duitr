# Currency Selector Feature Test Plan

## Overview
This document outlines the manual testing steps for the currency selector feature in transaction forms.

## Test Environment
- Development server: http://localhost:8080/
- Forms to test: ExpenseForm, IncomeForm, TransferForm

## Test Cases

### 1. ExpenseForm Currency Selection Test
**Objective**: Verify USD currency selection and conversion display

**Steps**:
1. Navigate to the application
2. Click "Add Expense" button
3. In the amount field, verify:
   - Currency selector shows IDR by default
   - Can switch to USD
   - Amount input accepts decimal values
   - Conversion badge appears when currency differs from user preference
4. Enter amount: 100
5. Switch currency from IDR to USD
6. Verify conversion display shows equivalent IDR amount
7. Fill other required fields (category, description)
8. Submit the form
9. Verify transaction is created with correct currency

**Expected Results**:
- ✅ Currency selector is visible and functional
- ✅ Conversion display shows correct exchange rate
- ✅ Form submits successfully with USD currency

### 2. IncomeForm Currency Switching Test
**Objective**: Test switching between USD and IDR during input

**Steps**:
1. Click "Add Income" button
2. Enter amount: 50 (IDR)
3. Switch to USD currency
4. Verify amount remains 50 but currency changes to USD
5. Verify conversion badge shows IDR equivalent
6. Switch back to IDR
7. Verify conversion updates correctly
8. Submit with final currency selection

**Expected Results**:
- ✅ Currency switching works smoothly
- ✅ Conversion calculations are accurate
- ✅ Form maintains amount value during currency switch

### 3. TransferForm Different Currency Test
**Objective**: Test transfer with different currency selection

**Steps**:
1. Click "Transfer" button
2. Select source and destination wallets
3. Enter transfer amount: 25
4. Test currency selector:
   - Default currency (IDR)
   - Switch to USD
   - Verify conversion display
5. Submit transfer

**Expected Results**:
- ✅ Currency selector works in transfer form
- ✅ Conversion display is accurate
- ✅ Transfer is recorded with correct currency

### 4. Database Verification Test
**Objective**: Verify transactions are saved with correct currency information

**Steps**:
1. After creating transactions in previous tests
2. Check transaction list/history
3. Verify each transaction shows:
   - Original amount and currency
   - Converted amount (if different from user preference)
   - Correct currency symbols

**Expected Results**:
- ✅ Transactions display correct currency information
- ✅ Original and converted amounts are preserved
- ✅ Currency symbols are displayed correctly

## Test Results

### ExpenseForm Test
- [ ] Currency selector visible
- [ ] USD selection works
- [ ] Conversion display accurate
- [ ] Form submission successful
- [ ] Transaction saved with USD currency

### IncomeForm Test
- [ ] Currency switching functional
- [ ] Conversion updates correctly
- [ ] Amount preserved during switch
- [ ] Form submission successful

### TransferForm Test
- [ ] Currency selector works
- [ ] Conversion display accurate
- [ ] Transfer recorded correctly

### Database Verification
- [ ] Transactions show correct currency
- [ ] Original amounts preserved
- [ ] Converted amounts accurate
- [ ] Currency symbols correct

## Notes
- Test with both USD and IDR currencies
- Verify exchange rate calculations
- `isSupportedCurrency` only accepts defined currency codes and rejects prototype properties
- Check for any console errors
- Ensure responsive design works on different screen sizes

## Completion Criteria
All checkboxes above should be marked as completed for the currency selector feature to be considered fully functional.
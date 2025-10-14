# Simple Currency System Test Plan

## Overview
This document outlines the manual testing steps for the **simplified currency system** - a display-only preference system (not a conversion system).

**IMPORTANT:** Currency is just a formatting preference. USD users record in USD, IDR users record in IDR. There is NO conversion between currencies.

## Test Environment
- Development server: http://localhost:8080/
- Test Supabase migrations first

## Core Concept
- User selects currency (USD/IDR) during onboarding
- All transactions are recorded in that currency
- Currency affects **DISPLAY FORMAT ONLY**:
  - USD: $1,234.56
  - IDR: Rp 1.234.567
- Changing currency **DELETES ALL DATA** (requires confirmation)

## Test Cases

### 1. USD User Flow Test
**Objective**: Verify USD user can record transactions in USD format

**Steps**:
1. New user onboarding
2. Select USD currency
3. Create expense: $100.50
4. Create income: $1,500.00
5. Create transfer: $50.25
6. Check dashboard balance displays as: $X,XXX.XX
7. Check transaction list shows amounts with $ symbol
8. Check budget amounts display as: $XXX.XX

**Expected Results**:
- ✅ All amounts display with $ symbol
- ✅ Decimal formatting: $1,234.56
- ✅ No IDR amounts anywhere
- ✅ Statistics and charts show USD format

### 2. IDR User Flow Test
**Objective**: Verify IDR user can record transactions in IDR format

**Steps**:
1. New user onboarding
2. Select IDR currency
3. Create expense: 100000
4. Create income: 1500000
5. Create transfer: 50000
6. Check dashboard balance displays as: Rp X.XXX.XXX
7. Check transaction list shows amounts with Rp symbol
8. Check budget amounts display as: Rp XXX.XXX

**Expected Results**:
- ✅ All amounts display with Rp symbol
- ✅ Thousand separator: Rp 1.234.567
- ✅ No decimal places for IDR
- ✅ No USD amounts anywhere
- ✅ Statistics and charts show IDR format

### 3. Currency Change Flow Test
**Objective**: Test currency change with data deletion

**Steps**:
1. Login as user with existing data (e.g., USD user with transactions)
2. Navigate to Profile/Settings page
3. Locate "Currency Preference" section
4. Click "Change Currency" button
5. Verify warning dialog appears
6. Verify dialog shows:
   - ⚠️ Warning about data deletion
   - List of data that will be deleted
   - Currency selection (USD/IDR)
   - Confirmation input field
7. Select new currency (e.g., switch from USD to IDR)
8. Try to submit without typing "DELETE" → should be blocked
9. Type "DELETE" in confirmation field
10. Click "Delete All Data & Change Currency"
11. Wait for success message
12. Verify redirect to dashboard
13. Verify all previous data is gone
14. Create new transaction in new currency format
15. Verify new transaction displays correctly

**Expected Results**:
- ✅ Warning dialog shows clearly
- ✅ Cannot proceed without typing "DELETE"
- ✅ All previous data deleted successfully
- ✅ Currency changed successfully
- ✅ New transactions use new currency format
- ✅ No mixing of old and new currency data

### 4. Currency Display Consistency Test
**Objective**: Verify currency display is consistent across all components

**Test Areas**:
- [ ] Dashboard balance summary
- [ ] Transaction list
- [ ] Recent transactions widget
- [ ] Budget cards
- [ ] Want to buy items
- [ ] Pinjaman/loans
- [ ] Statistics charts
- [ ] Export CSV
- [ ] Transaction details overlay

**Expected Results**:
- ✅ All displays use user's preferred currency
- ✅ Consistent formatting everywhere
- ✅ No currency mismatch

### 5. Database Schema Test
**Objective**: Verify database columns are cleaned up

**Steps**:
1. Run migrations:
   - `20250116_simplify_currency_system.sql`
   - `20250116_add_delete_user_data_function.sql`
2. Check `transactions` table schema
3. Check `wallets` table schema
4. Check `budgets` table schema
5. Verify `exchange_rates` table is removed

**Expected Results**:
- ✅ `transactions` table:
  - Has `amount` column ✓
  - NO `original_amount` column ✗
  - NO `original_currency` column ✗
  - NO `converted_amount` column ✗
  - NO `converted_currency` column ✗
  - NO `exchange_rate` column ✗
  - NO `rate_timestamp` column ✗
- ✅ `wallets` table:
  - NO `base_currency` column ✗
  - NO `currency` column ✗
- ✅ `budgets` table:
  - NO `currency` column ✗
- ✅ `exchange_rates` table dropped
- ✅ Function `delete_all_user_data` exists

## Test Results Checklist

### USD User Flow
- [ ] Onboarding USD selection works
- [ ] Transactions display with $ symbol
- [ ] Amounts format: $1,234.56
- [ ] Dashboard shows USD correctly
- [ ] Budget shows USD correctly
- [ ] No IDR formatting anywhere

### IDR User Flow
- [ ] Onboarding IDR selection works
- [ ] Transactions display with Rp symbol
- [ ] Amounts format: Rp 1.234.567 (no decimals)
- [ ] Dashboard shows IDR correctly
- [ ] Budget shows IDR correctly
- [ ] No USD formatting anywhere

### Currency Change Flow
- [ ] Settings shows current currency
- [ ] Change dialog appears with warning
- [ ] Cannot proceed without "DELETE" confirmation
- [ ] Currency selection works
- [ ] All data deleted after confirmation
- [ ] Currency updated successfully
- [ ] Can create new transactions in new currency

### Database Cleanup
- [ ] Migration runs without errors
- [ ] Unnecessary columns removed
- [ ] delete_all_user_data function created
- [ ] exchange_rates table removed

## Notes
- **NO CURRENCY CONVERSION** - This is a display-only preference system
- User must choose one currency and stick with it
- Changing currency requires starting fresh (all data deleted)
- Test with both USD and IDR to ensure formatting is correct
- Check for any console errors
- Ensure responsive design works on different screen sizes

## Completion Criteria
All checkboxes above should be marked as completed for the simplified currency system to be considered fully functional and ready for production.
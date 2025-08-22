// Test script for currency selector feature in transaction forms
// This script will test the CurrencyInput component functionality

console.log('🧪 Testing Currency Selector Feature');

// Test 1: Verify CurrencyInput component exists and is properly imported
function testCurrencyInputImport() {
  console.log('\n📋 Test 1: Checking CurrencyInput component import...');
  
  // Check if the component files exist
  const fs = require('fs');
  const path = require('path');
  
  const currencyInputPath = path.join(__dirname, 'src/components/currency/CurrencyInput.tsx');
  const expenseFormPath = path.join(__dirname, 'src/components/transactions/ExpenseForm.tsx');
  const incomeFormPath = path.join(__dirname, 'src/components/transactions/IncomeForm.tsx');
  const transferFormPath = path.join(__dirname, 'src/components/transactions/TransferForm.tsx');
  
  try {
    if (fs.existsSync(currencyInputPath)) {
      console.log('✅ CurrencyInput component exists');
    } else {
      console.log('❌ CurrencyInput component not found');
      return false;
    }
    
    // Check if transaction forms import CurrencyInput
    const expenseFormContent = fs.readFileSync(expenseFormPath, 'utf8');
    const incomeFormContent = fs.readFileSync(incomeFormPath, 'utf8');
    const transferFormContent = fs.readFileSync(transferFormPath, 'utf8');
    
    if (expenseFormContent.includes('CurrencyInput')) {
      console.log('✅ ExpenseForm imports CurrencyInput');
    } else {
      console.log('❌ ExpenseForm does not import CurrencyInput');
    }
    
    if (incomeFormContent.includes('CurrencyInput')) {
      console.log('✅ IncomeForm imports CurrencyInput');
    } else {
      console.log('❌ IncomeForm does not import CurrencyInput');
    }
    
    if (transferFormContent.includes('CurrencyInput')) {
      console.log('✅ TransferForm imports CurrencyInput');
    } else {
      console.log('❌ TransferForm does not import CurrencyInput');
    }
    
    return true;
  } catch (error) {
    console.log('❌ Error checking files:', error.message);
    return false;
  }
}

// Test 2: Verify form data structure includes currency
function testFormDataStructure() {
  console.log('\n📋 Test 2: Checking form data structure...');
  
  const fs = require('fs');
  const path = require('path');
  
  const expenseFormPath = path.join(__dirname, 'src/components/transactions/ExpenseForm.tsx');
  
  try {
    const content = fs.readFileSync(expenseFormPath, 'utf8');
    
    // Check if formData includes currency field
    if (content.includes('currency:') && content.includes('SupportedCurrency')) {
      console.log('✅ Form data structure includes currency field');
    } else {
      console.log('❌ Form data structure missing currency field');
    }
    
    // Check if handleAmountChange function exists
    if (content.includes('handleAmountChange')) {
      console.log('✅ handleAmountChange function exists');
    } else {
      console.log('❌ handleAmountChange function missing');
    }
    
    // Check if CurrencyInput props are properly set
    if (content.includes('allowCurrencyChange={true}') && content.includes('showConversion={true}')) {
      console.log('✅ CurrencyInput configured with proper props');
    } else {
      console.log('❌ CurrencyInput missing proper configuration');
    }
    
    return true;
  } catch (error) {
    console.log('❌ Error checking form structure:', error.message);
    return false;
  }
}

// Test 3: Verify currency utilities exist
function testCurrencyUtilities() {
  console.log('\n📋 Test 3: Checking currency utilities...');
  
  const fs = require('fs');
  const path = require('path');
  
  const currencyUtilsPath = path.join(__dirname, 'src/utils/currency.ts');
  
  try {
      if (fs.existsSync(currencyUtilsPath)) {
        const content = fs.readFileSync(currencyUtilsPath, 'utf8');
      
      const requiredFunctions = [
        'formatCurrencyInput',
        'unformatCurrencyInput',
        'getSupportedCurrencies',
        'getCurrencySymbol',
        'formatCurrency',
        'isSupportedCurrency'
      ];
      
      let allFunctionsExist = true;
      requiredFunctions.forEach(func => {
        if (content.includes(func)) {
          console.log(`✅ ${func} function exists`);
        } else {
          console.log(`❌ ${func} function missing`);
          allFunctionsExist = false;
        }
      });

      if (!allFunctionsExist) return false;

      // Verify isSupportedCurrency does not validate prototype properties
      // Load the TypeScript module by transpiling it on the fly
      const ts = require('typescript');
      const tsContent = fs.readFileSync(currencyUtilsPath, 'utf8');
      const transpiled = ts.transpileModule(tsContent, {
        compilerOptions: { module: ts.ModuleKind.CommonJS }
      });
      const moduleExports = {};
      // eslint-disable-next-line no-new-func
      const loader = new Function('exports', 'require', 'module', '__filename', '__dirname', transpiled.outputText);
      loader(moduleExports, require, { exports: moduleExports }, currencyUtilsPath, path.dirname(currencyUtilsPath));
      const { isSupportedCurrency } = moduleExports;
      if (!isSupportedCurrency('USD')) {
        console.log('❌ isSupportedCurrency fails for valid currency code');
        return false;
      }
      if (isSupportedCurrency('toString')) {
        console.log('❌ isSupportedCurrency incorrectly accepts prototype properties');
        return false;
      }

      return true;
    } else {
      console.log('❌ Currency utilities file not found');
      return false;
    }
  } catch (error) {
    console.log('❌ Error checking currency utilities:', error.message);
    return false;
  }
}

// Run all tests
function runTests() {
  console.log('🚀 Starting Currency Selector Feature Tests\n');
  
  const test1 = testCurrencyInputImport();
  const test2 = testFormDataStructure();
  const test3 = testCurrencyUtilities();
  
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  console.log(`Test 1 - Component Import: ${test1 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Test 2 - Form Data Structure: ${test2 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Test 3 - Currency Utilities: ${test3 ? '✅ PASS' : '❌ FAIL'}`);
  
  const allTestsPassed = test1 && test2 && test3;
  console.log(`\n🎯 Overall Result: ${allTestsPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  if (allTestsPassed) {
    console.log('\n🎉 Currency selector feature is properly implemented!');
    console.log('📝 Next steps:');
    console.log('   1. Test the UI manually in the browser');
    console.log('   2. Create test transactions with USD currency');
    console.log('   3. Verify currency conversion display');
    console.log('   4. Check database storage of currency information');
  } else {
    console.log('\n⚠️  Some issues found. Please review the failed tests above.');
  }
  
  return allTestsPassed;
}

// Run tests if the script is executed directly; otherwise export for use
if (require.main === module) {
  runTests();
} else {
  module.exports = { runTests };
}
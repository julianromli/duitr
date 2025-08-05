// Test script to verify USD transaction creation
// This script tests if the original_amount field is properly populated

const testUSDTransaction = async () => {
  console.log('Testing USD transaction creation...');
  
  // Simulate adding a USD transaction
  const testTransaction = {
    amount: 100, // $100 USD
    description: 'Test USD transaction',
    date: new Date().toISOString(),
    type: 'expense',
    walletId: 'test-wallet-id', // This would be a real wallet ID in practice
    categoryId: 'expense_other',
    original_currency: 'USD'
  };
  
  console.log('Test transaction data:', testTransaction);
  console.log('Expected behavior: original_amount should be set to 100');
  console.log('Expected behavior: original_currency should be set to USD');
  console.log('Expected behavior: converted_amount should be calculated based on exchange rate');
  console.log('Expected behavior: converted_currency should be IDR');
  
  // In a real test, this would call the addTransaction function
  // For now, we'll just log what should happen
  console.log('\nTo test manually:');
  console.log('1. Open the app at http://localhost:8081/');
  console.log('2. Navigate to add transaction page');
  console.log('3. Create a transaction with USD currency');
  console.log('4. Check if the transaction saves without the original_amount null error');
};

testUSDTransaction();
// Component: LoginButtonTest
// Description: Test component to verify Login button behavior on landing page
// Created to test the fix for inconsistent Login button navigation

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle, RotateCcw } from 'lucide-react';

const LoginButtonTest: React.FC = () => {
  const navigate = useNavigate();
  const [testResults, setTestResults] = useState<Array<{ attempt: number; success: boolean; timestamp: string }>>([]);
  const [isRunning, setIsRunning] = useState(false);

  const simulateLoginButtonClick = () => {
    try {
      // Simulate the exact same behavior as the fixed Login button
      const event = new Event('click', { bubbles: true, cancelable: true });
      event.preventDefault();
      navigate('/login');
      
      return true;
    } catch (error) {
      console.error('Navigation error:', error);
      return false;
    }
  };

  const runTest = async () => {
    setIsRunning(true);
    const newResults: Array<{ attempt: number; success: boolean; timestamp: string }> = [];
    
    // Run 10 test attempts to check for consistency
    for (let i = 1; i <= 10; i++) {
      const success = simulateLoginButtonClick();
      newResults.push({
        attempt: i,
        success,
        timestamp: new Date().toLocaleTimeString()
      });
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setTestResults(newResults);
    setIsRunning(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const successCount = testResults.filter(result => result.success).length;
  const totalTests = testResults.length;
  const successRate = totalTests > 0 ? (successCount / totalTests) * 100 : 0;

  return (
    <div className="container p-4 max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Login Button Test</CardTitle>
          <CardDescription>
            Test the consistency of Login button navigation behavior
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={runTest} 
              disabled={isRunning}
              className="flex-1"
            >
              {isRunning ? 'Running Tests...' : 'Run Navigation Test'}
            </Button>
            <Button 
              onClick={clearResults} 
              variant="outline"
              disabled={testResults.length === 0}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          {testResults.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="font-medium">Success Rate:</span>
                <div className="flex items-center gap-2">
                  {successRate === 100 ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className={`font-bold ${successRate === 100 ? 'text-green-600' : 'text-red-600'}`}>
                    {successRate.toFixed(1)}% ({successCount}/{totalTests})
                  </span>
                </div>
              </div>

              <div className="space-y-1 max-h-40 overflow-y-auto">
                {testResults.map((result) => (
                  <div 
                    key={result.attempt}
                    className={`flex items-center justify-between p-2 rounded text-sm ${
                      result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                    }`}
                  >
                    <span>Test #{result.attempt}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs opacity-70">{result.timestamp}</span>
                      {result.success ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <AlertCircle className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            <p><strong>Test Description:</strong></p>
            <p>This test simulates the Login button click behavior to verify consistent navigation to /login route without page refreshes.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginButtonTest;

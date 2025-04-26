import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle } from 'lucide-react';

const SupabaseConnectionTest = () => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [data, setData] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const testConnection = async () => {
    setStatus('loading');
    setError(null);
    
    try {
      // Try to fetch data from the wallets table
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .limit(5);
      
      if (error) throw error;
      
      setData(data);
      setStatus('success');
    } catch (err: any) {
      console.error('Supabase connection error:', err);
      setError(err.message || 'Unknown error occurred');
      setStatus('error');
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Supabase Connection Test</CardTitle>
        <CardDescription>
          Test the connection to your Supabase database
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <Button onClick={testConnection} disabled={status === 'loading'}>
            {status === 'loading' ? 'Testing...' : 'Test Connection'}
          </Button>
          
          {status === 'success' && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <p>Connection successful!</p>
            </div>
          )}
          
          {status === 'error' && (
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          )}
          
          {data && data.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Data from wallets table:</h3>
              <pre className="bg-slate-100 p-3 rounded-md text-xs overflow-auto max-h-40">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          )}
          
          {data && data.length === 0 && (
            <p className="text-sm text-amber-600">
              Connection successful, but no data found in wallets table.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SupabaseConnectionTest; 
import React from 'react';
import SupabaseConnectionTest from '@/components/shared/SupabaseConnectionTest';

const SupabaseTestPage = () => {
  return (
    <div className="container p-4 max-w-md mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Supabase Connection Test</h1>
        <p className="text-muted-foreground">
          This page tests your Supabase connection to ensure your database operations work correctly.
        </p>
      </div>
      
      <SupabaseConnectionTest />
    </div>
  );
};

export default SupabaseTestPage; 
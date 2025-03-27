import React, { useEffect, useState } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Offline: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Update online status when it changes
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // If online, redirect to home page
  useEffect(() => {
    if (isOnline) {
      window.location.href = '/';
    }
  }, [isOnline]);

  // Function to try reloading the page
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="bg-[#0D0D0D] min-h-screen flex flex-col items-center justify-center text-white p-6">
      <div className="max-w-md w-full mx-auto text-center">
        <div className="mb-8 bg-[#242425] rounded-full p-8 inline-block">
          <WifiOff size={64} className="text-[#C6FE1E]" />
        </div>
        
        <h1 className="text-2xl font-bold mb-4">You're Offline</h1>
        <p className="text-[#868686] mb-6">
          It looks like you're not connected to the internet. Please check your connection and try again.
        </p>
        
        <div className="space-y-4">
          <Button
            onClick={handleRetry}
            className="w-full bg-[#C6FE1E] text-[#0D0D0D] hover:bg-[#AEDE1A] font-medium"
          >
            <RefreshCw size={16} className="mr-2" />
            Try Again
          </Button>
        </div>
        
        <p className="mt-8 text-xs text-[#868686]">
          Don't worry! Any changes you've made while offline will be synchronized when you reconnect.
        </p>
      </div>
    </div>
  );
};

export default Offline; 
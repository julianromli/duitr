import React, { useState, useEffect } from 'react';
import { usePWA } from '@/hooks/usePWA';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import AppLogo from '@/components/shared/Logo';

export const InstallAppBanner: React.FC = () => {
  const { isInstallable, isInstalled, isStandalone, promptInstall } = usePWA();
  const [showBanner, setShowBanner] = useState(false);
  const [dismissedPermanently, setDismissedPermanently] = useState(false);

  useEffect(() => {
    // Check if user has previously dismissed the banner
    const isPermanentlyDismissed = localStorage.getItem('pwa-dismissed') === 'true';
    setDismissedPermanently(isPermanentlyDismissed);
    
    // Only show banner if:
    // 1. App is installable
    // 2. App is not already installed or in standalone mode
    // 3. User hasn't permanently dismissed the banner
    const shouldShowBanner = isInstallable && !isInstalled && !isStandalone && !isPermanentlyDismissed;
    
    // Add a delay to avoid showing the banner immediately on page load
    if (shouldShowBanner) {
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 3000); // Show after 3 seconds
      
      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled, isStandalone]);

  // Permanently dismiss the banner
  const handleDismissPermanently = () => {
    localStorage.setItem('pwa-dismissed', 'true');
    setDismissedPermanently(true);
    setShowBanner(false);
  };

  // Temporarily dismiss the banner
  const handleDismiss = () => {
    setShowBanner(false);
  };

  // Handle install button click
  const handleInstall = async () => {
    try {
      await promptInstall();
    } catch (error) {
      console.error('Error installing app:', error);
    }
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0D0D0D] border-t border-[#242425] z-50">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <div className="flex items-center flex-1 pr-4">
          <AppLogo size={28} withText={false} className="mr-2" />
          <div>
            <h3 className="text-white font-medium">Install Duitr App</h3>
            <p className="text-[#868686] text-sm">Add to your home screen for a better experience</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleInstall}
            className="bg-[#C6FE1E] text-[#0D0D0D] hover:bg-[#AEDE1A] px-3 py-1 h-9"
          >
            <Download size={16} className="mr-1" />
            Install
          </Button>
          <Button
            onClick={handleDismiss}
            variant="ghost"
            className="text-white p-1 h-8 w-8 flex items-center justify-center"
          >
            <X size={16} />
          </Button>
        </div>
      </div>
      <div className="mt-2 max-w-md mx-auto">
        <Button
          onClick={handleDismissPermanently}
          variant="link"
          className="text-[#868686] text-xs p-0 h-auto hover:text-white"
        >
          Don't show again
        </Button>
      </div>
    </div>
  );
}; 
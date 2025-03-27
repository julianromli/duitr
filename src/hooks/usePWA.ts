import { useState, useEffect } from 'react';

// Interface for BeforeInstallPromptEvent which is not included in standard TypeScript types
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWA() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if app is already installed or running in standalone mode
    const checkInstalled = () => {
      const isInStandaloneMode = () => 
        window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as any).standalone || 
        document.referrer.includes('android-app://');
      
      setIsStandalone(isInStandaloneMode());
      setIsInstalled(isInStandaloneMode());
    };

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the default browser install prompt
      e.preventDefault();
      // Store the event for later use
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
    };

    // Check if service worker is supported
    const isServiceWorkerSupported = 'serviceWorker' in navigator;

    // Initial check
    checkInstalled();

    // Add event listeners
    if (isServiceWorkerSupported) {
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', handleAppInstalled);
    }

    // Clean up event listeners
    return () => {
      if (isServiceWorkerSupported) {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
      }
    };
  }, []);

  // Function to prompt the user to install the app
  const promptInstall = async () => {
    if (!installPrompt) return;

    // Show the install prompt
    await installPrompt.prompt();

    // Wait for the user's choice
    const choiceResult = await installPrompt.userChoice;

    // Reset the install prompt - it can only be used once
    setInstallPrompt(null);

    if (choiceResult.outcome === 'accepted') {
      setIsInstalled(true);
    }

    return choiceResult.outcome;
  };

  return {
    isInstallable,
    isInstalled,
    isStandalone,
    promptInstall
  };
} 
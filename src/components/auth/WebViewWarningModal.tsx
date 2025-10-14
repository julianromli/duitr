// WebView Warning Modal Component
// Shows when user tries to use Google OAuth from an in-app browser or WebView
// Provides instructions and alternatives

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  ExternalLink, 
  Copy, 
  Mail, 
  CheckCircle2,
  Smartphone,
} from 'lucide-react';
import {
  isInAppBrowser,
  getBrowserInstructions,
  openInExternalBrowser,
  copyAuthUrlToClipboard,
  logWebViewDetection,
} from '@/utils/webview-detection';
import { useToast } from '@/hooks/use-toast';

interface WebViewWarningModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUseEmailInstead?: () => void;
}

export const WebViewWarningModal: React.FC<WebViewWarningModalProps> = ({
  open,
  onOpenChange,
  onUseEmailInstead,
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();
  
  const inAppCheck = isInAppBrowser();
  const instructions = getBrowserInstructions();
  
  // Log when modal is shown
  React.useEffect(() => {
    if (open) {
      logWebViewDetection({ 
        action: 'warning_modal_shown',
        context: 'google_oauth_attempt'
      });
    }
  }, [open]);
  
  const handleOpenInBrowser = () => {
    logWebViewDetection({ action: 'open_in_browser_clicked' });
    
    const success = openInExternalBrowser();
    
    if (!success) {
      toast({
        variant: 'destructive',
        title: 'Tidak dapat membuka browser',
        description: 'Silakan salin link dan buka manual di browser Anda.',
      });
    }
  };
  
  const handleCopyLink = async () => {
    logWebViewDetection({ action: 'copy_link_clicked' });
    
    const success = await copyAuthUrlToClipboard();
    
    if (success) {
      setIsCopied(true);
      toast({
        title: 'Link berhasil disalin!',
        description: 'Sekarang buka browser dan paste link tersebut.',
      });
      
      // Reset copied state after 3 seconds
      setTimeout(() => setIsCopied(false), 3000);
    } else {
      toast({
        variant: 'destructive',
        title: 'Gagal menyalin link',
        description: 'Silakan salin URL secara manual dari address bar.',
      });
    }
  };
  
  const handleUseEmail = () => {
    logWebViewDetection({ action: 'use_email_instead_clicked' });
    onOpenChange(false);
    onUseEmailInstead?.();
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
            </div>
            <DialogTitle className="text-xl">
              Login Google Diblokir
            </DialogTitle>
          </div>
          <DialogDescription className="text-base leading-relaxed pt-2">
            Google memblokir login dari {inAppCheck.browser || 'browser in-app'} untuk keamanan.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Explanation Alert */}
          <Alert className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30">
            <Smartphone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Mengapa ini terjadi?</strong>
              <p className="mt-1">
                Google tidak mengizinkan login OAuth di browser tertanam (in-app browser) 
                untuk mencegah serangan phishing dan melindungi akun Anda.
              </p>
            </AlertDescription>
          </Alert>
          
          {/* Instructions */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              Cara mengatasi:
            </h4>
            
            <ol className="space-y-2 text-sm list-decimal list-inside pl-2">
              <li className="text-muted-foreground">
                {instructions}
              </li>
              <li className="text-muted-foreground">
                Halaman akan terbuka di browser utama Anda
              </li>
              <li className="text-muted-foreground">
                Login dengan Google akan berfungsi normal
              </li>
            </ol>
          </div>
          
          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <Button
              onClick={handleOpenInBrowser}
              className="w-full"
              variant="default"
              size="lg"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Buka di Browser
            </Button>
            
            <Button
              onClick={handleCopyLink}
              className="w-full"
              variant="outline"
              size="lg"
            >
              {isCopied ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                  Link Tersalin!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Salin Link
                </>
              )}
            </Button>
          </div>
          
          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-background text-muted-foreground text-xs">
                atau gunakan alternatif
              </span>
            </div>
          </div>
          
          {/* Alternative Option */}
          {onUseEmailInstead && (
            <Button
              onClick={handleUseEmail}
              className="w-full"
              variant="secondary"
              size="lg"
            >
              <Mail className="mr-2 h-4 w-4" />
              Login dengan Email Saja
            </Button>
          )}
        </div>
        
        <DialogFooter className="sm:justify-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs text-muted-foreground"
          >
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

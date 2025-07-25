import React, { useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowDown, ArrowUp, ArrowLeftRight } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/context/ThemeContext';
import html2canvas from 'html2canvas';
import CategoryIcon from '@/components/shared/CategoryIcon';
import {
  Sheet,
  SheetContent,
  SheetPortal,
  SheetOverlay
} from "@/components/ui/sheet";
import * as SheetPrimitive from "@radix-ui/react-dialog";

const TransactionDetailPage: React.FC = () => {
  const { state } = useLocation();
  const { formatCurrency, wallets, getDisplayCategoryName } = useFinance();
  const transaction = state?.transaction;
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const contentRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const { theme } = useTheme();

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => navigate(-1), 300); // Wait for animation to complete
  };

  if (!transaction) {
    return null;
  }

  const { amount, categoryId, description, date, type, walletId } = transaction;

  // Get wallet name by ID
  const getWalletName = (walletId: string) => {
    const wallet = wallets.find(w => w.id === walletId);
    return wallet ? wallet.name : 'Unknown Wallet';
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Get icon based on transaction type
  const getTypeIcon = () => {
    switch (type) {
      case 'income':
        return <ArrowUp className="w-5 h-5 text-finance-income" />;
      case 'expense':
        return <ArrowDown className="w-5 h-5 text-finance-expense" />;
      case 'transfer':
        return <ArrowLeftRight className="w-5 h-5 text-finance-saving" />;
      default:
        return null;
    }
  };

  // Get color based on transaction type
  const getTypeColor = () => {
    switch (type) {
      case 'income':
        return 'text-finance-income';
      case 'expense':
        return 'text-finance-expense';
      case 'transfer':
        return 'text-finance-saving';
      default:
        return 'text-foreground';
    }
  };

  // Get colors for success icon based on transaction type
  const getSuccessIconColors = () => {
    const bgColor = 'bg-primary';
    const innerBgColor = theme === 'dark' ? 'bg-[#1A4913]' : 'bg-[#106B03]';
    
    return { bgColor, innerBgColor };
  };

  // Download transaction details as JPG with professional receipt design
  const handleDownload = async () => {
    if (!contentRef.current) return;

    setIsDownloading(true);
    try {
      // Create a professional receipt container with 9:16 aspect ratio
      const receiptContainer = document.createElement('div');
      receiptContainer.style.width = '1080px';
      receiptContainer.style.height = '1920px';
      receiptContainer.style.backgroundColor = theme === 'dark' ? '#0D0D0D' : '#FFFFFF';
      receiptContainer.style.fontFamily = 'Plus Jakarta Sans, system-ui, -apple-system, sans-serif';
      receiptContainer.style.position = 'relative';
      receiptContainer.style.overflow = 'hidden';

      // Create main content wrapper that mimics the overlay layout
      const contentWrapper = document.createElement('div');
      contentWrapper.style.display = 'flex';
      contentWrapper.style.flexDirection = 'column';
      contentWrapper.style.minHeight = '100%';
      contentWrapper.style.padding = '80px 60px 160px 60px';
      contentWrapper.style.boxSizing = 'border-box';

      // Create header section that mimics the overlay
      const headerSection = document.createElement('div');
      headerSection.style.textAlign = 'center';
      headerSection.style.marginBottom = '60px';
      headerSection.style.paddingBottom = '40px';
      headerSection.style.borderBottom = theme === 'dark' ? '2px solid #374151' : '2px solid #E5E7EB';

      // App logo/brand section - modern app icon style
      const logoContainer = document.createElement('div');
      logoContainer.style.width = '120px';
      logoContainer.style.height = '120px';
      logoContainer.style.backgroundColor = '#C6FE1E';
      logoContainer.style.borderRadius = '28px'; // More modern rounded corners
      logoContainer.style.display = 'flex';
      logoContainer.style.alignItems = 'center';
      logoContainer.style.justifyContent = 'center';
      logoContainer.style.margin = '0 auto 30px auto';
      logoContainer.style.boxShadow = theme === 'dark' ?
        '0 20px 40px rgba(198, 254, 30, 0.3)' :
        '0 20px 40px rgba(198, 254, 30, 0.4)';
      logoContainer.style.position = 'relative';

      const logoText = document.createElement('div');
      logoText.style.fontSize = '36px';
      logoText.style.fontWeight = '700';
      logoText.style.color = '#000000';
      logoText.style.letterSpacing = '-1px';
      logoText.style.fontFamily = 'Plus Jakarta Sans, system-ui, sans-serif';
      logoText.textContent = 'duitR';

      logoContainer.appendChild(logoText);

      // Receipt title
      const receiptTitle = document.createElement('div');
      receiptTitle.style.fontSize = '36px';
      receiptTitle.style.fontWeight = '700';
      receiptTitle.style.color = theme === 'dark' ? '#FFFFFF' : '#1F2937';
      receiptTitle.style.marginBottom = '8px';
      receiptTitle.textContent = 'Transaction Receipt';

      // Receipt subtitle
      const receiptSubtitle = document.createElement('div');
      receiptSubtitle.style.fontSize = '24px';
      receiptSubtitle.style.fontWeight = '500';
      receiptSubtitle.style.color = theme === 'dark' ? '#9CA3AF' : '#6B7280';
      const now = new Date();
      receiptSubtitle.textContent = `Generated on ${now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}`;

      headerSection.appendChild(logoContainer);
      headerSection.appendChild(receiptTitle);
      headerSection.appendChild(receiptSubtitle);

      // Clone and style the transaction content to match overlay exactly
      const contentClone = contentRef.current.cloneNode(true) as HTMLElement;

      // Apply receipt-specific styling to the cloned content
      contentClone.style.width = '100%';
      contentClone.style.maxWidth = '100%';
      contentClone.style.backgroundColor = 'transparent';
      contentClone.style.fontSize = '32px';
      contentClone.style.lineHeight = '1.6';

      // Style the main content to match overlay appearance exactly


      // Scale up the icon container (the double circle)
      const iconContainers = contentClone.querySelectorAll('[class*="rounded-full"][class*="bg-primary"]');
      iconContainers.forEach((element) => {
        const htmlElement = element as HTMLElement;
        htmlElement.style.width = '160px';
        htmlElement.style.height = '160px';
        htmlElement.style.marginBottom = '48px';
      });

      // Scale up the inner icon container
      const innerIconContainers = contentClone.querySelectorAll('[class*="rounded-full"][class*="bg-"][class*="w-16"]');
      innerIconContainers.forEach((element) => {
        const htmlElement = element as HTMLElement;
        htmlElement.style.width = '128px';
        htmlElement.style.height = '128px';
      });

      // Scale up the amount text - make it much larger
      const amountElements = contentClone.querySelectorAll('[class*="text-3xl"]');
      amountElements.forEach((element) => {
        const htmlElement = element as HTMLElement;
        htmlElement.style.fontSize = '96px'; // Increased from 72px to 96px
        htmlElement.style.fontWeight = '900';
        htmlElement.style.marginBottom = '40px';
        htmlElement.style.letterSpacing = '-2px';
        htmlElement.style.lineHeight = '1';
      });

      // Style the main transaction details card
      const transactionCards = contentClone.querySelectorAll('[class*="bg-muted"], .bg-card');
      transactionCards.forEach((element) => {
        const htmlElement = element as HTMLElement;
        htmlElement.style.borderRadius = '24px';
        htmlElement.style.padding = '40px';
        htmlElement.style.marginTop = '32px';
        htmlElement.style.fontSize = '28px';
      });

      // Style text elements
      const allTextElements = contentClone.querySelectorAll('*');
      allTextElements.forEach((element) => {
        const htmlElement = element as HTMLElement;
        if (htmlElement.tagName !== 'svg' && htmlElement.tagName !== 'path') {
          if (htmlElement.style.fontSize && parseInt(htmlElement.style.fontSize) < 20) {
            htmlElement.style.fontSize = '28px';
          }
        }
      });

      // Style labels
      const mutedElements = contentClone.querySelectorAll('.text-muted-foreground, [class*="text-muted"]');
      mutedElements.forEach((element) => {
        const htmlElement = element as HTMLElement;
        htmlElement.style.fontSize = '28px';
        htmlElement.style.fontWeight = '500';
      });

      // Style values
      const emphasizedElements = contentClone.querySelectorAll('.font-medium, .font-bold, [class*="font-medium"], [class*="font-bold"]');
      emphasizedElements.forEach((element) => {
        const htmlElement = element as HTMLElement;
        htmlElement.style.fontSize = '32px';
        htmlElement.style.fontWeight = '600';
      });

      // Style icons to match theme and be more visible
      const iconElements = contentClone.querySelectorAll('svg');
      iconElements.forEach((element) => {
        const svgElement = element as SVGSVGElement;
        svgElement.style.color = 'currentColor';
        svgElement.style.fill = 'currentColor';

        // Set consistent icon sizing for better visibility
        svgElement.style.width = '48px';
        svgElement.style.height = '48px';
        svgElement.style.minWidth = '48px';
        svgElement.style.minHeight = '48px';

        // Ensure proper alignment
        svgElement.style.display = 'block';
        svgElement.style.margin = '0 auto';
      });

      // Create enhanced footer with metadata (same as overlay)
      const footerSection = document.createElement('div');
      footerSection.style.position = 'absolute';
      footerSection.style.bottom = '0';
      footerSection.style.left = '0';
      footerSection.style.right = '0';
      footerSection.style.padding = '40px 80px 60px 80px';
      footerSection.style.borderTop = theme === 'dark' ? '1px solid #1F2937' : '1px solid #E5E7EB';
      footerSection.style.backgroundColor = theme === 'dark' ? 'rgba(17, 24, 39, 0.8)' : 'rgba(248, 250, 252, 0.8)';
      footerSection.style.backdropFilter = 'blur(10px)';

      // Footer content container
      const footerContent = document.createElement('div');
      footerContent.style.display = 'flex';
      footerContent.style.justifyContent = 'space-between';
      footerContent.style.alignItems = 'center';
      footerContent.style.flexWrap = 'wrap';
      footerContent.style.gap = '20px';

      // Left side - Generation info
      const generationInfo = document.createElement('div');
      generationInfo.style.textAlign = 'left';

      const brandText = document.createElement('div');
      brandText.style.fontSize = '28px';
      brandText.style.fontWeight = '700';
      brandText.style.color = theme === 'dark' ? '#C6FE1E' : '#059669';
      brandText.style.marginBottom = '8px';
      brandText.textContent = 'duitR Financial';

      const generatedText = document.createElement('div');
      generatedText.style.fontSize = '22px';
      generatedText.style.fontWeight = '500';
      generatedText.style.color = theme === 'dark' ? '#9CA3AF' : '#6B7280';
      const generationTimestamp = new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      generatedText.textContent = `Generated: ${generationTimestamp}`;

      generationInfo.appendChild(brandText);
      generationInfo.appendChild(generatedText);

      // Right side - Transaction ID and security
      const metadataInfo = document.createElement('div');
      metadataInfo.style.textAlign = 'right';

      const transactionId = document.createElement('div');
      transactionId.style.fontSize = '22px';
      transactionId.style.fontWeight = '600';
      transactionId.style.color = theme === 'dark' ? '#D1D5DB' : '#4B5563';
      transactionId.style.marginBottom = '8px';
      transactionId.textContent = `ID: ${transaction.id || 'N/A'}`;

      const securityText = document.createElement('div');
      securityText.style.fontSize = '20px';
      securityText.style.fontWeight = '500';
      securityText.style.color = theme === 'dark' ? '#6B7280' : '#9CA3AF';
      securityText.style.display = 'flex';
      securityText.style.alignItems = 'center';
      securityText.style.justifyContent = 'flex-end';
      securityText.style.gap = '8px';

      const securityIcon = document.createElement('div');
      securityIcon.style.width = '20px';
      securityIcon.style.height = '20px';
      securityIcon.style.backgroundColor = '#10B981';
      securityIcon.style.borderRadius = '50%';
      securityIcon.style.display = 'flex';
      securityIcon.style.alignItems = 'center';
      securityIcon.style.justifyContent = 'center';
      securityIcon.style.fontSize = '12px';
      securityIcon.style.color = '#FFFFFF';
      securityIcon.textContent = '✓';

      const securityLabel = document.createElement('span');
      securityLabel.textContent = 'Verified Receipt';

      securityText.appendChild(securityIcon);
      securityText.appendChild(securityLabel);

      metadataInfo.appendChild(transactionId);
      metadataInfo.appendChild(securityText);

      footerContent.appendChild(generationInfo);
      footerContent.appendChild(metadataInfo);
      footerSection.appendChild(footerContent);

      // Assemble main content
      contentWrapper.appendChild(headerSection);
      contentWrapper.appendChild(contentClone);

      // Assemble the receipt
      receiptContainer.appendChild(contentWrapper);
      receiptContainer.appendChild(footerSection);

      // Add to document temporarily for rendering
      document.body.appendChild(receiptContainer);

      // Capture the receipt with html2canvas
      const canvas = await html2canvas(receiptContainer, {
        backgroundColor: theme === 'dark' ? '#0D0D0D' : '#FFFFFF',
        width: 1080,
        height: 1920,
        scale: 1, // Use 1:1 scale since we're already at target resolution
        useCORS: true,
        allowTaint: true,
        logging: false,
        imageTimeout: 0,
        removeContainer: false,
      });

      // Remove the receipt container from document
      document.body.removeChild(receiptContainer);

      // Convert to high-quality image and download
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      const link = document.createElement('a');
      const fileTimestamp = new Date().toISOString().slice(0, 10);
      link.download = `duitr-receipt-${fileTimestamp}-${transaction.id || 'transaction'}.jpg`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Success',
        description: 'Invoice downloaded!',
      });
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: 'Error',
        description: 'Failed to download invoice. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const { bgColor, innerBgColor } = getSuccessIconColors();

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetPortal>
        <SheetOverlay className="bg-black/70" onClick={handleClose} />
        <SheetPrimitive.Content
          className="fixed bottom-0 left-0 right-0 z-50 mt-24 p-0 bg-card border-none rounded-t-[30px] max-w-md mx-auto shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom"
          onInteractOutside={handleClose}
          onEscapeKeyDown={handleClose}
        >
          <div className="pt-6 pb-10 px-6">
            {/* Header with title */}
            <div className="flex justify-center mb-4">
              <div className="w-12 h-1 bg-muted rounded-full" />
            </div>
            
            <h2 className="text-foreground text-xl font-bold text-center mb-6">Detail Transaksi</h2>
            
            {/* Main content that will be captured for download */}
            <div ref={contentRef} className="space-y-6">
              {/* Type icon and amount */}
              <div className="flex flex-col items-center mb-4">
                <div className={`rounded-full ${bgColor} w-20 h-20 flex items-center justify-center mb-6`}>
                  <div className={`rounded-full ${innerBgColor} w-16 h-16 flex items-center justify-center`}>
                    {type === 'expense' ? (
                      <ArrowDown className="w-10 h-10 text-white" />
                    ) : type === 'income' ? (
                      <ArrowUp className="w-10 h-10 text-white" />
                    ) : (
                      <ArrowLeftRight className="w-10 h-10 text-white" />
                    )}
                  </div>
                </div>
                
                <span className={`text-3xl font-bold ${getTypeColor()}`}>
                  {formatCurrency(amount)}
                </span>
              </div>
              
              {/* Transaction details card */}
              <Card className="bg-muted border-none rounded-xl p-5 text-card-foreground">
                <div className="space-y-5">
                  {/* Kategori */}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Kategori</span>
                    <div className="flex items-center gap-2">
                      <CategoryIcon 
                        category={transaction.categoryId} 
                        size="sm" 
                      />
                      <span className="font-medium">{getDisplayCategoryName(transaction)}</span>
                    </div>
                  </div>
                  
                  {/* Dompet */}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Dompet</span>
                    <span className="font-medium">{getWalletName(walletId)}</span>
                  </div>
                  
                  {/* Deskripsi */}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Deskripsi</span>
                    <span className="text-right font-medium">{description || '-'}</span>
                  </div>
                  
                  {/* Tanggal */}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Tanggal</span>
                    <span className="font-medium">{formatDate(date)}</span>
                  </div>
                  
                  {/* Jenis Transaksi */}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Jenis Transaksi</span>
                    <div className="flex items-center gap-2">
                      {getTypeIcon()}
                      <span className="font-medium">
                        {type === 'income' ? 'Pemasukan' : 
                         type === 'expense' ? 'Pengeluaran' : 'Transfer'}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
            
            {/* Action Buttons */}
            <div className="mt-8 space-y-3">
              <Button 
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-[50px] rounded-full"
                onClick={handleDownload}
                disabled={isDownloading}
                aria-label="Download transaction receipt"
              >
                {isDownloading ? 'Processing...' : 'Download Bukti'}
              </Button>
              
              <Button 
                className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 h-[50px] rounded-full"
                onClick={handleClose}
                aria-label="Go back to previous page"
              >
                Kembali
              </Button>
            </div>
          </div>
        </SheetPrimitive.Content>
      </SheetPortal>
    </Sheet>
  );
};

export default TransactionDetailPage; 
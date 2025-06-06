import React, { useRef, useState, useEffect } from 'react';
import { ArrowDown, ArrowUp, ArrowLeftRight, Pencil } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from '@/components/ui/date-picker';
import { FormattedInput } from '@/components/ui/formatted-input';
import { getLocalizedCategoriesByType } from '@/utils/categoryUtils';
import i18next from 'i18next';

interface TransactionDetailOverlayProps {
  transaction: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TransactionDetailOverlay: React.FC<TransactionDetailOverlayProps> = ({ 
  transaction, 
  open, 
  onOpenChange 
}) => {
  const { formatCurrency, wallets, getDisplayCategoryName, updateTransaction } = useFinance();
  const { toast } = useToast();
  const { t } = useTranslation();
  const contentRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const { theme } = useTheme();
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editedTransaction, setEditedTransaction] = useState<any>(null);
  const [categories, setCategories] = useState<{id: string | number; name: string}[]>([]);

  const handleClose = () => {
    if (isEditing) {
      // If in edit mode, cancel edit before closing
      handleCancelEdit();
    }
    onOpenChange(false);
  };

  // Initialize edited transaction when transaction data changes or overlay opens
  useEffect(() => {
    if (transaction) {
      setEditedTransaction({
        id: transaction.id,
        amount: transaction.amount,
        categoryId: transaction.categoryId,
        category: transaction.category,
        description: transaction.description,
        date: transaction.date,
        type: transaction.type,
        walletId: transaction.walletId
      });
      
      // Reset editing mode when transaction changes
      setIsEditing(false);
    }
  }, [transaction, open]);
  
  // Load categories when needed
  useEffect(() => {
    const loadCategories = async () => {
      if (transaction && transaction.type !== 'transfer' && isEditing) {
        try {
          const type = transaction.type === 'income' ? 'income' : 'expense';
          const fetchedCategories = await getLocalizedCategoriesByType(type);
          
          // Sort categories by ID to maintain consistent order
          const sortedCategories = [...fetchedCategories].sort((a, b) => {
            // Ensure IDs are treated as numbers for comparison
            const idA = typeof a.id === 'number' ? a.id : Number(a.id);
            const idB = typeof b.id === 'number' ? b.id : Number(b.id);
            return idA - idB;
          });
          
          setCategories(sortedCategories);
        } catch (error) {
          console.error('Error loading categories:', error);
          toast({
            title: t('common.error'),
            description: t('categories.error.load'),
            variant: 'destructive'
          });
        }
      }
    };
    
    loadCategories();
  }, [transaction, isEditing, t]);

  if (!transaction || !editedTransaction) {
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
  
  // Handle form field change
  const handleChange = (field: string, value: any) => {
    setEditedTransaction({
      ...editedTransaction,
      [field]: value
    });
  };

  // Handle amount change for formatted input
  const handleAmountChange = (value: string) => {
    setEditedTransaction({
      ...editedTransaction,
      amount: value.replace(/\./g, '')
    });
  };

  // Handle amount value change for formatted input
  const handleAmountValueChange = (numericValue: number) => {
    setEditedTransaction({
      ...editedTransaction,
      amount: numericValue
    });
  };
  
  // Cancel edit and revert changes
  const handleCancelEdit = () => {
    setIsEditing(false);
    
    if (transaction) {
      setEditedTransaction({
        id: transaction.id,
        amount: transaction.amount,
        categoryId: transaction.categoryId,
        category: transaction.category,
        description: transaction.description,
        date: transaction.date,
        type: transaction.type,
        walletId: transaction.walletId
      });
    }
  };
  
  // Save transaction changes
  const handleSave = async () => {
    try {
      await updateTransaction({
        ...transaction,
        amount: parseFloat(editedTransaction.amount),
        categoryId: editedTransaction.categoryId,
        description: editedTransaction.description || '',
        date: editedTransaction.date,
        walletId: editedTransaction.walletId
      });
      
      setIsEditing(false);
      toast({
        title: t('common.success'),
        description: t('transactions.update_success') || 'Transaction updated successfully',
      });
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast({
        title: t('common.error'),
        description: t('transactions.update_error') || 'Failed to update transaction',
        variant: 'destructive'
      });
    }
  };

  // Download transaction details as JPG
  const handleDownload = async () => {
    if (!contentRef.current) return;

    setIsDownloading(true);
    try {
      // Create a clone of the content to manipulate
      const contentClone = contentRef.current.cloneNode(true) as HTMLElement;
      
      // Style the cloned element for better image output
      contentClone.style.backgroundColor = '#FFFFFF';
      contentClone.style.color = '#000000';
      contentClone.style.padding = '20px';
      contentClone.style.borderRadius = '15px';
      contentClone.style.width = '600px';
      contentClone.style.maxWidth = '600px';
      
      // Find and adjust text colors in the clone
      const coloredElements = contentClone.querySelectorAll('[class*="text-[#"]');
      coloredElements.forEach((element) => {
        (element as HTMLElement).style.color = '#000000';
      });
      
      // Find labels and make them darker for better contrast on white background
      const labelElements = contentClone.querySelectorAll('[class*="text-[#CCCCCC]"]');
      labelElements.forEach((element) => {
        (element as HTMLElement).style.color = '#666666';
      });
      
      // Add footer text
      const footer = document.createElement('div');
      footer.textContent = 'Generated by duitR';
      footer.style.color = '#666666';
      footer.style.fontSize = '10px';
      footer.style.textAlign = 'center';
      footer.style.marginTop = '20px';
      contentClone.appendChild(footer);

      // Put the clone in the document temporarily
      document.body.appendChild(contentClone);
      
      // Use html2canvas to capture the clone
      const canvas = await html2canvas(contentClone, {
        backgroundColor: '#FFFFFF',
        scale: 2, // Higher resolution
      });
      
      // Remove the clone from the document
      document.body.removeChild(contentClone);
      
      // Convert canvas to a data URL and trigger download
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      const link = document.createElement('a');
      link.download = 'transaction-details.jpg';
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
    <Sheet open={open} onOpenChange={(newOpen) => {
      if (!newOpen && isEditing) {
        // If attempting to close while editing, cancel edit first
        handleCancelEdit();
      }
      onOpenChange(newOpen);
    }}>
      <SheetPortal>
        <SheetOverlay className="bg-black/70" onClick={handleClose} />
        <SheetPrimitive.Content
          className="fixed bottom-0 left-0 right-0 z-50 mt-24 p-0 bg-card border-none rounded-t-[30px] max-w-md mx-auto shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom"
          onInteractOutside={(e) => {
            // Prevent closing when interacting with date picker
            if ((e.target as HTMLElement).closest('.rdp')) {
              e.preventDefault();
              return;
            }
            handleClose();
          }}
          onEscapeKeyDown={handleClose}
        >
          <div className="pt-6 pb-10 px-6">
            {/* Header with title and edit button */}
            <div className="flex justify-center mb-4">
              <div className="w-12 h-1 bg-muted rounded-full" />
            </div>
            
            <div className="relative mb-6">
              <h2 className="text-foreground text-xl font-bold text-center">Detail Transaksi</h2>
              
              {!isEditing && (
                <button 
                  onClick={() => setIsEditing(true)} 
                  className="absolute right-0 top-0 rounded-full p-2 bg-muted hover:bg-muted/80 text-foreground transition-colors"
                  aria-label="Edit transaction"
                >
                  <Pencil size={18} />
                </button>
              )}
            </div>
            
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
                
                {isEditing ? (
                  <div className="w-full px-4">
                    <Label htmlFor="amount" className="text-muted-foreground mb-1 block">
                      {t('transactions.amount')}
                    </Label>
                    <FormattedInput 
                      id="amount"
                      value={editedTransaction.amount?.toString() || ''}
                      onChange={handleAmountChange}
                      onValueChange={handleAmountValueChange}
                      className="bg-muted border-0 text-foreground"
                    />
                  </div>
                ) : (
                  <span className={`text-3xl font-bold ${getTypeColor()}`}>
                    {formatCurrency(amount)}
                  </span>
                )}
              </div>
              
              {/* Transaction details card */}
              <Card className="bg-muted border-none rounded-xl p-5 text-card-foreground">
                <div className="space-y-5">
                  {/* Kategori */}
                  {isEditing && transaction.type !== 'transfer' ? (
                    <div className="space-y-2">
                      <Label htmlFor="category" className="text-muted-foreground">
                        Kategori
                      </Label>
                      <Select 
                        value={String(editedTransaction.categoryId)} 
                        onValueChange={(value) => handleChange('categoryId', value)}
                      >
                        <SelectTrigger className="bg-card border-muted-foreground/20 text-foreground">
                          <SelectValue placeholder="Pilih kategori" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-muted-foreground/20 text-foreground max-h-[300px]">
                          {categories.map((category) => (
                            <SelectItem 
                              key={category.id} 
                              value={String(category.id)}
                              className="hover:bg-muted/50 focus:bg-muted/50"
                            >
                              <div className="flex items-center">
                                <CategoryIcon category={String(category.id)} size="sm" />
                                <span className="ml-2">{category.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
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
                  )}
                  
                  {/* Dompet */}
                  {isEditing ? (
                    <div className="space-y-2">
                      <Label htmlFor="wallet" className="text-muted-foreground">
                        Dompet
                      </Label>
                      <Select 
                        value={editedTransaction.walletId} 
                        onValueChange={(value) => handleChange('walletId', value)}
                      >
                        <SelectTrigger className="bg-card border-muted-foreground/20 text-foreground">
                          <SelectValue placeholder="Pilih dompet" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-muted-foreground/20 text-foreground">
                          {wallets.map((wallet) => (
                            <SelectItem 
                              key={wallet.id} 
                              value={wallet.id}
                              className="hover:bg-muted/50 focus:bg-muted/50"
                            >
                              {wallet.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Dompet</span>
                      <span className="font-medium">{getWalletName(walletId)}</span>
                    </div>
                  )}
                  
                  {/* Deskripsi */}
                  {isEditing ? (
                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-muted-foreground">
                        Deskripsi
                      </Label>
                      <Input 
                        id="description"
                        value={editedTransaction.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        className="bg-card border-muted-foreground/20 text-foreground"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Deskripsi</span>
                      <span className="text-right font-medium">{description || '-'}</span>
                    </div>
                  )}
                  
                  {/* Tanggal */}
                  {isEditing ? (
                    <div className="space-y-2">
                      <Label htmlFor="date" className="text-muted-foreground">
                        Tanggal
                      </Label>
                      <div className="bg-card rounded-md border border-muted-foreground/20">
                        <DatePicker 
                          date={editedTransaction.date ? new Date(editedTransaction.date) : undefined}
                          setDate={(date) => {
                            if (date) {
                              // Use the full ISO string to preserve timezone information
                              const correctedDate = new Date(
                                date.getFullYear(),
                                date.getMonth(),
                                date.getDate(),
                                12, 0, 0
                              ).toISOString();
                              setEditedTransaction({ 
                                ...editedTransaction, 
                                date: correctedDate
                              });
                            } else {
                              setEditedTransaction({
                                ...editedTransaction,
                                date: ''
                              });
                            }
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Tanggal</span>
                      <span className="font-medium">{formatDate(date)}</span>
                    </div>
                  )}
                  
                  {/* Jenis Transaksi - non-editable */}
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
              {isEditing ? (
                <>
                  <Button 
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-[50px] rounded-full"
                    onClick={handleSave}
                    aria-label="Save transaction changes"
                  >
                    Simpan Perubahan
                  </Button>
                  
                  <Button 
                    className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 h-[50px] rounded-full"
                    onClick={handleCancelEdit}
                    aria-label="Cancel editing"
                  >
                    Batal
                  </Button>
                </>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>
        </SheetPrimitive.Content>
      </SheetPortal>
    </Sheet>
  );
};

export default TransactionDetailOverlay;

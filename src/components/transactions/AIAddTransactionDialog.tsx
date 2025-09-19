import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, Clock, Send, Sparkles, Wallet, XCircle, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AITransactionService, type ParsedTransaction, type AIAddTransactionResponse } from '@/services/aiTransactionService';
import { useToast } from '@/hooks/use-toast';

interface AIAddTransactionDialogProps {
  open: boolean;
  onClose: () => void;
  addTransaction: (transaction: any) => Promise<void>;
  wallets: Array<{ id: string; name: string; currency?: string; balance: number }>;
  currencySymbol: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function AIAddTransactionDialog({ open, onClose, addTransaction, wallets, currencySymbol }: AIAddTransactionDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [parsedTransactions, setParsedTransactions] = useState<ParsedTransaction[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<{ id: string; name: string; currency?: string; balance: number } | null>(null);

  const aiService = AITransactionService.getInstance();

  // Initialize selected wallet when dialog opens or wallets change
  useEffect(() => {
    if (open && wallets.length > 0 && !selectedWallet) {
      setSelectedWallet(wallets[0]);
    }
  }, [open, wallets, selectedWallet]);

  // Initialize with welcome message
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        id: '1',
        role: 'assistant',
        content: t('ai.welcomeMessage', 'Halo! Saya bisa membantu Anda menambahkan transaksi secara cepat. Cukup ketik seperti:\n\n• makan nasi padang 10 ribu\n• belanja kemeja hitam 30rb\n• langganan spotify 50k\n\nSaya akan otomatis mengenali kategori dan mengatur transaksi Anda.'),
        timestamp: new Date()
      }]);
    }
  }, [open, messages.length, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const userInput = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      const response: AIAddTransactionResponse = await aiService.parseTransactionInput(userInput);

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);

      if (response.success && response.transactions.length > 0) {
        setParsedTransactions(response.transactions);
      } else if (response.error) {
        toast({
          title: t('common.error', 'Error'),
          description: response.error,
          variant: 'destructive'
        });
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: t('ai.parseError', 'Maaf, terjadi kesalahan saat memproses permintaan Anda. Silakan coba lagi.'),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);

      toast({
        title: t('common.error', 'Error'),
        description: t('ai.parseError', 'Failed to parse transactions'),
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmTransactions = async () => {
    if (parsedTransactions.length === 0) return;

    // Use selected wallet
    if (!selectedWallet) {
      toast({
        title: t('common.error', 'Error'),
        description: t('wallet.noWallet', 'No wallet selected'),
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const parsedTx of parsedTransactions) {
        try {
          const transaction = aiService.convertToTransactionFormat(parsedTx, selectedWallet.id);
          await addTransaction(transaction);
          successCount++;
        } catch (error) {
          console.error('Error adding transaction:', error);
          errorCount++;
        }
      }

      // Show result message
      const resultMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: successCount > 0
          ? t('ai.transactionsAdded', 'Berhasil menambahkan {{count}} transaksi!', { count: successCount })
          : t('ai.noTransactionsAdded', 'Tidak ada transaksi yang berhasil ditambahkan.'),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, resultMessage]);

      // Show toast
      if (successCount > 0) {
        toast({
          title: t('common.success', 'Success'),
          description: successCount === 1
            ? t('transaction.added', 'Transaction added successfully')
            : t('transaction.multipleAdded', '{{count}} transactions added successfully', { count: successCount }),
        });
      }

      if (errorCount > 0) {
        toast({
          title: t('common.warning', 'Warning'),
          description: t('transaction.someFailed', '{{count}} transactions failed to add', { count: errorCount }),
          variant: 'destructive'
        });
      }

      // Reset state
      setParsedTransactions([]);

      // Close dialog if successful
      if (successCount > 0 && errorCount === 0) {
        setTimeout(() => onClose(), 2000);
      }

    } catch (error) {
      console.error('Error processing transactions:', error);
      toast({
        title: t('common.error', 'Error'),
        description: t('transaction.processingError', 'Error processing transactions'),
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setParsedTransactions([]);
    setInput('');
  };

  const handleDeleteTransaction = (indexToDelete: number) => {
    setParsedTransactions(prev => prev.filter((_, index) => index !== indexToDelete));
  };

  const handleDialogClose = () => {
    // Reset all states when dialog closes
    setParsedTransactions([]);
    setInput('');
    setMessages([]);
    setSelectedWallet(null);
    onClose();
  };

  const formatAmount = (amount: number) => {
    return `${currencySymbol}${amount.toLocaleString('id-ID')}`;
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col bg-[#0D0D0D] border-[#242425]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Sparkles className="w-5 h-5 text-[#C6FE1E]" />
            {t('ai.addWithAI', 'Add Transactions with AI')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-gray-900 rounded-lg max-h-96">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-2 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-[#C6FE1E] text-black'
                    }`}>
                      {message.role === 'user' ?
                        <span className="text-xs font-semibold">U</span> :
                        <Sparkles className="w-4 h-4" />
                      }
                    </div>
                    <div className={`p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 border border-gray-700 text-gray-100'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className={`text-xs mt-1 opacity-70`}>
                        {message.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2 justify-start"
                >
                  <div className="flex gap-2 max-w-[80%]">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-[#C6FE1E] text-black">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="p-3 rounded-lg bg-gray-800 border border-gray-700">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin w-4 h-4 border-2 border-[#C6FE1E] border-t-transparent rounded-full"></div>
                        <span className="text-sm text-gray-300">{t('ai.processing', 'Processing...')}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Parsed Transactions Preview */}
          {parsedTransactions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-white">
                  {t('ai.parsedTransactions', 'Parsed Transactions')}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="text-gray-400 hover:text-white"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  {t('common.reset', 'Reset')}
                </Button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {parsedTransactions.map((tx, index) => (
                  <Card key={index} className="bg-gray-800 border-gray-700">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-sm font-medium text-white">
                              {tx.description}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                            <span className="bg-gray-700 px-2 py-1 rounded">
                              {tx.category}
                            </span>
                            <span className="font-medium text-white">
                              {formatAmount(tx.amount)}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTransaction(index)}
                          className="text-gray-400 hover:text-red-400 hover:bg-red-950/20 p-2 h-8 w-8"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Wallet Selector */}
              <div className="pt-2 border-t border-gray-700 space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-[#C6FE1E]" />
                    {t('wallet.selectWallet', 'Select Wallet')}
                  </label>
                  <Select
                    value={selectedWallet?.id || ''}
                    onValueChange={(value) => {
                      const wallet = wallets.find(w => w.id === value);
                      if (wallet) setSelectedWallet(wallet);
                    }}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder={t('wallet.selectWallet', 'Select a wallet')} />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {wallets.map((wallet) => (
                        <SelectItem 
                          key={wallet.id} 
                          value={wallet.id}
                          className="text-white hover:bg-gray-700 focus:bg-gray-700"
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-medium">{wallet.name}</span>
                            <span className="text-sm text-gray-400 ml-2">
                              {formatAmount(wallet.balance)}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-end">
                  <Button
                    onClick={handleConfirmTransactions}
                    disabled={isProcessing || !selectedWallet}
                    className="bg-[#C6FE1E] text-black hover:bg-[#B5E619] disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        {t('common.processing', 'Processing...')}
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {t('common.confirm', 'Confirm')} ({parsedTransactions.length})
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('ai.transactionPlaceholder', 'Contoh: makan nasi padang 10 ribu, belanja kemeja 30rb, langganan spotify 50k')}
              className="min-h-[80px] resize-none bg-gray-800 border-gray-700 text-white placeholder-gray-400"
              disabled={isLoading || parsedTransactions.length > 0}
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={!input.trim() || isLoading || parsedTransactions.length > 0}
                className="flex items-center gap-2 bg-[#C6FE1E] text-black hover:bg-[#B5E619]"
              >
                <Send className="w-4 h-4" />
                {t('ai.parse', 'Parse')}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
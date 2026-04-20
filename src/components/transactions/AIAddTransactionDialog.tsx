import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, Clock, Send, Sparkles, Wallet, XCircle, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AITransactionService, type ParsedTransaction, type AIAddTransactionResponse } from '@/services/aiTransactionService';
import type { Transaction } from '@/types/finance';
import { useToast } from '@/hooks/use-toast';

interface AIAddTransactionDialogProps {
  open: boolean;
  onClose: () => void;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'userId'>) => Promise<void>;
  wallets: Array<{ id: string; name: string; currency?: string; balance: number }>;
  currencySymbol: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface EditableParsedTransaction extends ParsedTransaction {
  id: string;
  original: ParsedTransaction;
}

export function AIAddTransactionDialog({ open, onClose, addTransaction, wallets, currencySymbol }: AIAddTransactionDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [parsedTransactions, setParsedTransactions] = useState<EditableParsedTransaction[]>([]);
  const [parseStatus, setParseStatus] = useState<'idle' | 'empty' | 'success'>('idle');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<{ id: string; name: string; currency?: string; balance: number } | null>(null);

  const aiService = AITransactionService.getInstance();

  // Initialize selected wallet when dialog opens or wallets change
  useEffect(() => {
    setSelectedWallet(prev => {
      if (!open || wallets.length === 0) return null;

      const prevStillExists = prev && wallets.some(wallet => wallet.id === prev.id);
      return (!prev || !prevStillExists) ? wallets[0] : prev;
    });
  }, [open, wallets]);

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

  const buildEditableTransaction = (transaction: ParsedTransaction, index: number): EditableParsedTransaction => ({
    ...transaction,
    id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
    original: { ...transaction }
  });

  const getTransactionValidation = (transaction: EditableParsedTransaction) => {
    const errors: string[] = [];

    if (!Number.isFinite(transaction.amount) || transaction.amount <= 0) {
      errors.push(t('ai.validation.amountPositive', 'Amount must be greater than 0'));
    }

    if (!transaction.description.trim()) {
      errors.push(t('ai.validation.descriptionRequired', 'Description is required'));
    }

    if (!transaction.category.trim()) {
      errors.push(t('ai.validation.categoryRequired', 'Category is required'));
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const updateParsedTransaction = (
    transactionId: string,
    field: 'description' | 'amount' | 'category' | 'type',
    value: string | number
  ) => {
    setParsedTransactions(prev => prev.map(transaction => {
      if (transaction.id !== transactionId) return transaction;

      const nextTransaction: EditableParsedTransaction = {
        ...transaction,
        [field]: value,
        categoryId: aiService.resolveCategoryId(
          field === 'category' ? String(value) : transaction.category,
          field === 'type' ? value as 'income' | 'expense' : transaction.type
        )
      };

      return nextTransaction;
    }));
  };

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
        setParseStatus('success');
        setParsedTransactions(response.transactions.map((transaction, index) => buildEditableTransaction(transaction, index)));
      } else if (response.success) {
        setParseStatus('empty');
        setParsedTransactions([]);
      } else {
        setParseStatus('idle');
        toast({
          title: t('common.error', 'Error'),
          description: t('ai.parseErrorToast', 'We could not parse your input. Try a different example or make it clearer, then try again.'),
          variant: 'destructive'
        });
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: t('ai.parseError', 'I couldn\'t parse that. Try another example and I\'ll take another look.'),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);

      toast({
        title: t('common.error', 'Error'),
        description: t('ai.parseErrorToast', 'We could not parse your input. Try a different example or make it clearer, then try again.'),
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmTransactions = async () => {
    const validationResults = parsedTransactions.map(transaction => ({
      transaction,
      validation: getTransactionValidation(transaction)
    }));

    const validTransactions = validationResults.filter(({ validation }) => validation.isValid).map(({ transaction }) => transaction);
    const invalidTransactions = validationResults.filter(({ validation }) => !validation.isValid).map(({ transaction }) => transaction);

    if (validTransactions.length === 0) return;

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
      const failedTransactions: EditableParsedTransaction[] = [];

      for (const parsedTx of validTransactions) {
        try {
          aiService.recordCorrectionHint(parsedTx.original, parsedTx);
          const transaction = aiService.convertToTransactionFormat(parsedTx, selectedWallet.id);
          await addTransaction(transaction);
          successCount++;
        } catch (error) {
          console.error('Error adding transaction:', error);
          errorCount++;
          failedTransactions.push(parsedTx);
        }
      }

      const remainingTransactions = [...invalidTransactions, ...failedTransactions];

      const resultMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: successCount > 0
          ? t('ai.transactionsAdded', 'Berhasil menambahkan {{count}} transaksi!', { count: successCount })
          : t('ai.noTransactionsAdded', 'Tidak ada transaksi yang berhasil ditambahkan.'),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, resultMessage]);

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

      setParsedTransactions(remainingTransactions);

      if (remainingTransactions.length === 0 && successCount > 0 && errorCount === 0) {
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
    setParseStatus('idle');
    setInput('');
  };

  const handleDeleteTransaction = (transactionId: string) => {
    setParsedTransactions(prev => prev.filter(transaction => transaction.id !== transactionId));
  };

  const handleDialogClose = () => {
    // Reset all states when dialog closes
    setParsedTransactions([]);
    setParseStatus('idle');
    setInput('');
    setMessages([]);
    setSelectedWallet(null);
    onClose();
  };

  const formatAmount = (amount: number) => {
    return `${currencySymbol}${amount.toLocaleString('id-ID')}`;
  };

  const getConfidenceMeta = (confidence: number) => {
    const score = Number.isFinite(confidence) ? Math.max(0, Math.min(1, confidence)) : 0;

    if (score >= 0.9) {
      return {
        label: t('ai.confidence.high', 'High confidence'),
        hint: t('ai.reviewHint.high', 'Looks good — quick check only.'),
        variant: 'default' as const,
      };
    }

    if (score >= 0.75) {
      return {
        label: t('ai.confidence.medium', 'Medium confidence'),
        hint: t('ai.reviewHint.medium', 'Review the category before saving.'),
        variant: 'secondary' as const,
      };
    }

    return {
      label: t('ai.confidence.low', 'Low confidence'),
      hint: t('ai.reviewHint.low', 'Double-check the category and amount.'),
      variant: 'destructive' as const,
    };
  };

  const validTransactionCount = parsedTransactions.filter(transaction => getTransactionValidation(transaction).isValid).length;

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
          {(parsedTransactions.length > 0 || parseStatus === 'empty') && (
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
                {parsedTransactions.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    className="text-gray-400 hover:text-white"
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    {t('common.reset', 'Reset')}
                  </Button>
                )}
              </div>

              <p className="text-xs text-gray-400">
                {t('ai.editBeforeSaving', 'You can edit the AI output before saving.')}
              </p>

              {parseStatus === 'empty' && parsedTransactions.length === 0 ? (
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-white">
                      <Sparkles className="w-4 h-4 text-[#C6FE1E]" />
                      <span>{t('ai.noTransactionsParsedTitle', 'No transactions were parsed')}</span>
                    </div>
                    <p className="text-sm text-gray-300">
                      {t('ai.noTransactionsParsedDescription', 'Try a different example, or edit the AI output after parsing.')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t('ai.noTransactionsParsedHint', 'If the AI parses something, you can still edit it before saving.')}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {parsedTransactions.map((tx, index) => {
                    const validation = getTransactionValidation(tx);
                    const amountValue = tx.amount > 0 ? tx.amount : '';
                    const confidenceMeta = getConfidenceMeta(tx.confidence || 0);

                    return (
                      <Card
                        key={tx.id}
                        className={`bg-gray-800 border ${validation.isValid ? 'border-gray-700' : 'border-red-500/40'}`}
                      >
                        <CardContent className="p-3 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 space-y-3">
                              <div className="flex items-center gap-2 text-xs text-gray-400">
                                {validation.isValid ? (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-red-400" />
                                )}
                                <span>{t('ai.transactionRow', 'Row')} {index + 1}</span>
                                <span>•</span>
                                <Badge variant={confidenceMeta.variant} className="rounded-full px-2 py-0 text-[10px] uppercase tracking-wide">
                                  {confidenceMeta.label}
                                </Badge>
                                <span className="text-[10px] text-gray-500">{Math.round((tx.confidence || 0) * 100)}%</span>
                              </div>

                              {tx.reason?.trim() && (
                                <p className="text-xs text-gray-400 leading-snug">
                                  {t('ai.categoryReason', 'Why')}: {tx.reason}
                                </p>
                              )}

                              <p className="text-xs text-gray-500 leading-snug">
                                {t('ai.reviewHint.label', 'Review hint')}: {confidenceMeta.hint}
                              </p>

                              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                <div className="space-y-1">
                                  <label htmlFor={`tx-description-${tx.id}`} className="text-xs font-medium text-gray-300">
                                    {t('ai.description', 'Description')} {index + 1}
                                  </label>
                                  <Input
                                    id={`tx-description-${tx.id}`}
                                    value={tx.description}
                                    onChange={(e) => updateParsedTransaction(tx.id, 'description', e.target.value)}
                                    className={`bg-gray-900 border-gray-700 text-white placeholder-gray-400 ${!tx.description.trim() ? 'border-red-500/50 focus-visible:ring-red-500/30' : ''}`}
                                    placeholder={t('ai.descriptionPlaceholder', 'Description')}
                                    aria-invalid={!tx.description.trim()}
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label htmlFor={`tx-amount-${tx.id}`} className="text-xs font-medium text-gray-300">
                                    {t('ai.amount', 'Amount')} {index + 1}
                                  </label>
                                  <Input
                                    id={`tx-amount-${tx.id}`}
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    inputMode="decimal"
                                    value={amountValue}
                                    onChange={(e) => {
                                      const parsedAmount = e.target.value === '' ? 0 : Number(e.target.value);
                                      updateParsedTransaction(tx.id, 'amount', Number.isFinite(parsedAmount) ? parsedAmount : 0);
                                    }}
                                    className={`bg-gray-900 border-gray-700 text-white placeholder-gray-400 ${tx.amount <= 0 ? 'border-red-500/50 focus-visible:ring-red-500/30' : ''}`}
                                    placeholder="0"
                                    aria-invalid={tx.amount <= 0}
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label htmlFor={`tx-category-${tx.id}`} className="text-xs font-medium text-gray-300">
                                    {t('ai.category', 'Category')} {index + 1}
                                  </label>
                                  <Input
                                    id={`tx-category-${tx.id}`}
                                    value={tx.category}
                                    onChange={(e) => updateParsedTransaction(tx.id, 'category', e.target.value)}
                                    className={`bg-gray-900 border-gray-700 text-white placeholder-gray-400 ${!tx.category.trim() ? 'border-red-500/50 focus-visible:ring-red-500/30' : ''}`}
                                    placeholder={t('ai.categoryPlaceholder', 'Category')}
                                    aria-invalid={!tx.category.trim()}
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label id={`tx-type-${tx.id}`} className="text-xs font-medium text-gray-300">
                                    {t('ai.type', 'Type')} {index + 1}
                                  </label>
                                  <Select
                                    value={tx.type}
                                    onValueChange={(value) => updateParsedTransaction(tx.id, 'type', value as 'income' | 'expense')}
                                  >
                                    <SelectTrigger
                                      aria-labelledby={`tx-type-${tx.id}`}
                                      className="bg-gray-900 border-gray-700 text-white"
                                    >
                                      <SelectValue placeholder={t('ai.type', 'Type')} />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-800 border-gray-700">
                                      <SelectItem value="expense" className="text-white hover:bg-gray-700 focus:bg-gray-700">
                                        {t('transactions.expense', 'Expense')}
                                      </SelectItem>
                                      <SelectItem value="income" className="text-white hover:bg-gray-700 focus:bg-gray-700">
                                        {t('transactions.income', 'Income')}
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              {!validation.isValid && (
                                <p className="text-xs text-red-400">
                                  {validation.errors.join(' • ')}
                                </p>
                              )}
                            </div>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTransaction(tx.id)}
                              className="text-gray-400 hover:text-red-400 hover:bg-red-950/20 p-2 h-8 w-8 flex-shrink-0"
                              aria-label={`${t('common.delete', 'Delete')} ${index + 1}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* Wallet Selector */}
              {parsedTransactions.length > 0 && (
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
                      disabled={isProcessing || !selectedWallet || validTransactionCount === 0}
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
                          {t('ai.reviewAndConfirm', 'Review & confirm')} ({validTransactionCount})
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
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

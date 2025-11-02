/**
 * PinjamanContext
 * 
 * Specialized context for loan/credit (pinjaman) management.
 * Handles CRUD operations for debts (Utang) and credits (Piutang).
 * 
 * Features:
 * - Loan/credit state management
 * - Settlement tracking
 * - Category-based filtering (Utang vs Piutang)
 * - Due date monitoring
 * 
 * Performance Optimizations:
 * - Memoized filtered lists
 * - Stable function references
 * - Independent state management
 */

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { PinjamanItem } from '@/types/finance';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface PinjamanContextType {
  pinjamanItems: PinjamanItem[];
  isLoading: boolean;
  settledItems: PinjamanItem[];
  unsettledItems: PinjamanItem[];
  totalDebt: number; // Total Utang (debts)
  totalCredit: number; // Total Piutang (credits)
  netPosition: number; // Credit - Debt
  addPinjamanItem: (item: Omit<PinjamanItem, 'id' | 'user_id' | 'created_at' | 'is_settled'>) => Promise<void>;
  updatePinjamanItem: (item: PinjamanItem) => Promise<void>;
  deletePinjamanItem: (id: string) => Promise<void>;
  toggleSettled: (id: string) => Promise<void>;
  getItemsByCategory: (category: 'Utang' | 'Piutang') => PinjamanItem[];
  getOverdueItems: () => PinjamanItem[];
  refreshItems: () => Promise<void>;
}

const PinjamanContext = createContext<PinjamanContextType | undefined>(undefined);

interface PinjamanProviderProps {
  children: ReactNode;
}

export const PinjamanProvider: React.FC<PinjamanProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [pinjamanItems, setPinjamanItems] = useState<PinjamanItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Load pinjaman items from database
   */
  const loadItems = useCallback(async () => {
    if (!user) {
      setPinjamanItems([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('pinjaman_items')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) {
        console.warn('Error loading pinjaman_items:', error.message);
        setPinjamanItems([]);
      } else {
        const formattedItems = data.map(item => ({
          id: item.id,
          user_id: item.user_id,
          name: item.name,
          icon: item.icon,
          category: item.category as 'Utang' | 'Piutang',
          due_date: item.due_date,
          amount: item.amount,
          is_settled: item.is_settled,
          created_at: item.created_at
        }));
        
        // Sort by due date
        const sortedItems = formattedItems.sort(
          (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        );
        
        setPinjamanItems(sortedItems);
      }
    } catch (error: any) {
      console.error('Error loading pinjaman items:', error);
      setPinjamanItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  /**
   * Initial load
   */
  useEffect(() => {
    loadItems();
  }, [loadItems]);

  /**
   * Memoized filtered lists
   */
  const settledItems = useMemo(() => {
    return pinjamanItems.filter(item => item.is_settled);
  }, [pinjamanItems]);

  const unsettledItems = useMemo(() => {
    return pinjamanItems.filter(item => !item.is_settled);
  }, [pinjamanItems]);

  const totalDebt = useMemo(() => {
    return unsettledItems
      .filter(item => item.category === 'Utang')
      .reduce((sum, item) => sum + item.amount, 0);
  }, [unsettledItems]);

  const totalCredit = useMemo(() => {
    return unsettledItems
      .filter(item => item.category === 'Piutang')
      .reduce((sum, item) => sum + item.amount, 0);
  }, [unsettledItems]);

  const netPosition = useMemo(() => {
    return totalCredit - totalDebt;
  }, [totalCredit, totalDebt]);

  /**
   * Add a new pinjaman item
   */
  const addPinjamanItem = useCallback(async (
    item: Omit<PinjamanItem, 'id' | 'user_id' | 'created_at' | 'is_settled'>
  ) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'Authentication required.' });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('pinjaman_items')
        .insert({
          name: item.name,
          category: item.category,
          due_date: item.due_date,
          amount: item.amount,
          icon: item.icon,
          user_id: user.id,
          is_settled: false
        })
        .select()
        .single();

      if (error) throw error;

      const formattedItem: PinjamanItem = {
        id: data.id,
        user_id: data.user_id,
        name: data.name,
        icon: data.icon,
        category: data.category,
        due_date: data.due_date,
        amount: data.amount,
        is_settled: data.is_settled,
        created_at: data.created_at
      };

      // Insert and re-sort by due date
      const updatedItems = [formattedItem, ...pinjamanItems].sort(
        (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      );
      
      setPinjamanItems(updatedItems);
      toast({ title: 'Success', description: 'Pinjaman item added.' });
    } catch (error: any) {
      console.error('Error adding Pinjaman item:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  }, [user, toast, pinjamanItems]);

  /**
   * Update an existing pinjaman item
   */
  const updatePinjamanItem = useCallback(async (item: PinjamanItem) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'Authentication required.' });
      return;
    }

    const { user_id, created_at, ...updateData } = item;

    // Store original for rollback
    const originalItems = [...pinjamanItems];
    
    // Optimistic update with re-sort
    const updatedItems = pinjamanItems
      .map(i => i.id === item.id ? item : i)
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
    
    setPinjamanItems(updatedItems);

    try {
      const { error } = await supabase
        .from('pinjaman_items')
        .update({
          name: updateData.name,
          category: updateData.category,
          due_date: updateData.due_date,
          amount: updateData.amount,
          icon: updateData.icon,
          is_settled: updateData.is_settled
        })
        .eq('id', item.id)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error: any) {
      // Rollback on error
      setPinjamanItems(originalItems);
      
      console.error('Error updating Pinjaman item:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  }, [user, toast, pinjamanItems]);

  /**
   * Delete a pinjaman item
   */
  const deletePinjamanItem = useCallback(async (id: string) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'Authentication required.' });
      return;
    }

    // Store original for rollback
    const originalItems = [...pinjamanItems];
    
    // Optimistic update
    setPinjamanItems(prev => prev.filter(i => i.id !== id));

    try {
      const { error } = await supabase
        .from('pinjaman_items')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({ title: 'Success', description: 'Pinjaman item deleted.' });
    } catch (error: any) {
      // Rollback on error
      setPinjamanItems(originalItems);
      
      console.error('Error deleting Pinjaman item:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  }, [user, toast, pinjamanItems]);

  /**
   * Toggle settled status
   */
  const toggleSettled = useCallback(async (id: string) => {
    const item = pinjamanItems.find(i => i.id === id);
    if (!item) return;

    await updatePinjamanItem({ ...item, is_settled: !item.is_settled });
  }, [pinjamanItems, updatePinjamanItem]);

  /**
   * Get items by category
   */
  const getItemsByCategory = useCallback((category: 'Utang' | 'Piutang'): PinjamanItem[] => {
    return pinjamanItems.filter(item => item.category === category && !item.is_settled);
  }, [pinjamanItems]);

  /**
   * Get overdue items (past due date and not settled)
   */
  const getOverdueItems = useCallback((): PinjamanItem[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return pinjamanItems.filter(item => {
      if (item.is_settled) return false;
      
      const dueDate = new Date(item.due_date);
      dueDate.setHours(0, 0, 0, 0);
      
      return dueDate < today;
    });
  }, [pinjamanItems]);

  /**
   * Refresh items from database
   */
  const refreshItems = useCallback(async () => {
    await loadItems();
  }, [loadItems]);

  const value = useMemo(() => ({
    pinjamanItems,
    isLoading,
    settledItems,
    unsettledItems,
    totalDebt,
    totalCredit,
    netPosition,
    addPinjamanItem,
    updatePinjamanItem,
    deletePinjamanItem,
    toggleSettled,
    getItemsByCategory,
    getOverdueItems,
    refreshItems,
  }), [
    pinjamanItems,
    isLoading,
    settledItems,
    unsettledItems,
    totalDebt,
    totalCredit,
    netPosition,
    addPinjamanItem,
    updatePinjamanItem,
    deletePinjamanItem,
    toggleSettled,
    getItemsByCategory,
    getOverdueItems,
    refreshItems,
  ]);

  return (
    <PinjamanContext.Provider value={value}>
      {children}
    </PinjamanContext.Provider>
  );
};

/**
 * Custom hook to use pinjaman context
 */
export const usePinjaman = (): PinjamanContextType => {
  const context = useContext(PinjamanContext);
  if (context === undefined) {
    throw new Error('usePinjaman must be used within a PinjamanProvider');
  }
  return context;
};

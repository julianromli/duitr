/**
 * WantToBuyContext
 * 
 * Specialized context for wishlist/want-to-buy item management.
 * Handles CRUD operations for items users want to purchase.
 * 
 * Features:
 * - Wishlist item state management
 * - Purchase tracking
 * - Priority-based filtering
 * - Category-based filtering (Keinginan vs Kebutuhan)
 * 
 * Performance Optimizations:
 * - Memoized filtered lists
 * - Stable function references
 * - Independent state management
 */

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { WantToBuyItem } from '@/types/finance';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface WantToBuyContextType {
  wantToBuyItems: WantToBuyItem[];
  isLoading: boolean;
  purchasedItems: WantToBuyItem[];
  pendingItems: WantToBuyItem[];
  totalWishlistValue: number;
  addWantToBuyItem: (item: Omit<WantToBuyItem, 'id' | 'userId' | 'created_at' | 'is_purchased'>) => Promise<void>;
  updateWantToBuyItem: (item: WantToBuyItem) => Promise<void>;
  deleteWantToBuyItem: (id: string) => Promise<void>;
  togglePurchased: (id: string) => Promise<void>;
  getItemsByPriority: (priority: 'Tinggi' | 'Sedang' | 'Rendah') => WantToBuyItem[];
  getItemsByCategory: (category: 'Keinginan' | 'Kebutuhan') => WantToBuyItem[];
  refreshItems: () => Promise<void>;
}

const WantToBuyContext = createContext<WantToBuyContextType | undefined>(undefined);

interface WantToBuyProviderProps {
  children: ReactNode;
}

export const WantToBuyProvider: React.FC<WantToBuyProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [wantToBuyItems, setWantToBuyItems] = useState<WantToBuyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Load want-to-buy items from database
   */
  const loadItems = useCallback(async () => {
    if (!user) {
      setWantToBuyItems([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('want_to_buy_items')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) {
        console.warn('Error loading want_to_buy_items:', error.message);
        setWantToBuyItems([]);
      } else {
        const formattedItems = data.map(item => ({
          id: item.id,
          userId: item.user_id,
          name: item.name,
          icon: item.icon,
          price: item.price,
          category: item.category as 'Keinginan' | 'Kebutuhan',
          estimated_date: item.estimated_date,
          priority: item.priority as 'Tinggi' | 'Sedang' | 'Rendah',
          is_purchased: item.is_purchased,
          created_at: item.created_at
        }));
        setWantToBuyItems(formattedItems);
      }
    } catch (error: any) {
      console.error('Error loading want-to-buy items:', error);
      setWantToBuyItems([]);
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
  const purchasedItems = useMemo(() => {
    return wantToBuyItems.filter(item => item.is_purchased);
  }, [wantToBuyItems]);

  const pendingItems = useMemo(() => {
    return wantToBuyItems.filter(item => !item.is_purchased);
  }, [wantToBuyItems]);

  const totalWishlistValue = useMemo(() => {
    return pendingItems.reduce((sum, item) => sum + item.price, 0);
  }, [pendingItems]);

  /**
   * Add a new want-to-buy item
   */
  const addWantToBuyItem = useCallback(async (
    item: Omit<WantToBuyItem, 'id' | 'userId' | 'created_at' | 'is_purchased'>
  ) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'Authentication required.' });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('want_to_buy_items')
        .insert({
          name: item.name,
          price: item.price,
          category: item.category,
          priority: item.priority,
          estimated_date: item.estimated_date,
          icon: item.icon,
          user_id: user.id,
          is_purchased: false
        })
        .select()
        .single();

      if (error) throw error;

      const formattedItem: WantToBuyItem = {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        icon: data.icon,
        price: data.price,
        category: data.category,
        estimated_date: data.estimated_date,
        priority: data.priority,
        is_purchased: data.is_purchased,
        created_at: data.created_at
      };

      setWantToBuyItems(prev => [formattedItem, ...prev]);
      toast({ title: 'Success', description: 'Wishlist item added.' });
    } catch (error: any) {
      console.error('Error adding WantToBuy item:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  }, [user, toast]);

  /**
   * Update an existing want-to-buy item
   */
  const updateWantToBuyItem = useCallback(async (item: WantToBuyItem) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'Authentication required.' });
      return;
    }

    const { userId, created_at, ...updateData } = item;

    // Store original for rollback
    const originalItems = [...wantToBuyItems];
    
    // Optimistic update
    setWantToBuyItems(prev => prev.map(i => i.id === item.id ? item : i));

    try {
      const { error } = await supabase
        .from('want_to_buy_items')
        .update(updateData)
        .eq('id', item.id)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error: any) {
      // Rollback on error
      setWantToBuyItems(originalItems);
      
      console.error('Error updating WantToBuy item:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  }, [user, toast, wantToBuyItems]);

  /**
   * Delete a want-to-buy item
   */
  const deleteWantToBuyItem = useCallback(async (id: string) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'Authentication required.' });
      return;
    }

    // Store original for rollback
    const originalItems = [...wantToBuyItems];
    
    // Optimistic update
    setWantToBuyItems(prev => prev.filter(i => i.id !== id));

    try {
      const { error } = await supabase
        .from('want_to_buy_items')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({ title: 'Success', description: 'Wishlist item deleted.' });
    } catch (error: any) {
      // Rollback on error
      setWantToBuyItems(originalItems);
      
      console.error('Error deleting WantToBuy item:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  }, [user, toast, wantToBuyItems]);

  /**
   * Toggle purchased status
   */
  const togglePurchased = useCallback(async (id: string) => {
    const item = wantToBuyItems.find(i => i.id === id);
    if (!item) return;

    await updateWantToBuyItem({ ...item, is_purchased: !item.is_purchased });
  }, [wantToBuyItems, updateWantToBuyItem]);

  /**
   * Get items by priority
   */
  const getItemsByPriority = useCallback((priority: 'Tinggi' | 'Sedang' | 'Rendah'): WantToBuyItem[] => {
    return wantToBuyItems.filter(item => item.priority === priority && !item.is_purchased);
  }, [wantToBuyItems]);

  /**
   * Get items by category
   */
  const getItemsByCategory = useCallback((category: 'Keinginan' | 'Kebutuhan'): WantToBuyItem[] => {
    return wantToBuyItems.filter(item => item.category === category && !item.is_purchased);
  }, [wantToBuyItems]);

  /**
   * Refresh items from database
   */
  const refreshItems = useCallback(async () => {
    await loadItems();
  }, [loadItems]);

  const value = useMemo(() => ({
    wantToBuyItems,
    isLoading,
    purchasedItems,
    pendingItems,
    totalWishlistValue,
    addWantToBuyItem,
    updateWantToBuyItem,
    deleteWantToBuyItem,
    togglePurchased,
    getItemsByPriority,
    getItemsByCategory,
    refreshItems,
  }), [
    wantToBuyItems,
    isLoading,
    purchasedItems,
    pendingItems,
    totalWishlistValue,
    addWantToBuyItem,
    updateWantToBuyItem,
    deleteWantToBuyItem,
    togglePurchased,
    getItemsByPriority,
    getItemsByCategory,
    refreshItems,
  ]);

  return (
    <WantToBuyContext.Provider value={value}>
      {children}
    </WantToBuyContext.Provider>
  );
};

/**
 * Custom hook to use want-to-buy context
 */
export const useWantToBuy = (): WantToBuyContextType => {
  const context = useContext(WantToBuyContext);
  if (context === undefined) {
    throw new Error('useWantToBuy must be used within a WantToBuyProvider');
  }
  return context;
};

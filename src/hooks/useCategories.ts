// Hook: useCategories
// Description: Manages category data with React Query for user-specific custom categories
// Provides CRUD operations for categories with proper caching and optimistic updates

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Category } from '@/types/categories';
import { transformCategory } from '@/types/categories';
import { useTranslation } from 'react-i18next';
import { getDefaultCategories } from '@/utils/categoryUtils';

interface CreateCategoryData {
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
}

interface UpdateCategoryData {
  id: string;
  name?: string;
  icon?: string;
  color?: string;
}

export const useCategories = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Fetch all accessible categories (default + user's custom)
  const {
    data: categories = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['categories', user?.id],
    queryFn: async (): Promise<Category[]> => {
      // Always return default categories if no user
      if (!user) return getDefaultCategories();

      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .or(`user_id.is.null,user_id.eq.${user.id}`)
          .order('type')
          .order('en_name');

        if (error) {
          // Check if it's a "relation does not exist" error
          if (error.code === '42P01' || error.message.includes('relation') || error.message.includes('does not exist')) {
            console.warn('Categories table does not exist, using default categories:', error);
            return getDefaultCategories();
          }
          // For any other database error, still return default categories to prevent app crash
          console.warn('Error fetching categories, using default categories:', error);
          return getDefaultCategories();
        }

        const transformedCategories = (data || []).map(item => transformCategory({
          ...item,
          id: item.category_id?.toString() || item.id || ''
        }));

        // Sort categories: custom categories first, then default categories
        return transformedCategories.sort((a, b) => {
          // First sort by type (expense/income)
          if (a.type !== b.type) {
            return a.type.localeCompare(b.type);
          }
          
          // Within same type, custom categories (with user_id) come first
          const aIsCustom = !!a.user_id;
          const bIsCustom = !!b.user_id;
          
          if (aIsCustom && !bIsCustom) return -1;
          if (!aIsCustom && bIsCustom) return 1;
          
          // Within same category type (custom or default), sort by name
          return a.en_name.localeCompare(b.en_name);
        });
      } catch (error: any) {
        // Always fallback to default categories if database is unavailable
        console.warn('Failed to fetch categories from database, using defaults:', error);
        return getDefaultCategories();
      }
    },
    enabled: true, // Always enabled, will return defaults if no user
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (gcTime replaces cacheTime in newer versions)
  });

  // Fetch categories by type
  const getCategoriesByType = (type: 'income' | 'expense') => {
    return categories.filter(category => category.type === type);
  };

  // Get user's custom categories only
  const getCustomCategories = () => {
    return categories.filter(category => category.user_id === user?.id);
  };

  // Get default categories only
  const getDefaultCategories = () => {
    return categories.filter(category => !category.user_id);
  };

  // Create new category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (categoryData: CreateCategoryData): Promise<Category> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Validate input
      if (!categoryData.name.trim()) {
        throw new Error('Category name is required');
      }

      if (!['income', 'expense'].includes(categoryData.type)) {
        throw new Error('Invalid category type');
      }

      // Check if category name already exists for this user
      const existingCategory = categories.find(
        cat => cat.en_name.toLowerCase() === categoryData.name.toLowerCase().trim() &&
               cat.type === categoryData.type &&
               (cat.user_id === user.id || !cat.user_id)
      );

      if (existingCategory) {
        throw new Error(`Category "${categoryData.name}" already exists for ${categoryData.type}`);
      }

      try {
        const { data, error } = await supabase
          .from('categories')
          .insert({
            en_name: categoryData.name.trim(),
            id_name: categoryData.name.trim(),
            category_key: `custom_${Date.now()}`,
            type: categoryData.type,
            icon: categoryData.icon || 'circle',
            color: categoryData.color || '#6B7280',
            user_id: user.id
          })
          .select()
          .single();

        if (error) {
          // Check if it's a "relation does not exist" error
          if (error.code === '42P01' || error.message.includes('relation') || error.message.includes('does not exist')) {
            throw new Error('Custom categories feature is not available in this version.');
          }
          console.error('Error creating category:', error);
          throw error;
        }

        return transformCategory({
          ...data,
          id: data.category_id?.toString() || data.id || ''
        });
      } catch (error: any) {
        if (error.message.includes('Custom categories feature is not available')) {
          throw error;
        }
        console.error('Error creating category:', error);
        throw new Error('Failed to create category. Please try again.');
      }
    },
    onSuccess: (newCategory) => {
      // Optimistically update the cache
      queryClient.setQueryData(['categories', user?.id], (oldCategories: Category[] = []) => {
        return [...oldCategories, newCategory].sort((a, b) => {
          if (a.type !== b.type) {
            return a.type.localeCompare(b.type);
          }
          return a.en_name.localeCompare(b.en_name);
        });
      });

      // 🔧 Only invalidate specific category queries to prevent cascade
      queryClient.invalidateQueries({ 
        queryKey: ['categories', user?.id],
        exact: true 
      });

      toast({
        title: t('categories.created'),
        description: t('categories.createSuccess', { name: newCategory.en_name }),
      });
    },
    onError: (error: Error) => {
      console.error('Error creating category:', error);
      toast({
        variant: 'destructive',
        title: t('categories.createError'),
        description: error.message,
      });
    },
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async (updateData: UpdateCategoryData): Promise<Category> => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const categoryId = parseInt(updateData.id, 10);
      if (isNaN(categoryId)) {
        throw new Error('Invalid category ID');
      }

      // Check if user owns this category
      const category = categories.find(cat => cat.id === updateData.id);
      if (!category) {
        throw new Error('Category not found');
      }

      if (category.user_id !== user.id) {
        throw new Error('You can only update your own categories');
      }

      const updatePayload: any = {};
      if (updateData.name) {
        updatePayload.en_name = updateData.name.trim();
        updatePayload.id_name = updateData.name.trim();
      }
      if (updateData.icon) updatePayload.icon = updateData.icon;
      if (updateData.color) updatePayload.color = updateData.color;

      try {
        const { data, error } = await supabase
          .from('categories')
          .update(updatePayload)
          .eq('category_id', categoryId)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) {
          // Check if it's a "relation does not exist" error
          if (error.code === '42P01' || error.message.includes('relation') || error.message.includes('does not exist')) {
            throw new Error('Custom categories feature is not available in this version.');
          }
          console.error('Error updating category:', error);
          throw error;
        }
      } catch (error: any) {
        if (error.message.includes('Custom categories feature is not available')) {
          throw error;
        }
        console.error('Error updating category:', error);
        throw new Error('Failed to update category. Please try again.');
      }

      return transformCategory({
        ...data,
        id: data.category_id?.toString() || data.id || ''
      });
    },
    onSuccess: (updatedCategory) => {
      // Optimistically update the cache
      queryClient.setQueryData(['categories', user?.id], (oldCategories: Category[] = []) => {
        return oldCategories.map(cat => 
          cat.id === updatedCategory.id ? updatedCategory : cat
        );
      });

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });

      toast({
        title: t('categories.updated'),
        description: t('categories.updateSuccess', { name: updatedCategory.en_name }),
      });
    },
    onError: (error: Error) => {
      console.error('Error updating category:', error);
      toast({
        variant: 'destructive',
        title: t('categories.updateError'),
        description: error.message,
      });
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string): Promise<void> => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const numericId = parseInt(categoryId, 10);
      if (isNaN(numericId)) {
        throw new Error('Invalid category ID');
      }

      // Check if user owns this category
      const category = categories.find(cat => cat.id === categoryId);
      if (!category) {
        throw new Error('Category not found');
      }

      if (category.user_id !== user.id) {
        throw new Error('You can only delete your own categories');
      }

      try {
        // Check if category is being used in transactions or budgets
        const [transactionsRes, budgetsRes] = await Promise.all([
          supabase
            .from('transactions')
            .select('id')
            .eq('category_id', numericId)
            .eq('user_id', user.id)
            .limit(1),
          supabase
            .from('budgets')
            .select('id')
            .eq('category_id', numericId)
            .eq('user_id', user.id)
            .limit(1)
        ]);

        if (transactionsRes.data && transactionsRes.data.length > 0) {
          throw new Error('Cannot delete category that is being used in transactions');
        }

        if (budgetsRes.data && budgetsRes.data.length > 0) {
          throw new Error('Cannot delete category that is being used in budgets');
        }

        const { error } = await supabase
          .from('categories')
          .delete()
          .eq('category_id', numericId)
          .eq('user_id', user.id);

        if (error) {
          // Check if it's a "relation does not exist" error
          if (error.code === '42P01' || error.message.includes('relation') || error.message.includes('does not exist')) {
            throw new Error('Custom categories feature is not available in this version.');
          }
          console.error('Error deleting category:', error);
          throw error;
        }
      } catch (error: any) {
        if (error.message.includes('Custom categories feature is not available') || 
            error.message.includes('Cannot delete category')) {
          throw error;
        }
        console.error('Error deleting category:', error);
        throw new Error('Failed to delete category. Please try again.');
      }
    },
    onSuccess: (_, categoryId) => {
      const deletedCategory = categories.find(cat => cat.id === categoryId);
      
      // Optimistically update the cache
      queryClient.setQueryData(['categories', user?.id], (oldCategories: Category[] = []) => {
        return oldCategories.filter(cat => cat.id !== categoryId);
      });

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });

      toast({
        title: t('categories.deleted'),
        description: t('categories.deleteSuccess', { 
          name: deletedCategory?.en_name || 'Category' 
        }),
      });
    },
    onError: (error: Error) => {
      console.error('Error deleting category:', error);
      toast({
        variant: 'destructive',
        title: t('categories.deleteError'),
        description: error.message,
      });
    },
  });

  return {
    // Data
    categories,
    isLoading,
    error,
    
    // Filtered data
    getCategoriesByType,
    getCustomCategories,
    getDefaultCategories,
    
    // Actions
    createCategory: createCategoryMutation.mutate,
    updateCategory: updateCategoryMutation.mutate,
    deleteCategory: deleteCategoryMutation.mutate,
    refetch,
    
    // Loading states
    isCreating: createCategoryMutation.isPending,
    isUpdating: updateCategoryMutation.isPending,
    isDeleting: deleteCategoryMutation.isPending,
  };
};

export default useCategories;